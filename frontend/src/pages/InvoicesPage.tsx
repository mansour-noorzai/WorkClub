import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, DatePicker, Descriptions, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';
import { useAppSelector } from '@/store';
import type { Project } from '@/types';

interface Invoice {
  _id: string;
  number: string;
  project: Project;
  client: { name: string };
  issueDate: string;
  dueDate: string;
  status: string;
  currency: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  subTotal: number;
  taxRate: number;
  taxTotal: number;
  total: number;
  notes?: string;
  paidAt?: string;
}

interface BillableEntry {
  _id: string;
  durationMinutes: number;
  startAt: string;
  task: { title: string };
  user: { name: string };
}

export function InvoicesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) => state.auth.workspace);
  const [items, setItems] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<BillableEntry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [form] = Form.useForm();

  async function load() {
    const [invoiceResponse, projectResponse] = await Promise.all([
      api.get('/invoice?limit=100'),
      api.get('/project?limit=100'),
    ]);
    setItems(invoiceResponse.data.result);
    setProjects(projectResponse.data.result);
  }

  useEffect(() => {
    void load();
  }, []);

  async function loadBillable(projectId: string) {
    const response = await api.get(`/timeentry/billable?project=${projectId}`);
    setEntries(response.data.result);
    setSelected(response.data.result.map((entry: BillableEntry) => entry._id));
  }

  function openCreate() {
    form.resetFields();
    form.setFieldsValue({
      number: `${workspace?.settings.invoicePrefix || 'INV'}-${Date.now().toString().slice(-6)}`,
      dueDate: dayjs().add(14, 'day'),
      hourlyRate: workspace?.settings.defaultHourlyRate || 0,
      taxRate: 0,
    });
    setEntries([]);
    setSelected([]);
    setOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Turn approved billable time into clear client invoices."
        action={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Invoice billable time</Button>}
      />
      <div className="table-card">
        <Table
          rowKey="_id"
          dataSource={items}
          columns={[
            { title: 'Invoice', dataIndex: 'number', render: (value) => <strong>{value}</strong> },
            { title: 'Project', render: (_, item) => item.project?.name ?? '—' },
            { title: 'Client', render: (_, item) => item.client?.name ?? '—' },
            { title: 'Due', render: (_, item) => dayjs(item.dueDate).format('D MMM YYYY') },
            { title: 'Total', render: (_, item) => `${item.currency} ${item.total.toLocaleString()}` },
            {
              title: 'Status',
              render: (_, item) => (
                <Select
                  size="small"
                  value={item.status}
                  style={{ width: 120 }}
                  onChange={async (status) => {
                    try {
                      await api.patch(`/invoice/${item._id}`, { status });
                      message.success(`Invoice marked ${status}.`);
                      await load();
                    } catch (error) {
                      message.error(getErrorMessage(error));
                    }
                  }}
                  options={invoiceStatusOptions(item.status).map((value) => ({ value, label: value }))}
                />
              ),
            },
            {
              title: 'Actions',
              width: 110,
              render: (_, item) => (
                <Space>
                  <Button aria-label={`View invoice ${item.number}`} type="text" icon={<EyeOutlined />} onClick={() => setViewing(item)} />
                  {user?.role === 'owner' && ['draft', 'void'].includes(item.status) && (
                    <Popconfirm
                      title="Delete this invoice?"
                      description="Linked time entries will become billable again."
                      onConfirm={async () => {
                        try {
                          await api.delete(`/invoice/${item._id}`);
                          message.success('Invoice deleted and time entries released.');
                          await load();
                        } catch (error) {
                          message.error(getErrorMessage(error));
                        }
                      }}
                    >
                      <Button aria-label={`Delete invoice ${item.number}`} danger type="text" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]}
          scroll={{ x: 980 }}
        />
      </div>
      <Modal width={720} title="Invoice billable time" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Create draft">
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            if (!selected.length) return message.warning('Select at least one billable entry.');
            try {
              await api.post('/invoice/from-time', {
                project: values.project,
                timeEntries: selected,
                number: values.number,
                dueDate: values.dueDate.toISOString(),
                hourlyRate: values.hourlyRate,
                taxRate: values.taxRate,
                notes: values.notes || undefined,
              });
              message.success('Draft invoice created.');
              setOpen(false);
              setEntries([]);
              form.resetFields();
              await load();
            } catch (error) {
              message.error(getErrorMessage(error));
            }
          }}
        >
          <Form.Item name="project" label="Project" rules={[{ required: true }]}>
            <Select onChange={loadBillable} options={projects.map((project) => ({ value: project._id, label: `${project.code} · ${project.name}` }))} />
          </Form.Item>
          {entries.length > 0 && (
            <div className="billable-list">
              {entries.map((entry) => (
                <Checkbox
                  key={entry._id}
                  checked={selected.includes(entry._id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked ? [...current, entry._id] : current.filter((id) => id !== entry._id)
                    )
                  }
                >
                  {entry.task.title} · {entry.user.name} · {(entry.durationMinutes / 60).toFixed(1)}h
                </Checkbox>
              ))}
            </div>
          )}
          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item name="number" label="Invoice number" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item>
            <Form.Item name="dueDate" label="Due date" rules={[{ required: true }]} style={{ flex: 1 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item name="hourlyRate" label="Hourly rate" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="taxRate" label="Tax %" style={{ flex: 1 }}><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.Item name="notes" label="Client note"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
      <Modal title={viewing ? `Invoice ${viewing.number}` : 'Invoice details'} open={Boolean(viewing)} footer={null} onCancel={() => setViewing(null)}>
        {viewing && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Project">{viewing.project?.name ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Client">{viewing.client?.name ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag>{viewing.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Issued">{dayjs(viewing.issueDate).format('D MMM YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Due">{dayjs(viewing.dueDate).format('D MMM YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Items">
              {viewing.items.map((item) => `${item.description} — ${item.quantity} × ${item.unitPrice}`).join(', ')}
            </Descriptions.Item>
            <Descriptions.Item label="Subtotal">{viewing.currency} {viewing.subTotal.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label={`Tax (${viewing.taxRate}%)`}>{viewing.currency} {viewing.taxTotal.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Total"><strong>{viewing.currency} {viewing.total.toLocaleString()}</strong></Descriptions.Item>
            <Descriptions.Item label="Paid">{viewing.paidAt ? dayjs(viewing.paidAt).format('D MMM YYYY, HH:mm') : '—'}</Descriptions.Item>
            <Descriptions.Item label="Notes">{viewing.notes || '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
}

function invoiceStatusOptions(status: string) {
  const transitions: Record<string, string[]> = {
    draft: ['draft', 'sent', 'void'],
    sent: ['sent', 'paid', 'overdue', 'void'],
    overdue: ['overdue', 'paid', 'void'],
    paid: ['paid'],
    void: ['void'],
  };
  return transitions[status] ?? [status];
}
