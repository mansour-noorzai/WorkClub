import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "@/router";
import { api, getErrorMessage } from "@/api/client";
import { PageHeader } from "@/components/PageHeader";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchTasks, moveTask } from "@/store/tasksSlice";
import type { Project, Task } from "@/types";

const columns: Array<{ key: Task["status"]; title: string }> = [
  { key: "todo", title: "To Do" },
  { key: "in_progress", title: "In Progress" },
  { key: "review", title: "Review" },
  { key: "done", title: "Done" },
];

export function ProjectBoardPage() {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading } = useAppSelector((state) => state.tasks);
  const user = useAppSelector((state) => state.auth.user);
  const canManage = user?.role === "owner" || user?.role === "manager";
  const [project, setProject] = useState<Project>();
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detail, setDetail] = useState<Task | null>(null);
  const [comment, setComment] = useState("");
  const [dragged, setDragged] = useState<string>();
  const [running, setRunning] = useState<any>();
  const [form] = Form.useForm();

  function openTaskForm(task?: Task) {
    const assignee = task
      ? typeof task.assignee === "string"
        ? task.assignee
        : task.assignee._id
      : undefined;
    setEditingTask(task ?? null);
    form.resetFields();
    form.setFieldsValue(
      task
        ? {
            title: task.title,
            description: task.description,
            assignee,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? dayjs(task.dueDate) : undefined,
          }
        : { status: "todo", priority: "medium" },
    );
    setOpen(true);
  }

  async function openDetails(taskId: string) {
    try {
      const response = await api.get(`/task/${taskId}`);
      setDetail(response.data.result);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  const load = useCallback(async () => {
    const [projectResponse, runningResponse] = await Promise.all([
      api.get(`/project/${id}`),
      api.get("/timeentry/running"),
    ]);
    setProject(projectResponse.data.result);
    setRunning(runningResponse.data.result);
    await dispatch(fetchTasks(id));
  }, [dispatch, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleTimer(task: Task) {
    try {
      const runningResponse = await api.get("/timeentry/running");
      const currentRunning = runningResponse.data.result as {
        _id?: string;
      } | null;

      if (currentRunning?._id) {
        await api.patch(`/timeentry/${currentRunning._id}/stop`, {});
      } else {
        await api.post("/timeentry/start", { task: task._id, billable: true });
      }

      await load();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/projects")}
      >
        All projects
      </Button>
      <PageHeader
        title={project?.name ?? "Project board"}
        description={`${project?.code ?? ""} · Move work from idea to done.`}
        action={
          canManage ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openTaskForm()}
            >
              Add task
            </Button>
          ) : undefined
        }
      />
      {loading ? (
        <Spin />
      ) : (
        <div className="kanban">
          {columns.map((column) => {
            const columnTasks = items.filter(
              (task) => task.status === column.key,
            );
            return (
              <section
                className="kanban-column"
                key={column.key}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragged) {
                    void dispatch(
                      moveTask({
                        id: dragged,
                        status: column.key,
                        sortOrder: columnTasks.length,
                      }),
                    );
                    setDragged(undefined);
                  }
                }}
              >
                <div className="kanban-column-title">
                  <strong>{column.title}</strong>
                  <span>{columnTasks.length}</span>
                </div>
                {columnTasks.map((task) => {
                  const assignee =
                    typeof task.assignee === "string"
                      ? undefined
                      : task.assignee;
                  const isRunning =
                    running?.task?._id === task._id ||
                    running?.task === task._id;
                  return (
                    <Card
                      size="small"
                      className="task-card"
                      key={task._id}
                      draggable
                      onDragStart={() => setDragged(task._id)}
                    >
                      <div className="task-tags">
                        <Tag color={priorityColor(task.priority)}>
                          {task.priority}
                        </Tag>
                        {task.dueDate && (
                          <span>{dayjs(task.dueDate).format("D MMM")}</span>
                        )}
                      </div>
                      <button className="task-title-button" onClick={() => void openDetails(task._id)}>
                        <h4>{task.title}</h4>
                      </button>
                      <div className="task-footer">
                        <Space>
                          <Avatar size="small">
                            {assignee?.name?.[0] ?? "?"}
                          </Avatar>
                          <span>{assignee?.name ?? "Assigned"}</span>
                        </Space>
                        <Button
                          size="small"
                          type={isRunning ? "primary" : "text"}
                          danger={isRunning}
                          icon={<ClockCircleOutlined />}
                          onClick={(event) => {
                            event.stopPropagation();
                            void toggleTimer(task);
                          }}
                        >
                          {isRunning ? "Stop" : "Track"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
      <Modal
        title={editingTask ? "Edit task" : "Add task"}
        open={open}
        onCancel={() => { setOpen(false); setEditingTask(null); form.resetFields(); }}
        onOk={() => form.submit()}
        okText={editingTask ? "Save changes" : "Add task"}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              const payload = {
                title: values.title,
                description: values.description || undefined,
                assignee: values.assignee,
                status: values.status,
                priority: values.priority,
                dueDate: values.dueDate?.toISOString(),
              };
              if (editingTask) {
                await api.patch(`/task/${editingTask._id}`, payload);
              } else {
                await api.post("/task", { ...payload, project: id });
              }
              message.success(editingTask ? "Task updated." : "Task added.");
              setOpen(false);
              setEditingTask(null);
              form.resetFields();
              await load();
            } catch (error) {
              message.error(getErrorMessage(error));
            }
          }}
        >
          <Form.Item
            name="title"
            label="Task title"
            rules={[{ required: true, min: 2 }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="assignee"
            label="Assignee"
            rules={[{ required: true }]}
          >
            <Select
              options={(project?.teamMembers ?? []).map((member) => ({
                value: member._id,
                label: member.name,
              }))}
            />
          </Form.Item>
          <Space size={12} style={{ display: "flex" }}>
            <Form.Item name="status" label="Column" style={{ flex: 1 }}>
              <Select
                options={columns.map((column) => ({
                  value: column.key,
                  label: column.title,
                }))}
              />
            </Form.Item>
            <Form.Item name="priority" label="Priority" style={{ flex: 1 }}>
              <Select
                options={["low", "medium", "high", "urgent"].map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </Form.Item>
          </Space>
          <Form.Item name="dueDate" label="Due date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        width={620}
        title={detail?.title ?? "Task details"}
        open={Boolean(detail)}
        onCancel={() => { setDetail(null); setComment(""); }}
        footer={
          <Space>
            {canManage && detail && (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    const task = detail;
                    setDetail(null);
                    openTaskForm(task);
                  }}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Delete this task?"
                  onConfirm={async () => {
                    try {
                      await api.delete(`/task/${detail._id}`);
                      message.success("Task deleted.");
                      setDetail(null);
                      await load();
                    } catch (error) {
                      message.error(getErrorMessage(error));
                    }
                  }}
                >
                  <Button danger icon={<DeleteOutlined />}>Delete</Button>
                </Popconfirm>
              </>
            )}
            <Button onClick={() => setDetail(null)}>Close</Button>
          </Space>
        }
      >
        {detail && (
          <div className="task-detail">
            <p>{detail.description || "No description provided."}</p>
            <Space wrap>
              <Tag color={priorityColor(detail.priority)}>{detail.priority}</Tag>
              <Select
                aria-label="Task status"
                value={detail.status}
                style={{ width: 150 }}
                options={columns.map((column) => ({ value: column.key, label: column.title }))}
                onChange={async (status) => {
                  try {
                    await api.patch(`/task/${detail._id}/move`, { status, sortOrder: detail.sortOrder });
                    await load();
                    await openDetails(detail._id);
                  } catch (error) {
                    message.error(getErrorMessage(error));
                  }
                }}
              />
              {detail.dueDate && <span>Due {dayjs(detail.dueDate).format("D MMM YYYY")}</span>}
            </Space>
            <h4>Comments</h4>
            <div className="task-comments">
              {(detail.comments ?? []).map((item, index) => {
                const author = typeof item.author === "string" ? "Team member" : item.author.name;
                return (
                  <div className="task-comment" key={item._id ?? `${item.createdAt}-${index}`}>
                    <strong>{author}</strong>
                    <span>{item.message}</span>
                  </div>
                );
              })}
              {!detail.comments?.length && <span className="cell-subtitle">No comments yet.</span>}
            </div>
            <Space.Compact style={{ width: "100%" }}>
              <Input
                aria-label="Add a comment"
                value={comment}
                maxLength={2000}
                placeholder="Add a comment"
                onChange={(event) => setComment(event.target.value)}
                onPressEnter={() => document.getElementById("submit-task-comment")?.click()}
              />
              <Button
                id="submit-task-comment"
                type="primary"
                disabled={!comment.trim()}
                onClick={async () => {
                  try {
                    await api.post(`/task/${detail._id}/comments`, { message: comment.trim() });
                    setComment("");
                    await openDetails(detail._id);
                  } catch (error) {
                    message.error(getErrorMessage(error));
                  }
                }}
              >
                Comment
              </Button>
            </Space.Compact>
          </div>
        )}
      </Modal>
    </>
  );
}

function priorityColor(priority: Task["priority"]) {
  return { low: "default", medium: "blue", high: "orange", urgent: "red" }[
    priority
  ];
}
