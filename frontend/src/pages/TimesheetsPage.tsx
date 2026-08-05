import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/api/client";
import { PageHeader } from "@/components/PageHeader";
import { useAppSelector } from "@/store";
import type { Task, User } from "@/types";

interface Entry {
  _id: string;
  startAt: string;
  durationMinutes: number;
  billable: boolean;
  notes?: string;
  task: { _id: string; title: string };
  project: { name: string; code: string };
  invoice?: string;
}

export function TimesheetsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const canManage = user?.role === "owner" || user?.role === "manager";
  const [week, setWeek] = useState<Dayjs>(
    dayjs().startOf("week").add(1, "day"),
  );
  const [selectedUser, setSelectedUser] = useState(user?._id);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totals, setTotals] = useState({ totalMinutes: 0, billableMinutes: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    const query = new URLSearchParams({
      weekStart: week.startOf("day").toISOString(),
      ...(selectedUser ? { user: selectedUser } : {}),
    });
    const response = await api.get(`/timeentry/weekly?${query}`);
    setEntries(response.data.result.entries);
    setTotals(response.data.result);
  }, [selectedUser, week]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void api
      .get("/task?limit=100")
      .then((response) => setTasks(response.data.result));
    if (canManage) {
      void api
        .get("/team")
        .then((response) => setTeam(response.data.result.users));
    }
  }, [canManage]);

  function openManualEntry() {
    form.resetFields();
    form.setFieldsValue({
      startAt: dayjs().subtract(60, "minute"),
      durationMinutes: 60,
      billable: true,
    });
    setOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Timesheets"
        description="Track actual effort and keep billable time ready for invoicing."
        action={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openManualEntry}
          >
            Manual entry
          </Button>
        }
      />
      <div className="toolbar-card">
        <Space wrap>
          <DatePicker
            value={week}
            onChange={(value) =>
              value && setWeek(value.startOf("week").add(1, "day"))
            }
          />
          {canManage && (
            <Select
              style={{ minWidth: 220 }}
              value={selectedUser}
              onChange={setSelectedUser}
              options={team.map((member) => ({
                value: member._id,
                label: member.name,
              }))}
            />
          )}
          <Statistic
            title="Total"
            value={(totals.totalMinutes / 60).toFixed(1)}
            suffix="h"
          />
          <Statistic
            title="Billable"
            value={(totals.billableMinutes / 60).toFixed(1)}
            suffix="h"
          />
        </Space>
      </div>
      <div className="table-card">
        <Table
          rowKey="_id"
          dataSource={entries}
          columns={[
            {
              title: "Date",
              render: (_, item) => dayjs(item.startAt).format("ddd, D MMM"),
            },
            {
              title: "Project",
              render: (_, item) =>
                `${item.project.code} · ${item.project.name}`,
            },
            { title: "Task", render: (_, item) => item.task.title },
            {
              title: "Time",
              render: (_, item) =>
                `${Math.floor(item.durationMinutes / 60)}h ${item.durationMinutes % 60}m`,
            },
            {
              title: "Billing",
              render: (_, item) =>
                item.billable ? (
                  <Tag color={item.invoice ? "purple" : "green"}>
                    {item.invoice ? "Invoiced" : "Billable"}
                  </Tag>
                ) : (
                  <Tag>Internal</Tag>
                ),
            },
            {
              title: "Actions",
              width: 80,
              render: (_, item) =>
                item.invoice ? null : (
                  <Popconfirm
                    title="Delete this time entry?"
                    onConfirm={async () => {
                      try {
                        await api.delete(`/timeentry/${item._id}`);
                        message.success("Time entry deleted.");
                        await load();
                      } catch (error) {
                        message.error(getErrorMessage(error));
                      }
                    }}
                  >
                    <Button
                      aria-label={`Delete time entry for ${item.task.title}`}
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                ),
            },
          ]}
          scroll={{ x: 850 }}
        />
      </div>
      <Modal
        title="Add time manually"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Add entry"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await api.post("/timeentry/manual", {
                task: values.task,
                startAt: values.startAt.toISOString(),
                durationMinutes: values.durationMinutes,
                billable: values.billable,
                notes: values.notes || undefined,
              });
              message.success("Time entry added.");
              setOpen(false);
              form.resetFields();
              await load();
            } catch (error) {
              message.error(getErrorMessage(error));
            }
          }}
        >
          <Form.Item name="task" label="Task" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={tasks.map((task) => ({
                value: task._id,
                label: task.title,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="startAt"
            label="Date and start time"
            rules={[{ required: true }]}
          >
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="durationMinutes"
            label="Duration in minutes"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={1440} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="billable" label="Billing">
            <Select
              options={[
                { value: true, label: "Billable" },
                { value: false, label: "Internal / non-billable" },
              ]}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
