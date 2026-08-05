import { DeleteOutlined, EditOutlined, EyeOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, DatePicker, Descriptions, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';
import type { Client } from '@/types';

interface Proposal {
  _id: string;
  number: string;
  title: string;
  client: Client;
  status: string;
  validUntil: string;
  currency: string;
  total: number;
  notes?: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
}

export function ProposalsPage() {
  const [items, setItems] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  function openCreate() {
    form.resetFields();
    form.setFieldsValue({
      number: `PROP-${Date.now().toString().slice(-6)}`,
      validUntil: dayjs().add(14, 'day'),
      currency: 'USD',
      lineItems: [{ quantity: 1, unitPrice: 0 }],
    });
    setOpen(true);
  }

  async function load() {
    const [proposalResponse, clientResponse] = await Promise.all([
      api.get('/proposal?limit=100'),
      api.get('/client?limit=100'),
    ]);
    setItems(proposalResponse.data.result);
    setClients(clientResponse.data.result);
  }
  useEffect(() => void load(), []);

  return (
    <>
      <PageHeader
        title="Proposals"
        description="Shape the scope and commercial offer before work becomes a project."
        action={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New proposal</Button>}
      />
      <div className="table-card">
        <Table
          rowKey="_id"
          dataSource={items}
          columns={[
            { title: 'Proposal', render: (_, item) => <div><strong>{item.title}</strong><span className="cell-subtitle">{item.number}</span></div> },
            { title: 'Client', render: (_, item) => item.client?.name },
            { title: 'Valid until', render: (_, item) => dayjs(item.validUntil).format('D MMM YYYY') },
            { title: 'Value', render: (_, item) => `${item.currency} ${item.total.toLocaleString()}` },
            { title: 'Status', render: (_, item) => <Tag color={item.status === 'accepted' ? 'green' : item.status === 'sent' ? 'purple' : 'default'}>{item.status}</Tag> },
            {
              title: 'Actions',
              width: 240,
              render: (_, item) => (
                <Space>
                  <Button aria-label={`View ${item.title}`} type="text" icon={<EyeOutlined />} onClick={() => setSelected(item)} />
                  <Button
                    aria-label={`Edit ${item.title}`}
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditing(item);
                      editForm.setFieldsValue({
                        title: item.title,
                        status: item.status,
                        validUntil: dayjs(item.validUntil),
                        notes: item.notes,
                      });
                    }}
                  />
                  <Select
                    aria-label={`Status for ${item.title}`}
                    size="small"
                    value={item.status}
                    style={{ width: 110 }}
                    options={proposalStatusOptions(item.status).map((value) => ({ value, label: value }))}
                    onChange={async (status) => {
                      try {
                        await api.patch(`/proposal/${item._id}`, { status });
                        await load();
                      } catch (error) {
                        message.error(getErrorMessage(error));
                      }
                    }}
                  />
                  {['draft', 'declined', 'expired'].includes(item.status) && (
                    <Popconfirm
                      title="Delete this proposal?"
                      onConfirm={async () => {
                        try {
                          await api.delete(`/proposal/${item._id}`);
                          message.success('Proposal deleted.');
                          await load();
                        } catch (error) {
                          message.error(getErrorMessage(error));
                        }
                      }}
                    >
                      <Button aria-label={`Delete ${item.title}`} danger type="text" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]}
          scroll={{ x: 980 }}
        />
      </div>
      <Modal title="Create proposal" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Create proposal">
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await api.post('/proposal', {
                client: values.client,
                title: values.title,
                number: values.number,
                validUntil: values.validUntil.toISOString(),
                currency: values.currency,
                items: values.lineItems,
                notes: values.notes || undefined,
              });
              message.success('Proposal created.');
              setOpen(false);
              form.resetFields();
              await load();
            } catch (error) {
              message.error(getErrorMessage(error));
            }
          }}
        >
          <Form.Item name="title" label="Proposal title" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
          <Form.Item name="client" label="Client" rules={[{ required: true }]}><Select options={clients.map((client) => ({ value: client._id, label: client.name }))} /></Form.Item>
          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item name="number" label="Number" style={{ flex: 1 }}><Input /></Form.Item>
            <Form.Item name="validUntil" label="Valid until" style={{ flex: 1 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.List name="lineItems">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Space key={field.key} size={8} align="start" wrap style={{ display: 'flex' }}>
                    <Form.Item {...field} name={[field.name, 'description']} label={index === 0 ? 'Scope item' : undefined} rules={[{ required: true }]} style={{ flex: 3 }}><Input /></Form.Item>
                    <Form.Item {...field} name={[field.name, 'quantity']} label={index === 0 ? 'Qty' : undefined} rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0.01} style={{ width: '100%' }} /></Form.Item>
                    <Form.Item {...field} name={[field.name, 'unitPrice']} label={index === 0 ? 'Unit price' : undefined} rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
                    {fields.length > 1 && <Button aria-label={`Remove scope item ${index + 1}`} type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} style={{ marginTop: index === 0 ? 30 : 0 }} />}
                  </Space>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ quantity: 1, unitPrice: 0 })}>Add scope item</Button>
              </>
            )}
          </Form.List>
          <Form.Item name="currency" label="Currency"><Input maxLength={3} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
      <Modal title={selected?.title ?? 'Proposal details'} open={Boolean(selected)} footer={null} onCancel={() => setSelected(null)}>
        {selected && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Number">{selected.number}</Descriptions.Item>
            <Descriptions.Item label="Client">{selected.client?.name ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Status">{selected.status}</Descriptions.Item>
            <Descriptions.Item label="Valid until">{dayjs(selected.validUntil).format('D MMM YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Value">{selected.currency} {selected.total.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Scope">
              {selected.items.map((item) => `${item.description} — ${item.quantity} × ${item.unitPrice}`).join(', ')}
            </Descriptions.Item>
            <Descriptions.Item label="Notes">{selected.notes || '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
      <Modal title="Edit proposal" open={Boolean(editing)} onCancel={() => { setEditing(null); editForm.resetFields(); }} onOk={() => editForm.submit()} okText="Save changes">
        <Form
          form={editForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!editing) return;
            try {
              await api.patch(`/proposal/${editing._id}`, {
                title: values.title,
                status: values.status,
                validUntil: values.validUntil.toISOString(),
                notes: values.notes || undefined,
              });
              message.success('Proposal updated.');
              setEditing(null);
              editForm.resetFields();
              await load();
            } catch (error) {
              message.error(getErrorMessage(error));
            }
          }}
        >
          <Form.Item name="title" label="Proposal title" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
          <Form.Item name="status" label="Status"><Select options={proposalStatusOptions(editing?.status ?? 'draft').map((value) => ({ value, label: value }))} /></Form.Item>
          <Form.Item name="validUntil" label="Valid until" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function proposalStatusOptions(status: string) {
  const transitions: Record<string, string[]> = {
    draft: ['draft', 'sent'],
    sent: ['sent', 'accepted', 'declined', 'expired'],
    accepted: ['accepted'],
    declined: ['declined'],
    expired: ['expired'],
  };
  return transitions[status] ?? [status];
}
