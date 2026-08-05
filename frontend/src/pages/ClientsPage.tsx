import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';
import type { ApiResponse, Client } from '@/types';

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form] = Form.useForm();

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ companySize: '2-10', status: 'lead' });
    setOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    form.setFieldsValue({
      name: client.name,
      contactName: client.primaryContact.name,
      email: client.primaryContact.email,
      phone: client.primaryContact.phone,
      contactTitle: client.primaryContact.title,
      companySize: client.companySize,
      status: client.status,
      country: client.country,
      address: client.address,
      notes: client.notes,
    });
    setOpen(true);
  }

  async function load() {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Client[]>>('/client?limit=100');
      setClients(response.data.result);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <PageHeader
        title="Clients"
        description="Keep contacts and the work you deliver for them connected."
        action={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add client</Button>}
      />
      <div className="table-card">
        <Table
          loading={loading}
          rowKey="_id"
          dataSource={clients}
          columns={[
            {
              title: 'Client',
              render: (_, item) => (
                <div>
                  <strong>{item.name}</strong>
                  <span className="cell-subtitle">{item.primaryContact.name}</span>
                </div>
              ),
            },
            { title: 'Contact', render: (_, item) => item.primaryContact.email ?? '—' },
            { title: 'Company size', dataIndex: 'companySize' },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (value) => <Tag color={value === 'active' ? 'green' : value === 'lead' ? 'blue' : 'default'}>{value}</Tag>,
            },
            {
              title: 'Actions',
              width: 120,
              render: (_, item) => (
                <Space>
                  <Button aria-label={`Edit ${item.name}`} type="text" icon={<EditOutlined />} onClick={() => openEdit(item)} />
                  <Popconfirm
                    title="Archive this client?"
                    description="Active projects must be completed or archived first."
                    onConfirm={async () => {
                      try {
                        await api.delete(`/client/${item._id}`);
                        message.success('Client archived.');
                        await load();
                      } catch (error) {
                        message.error(getErrorMessage(error));
                      }
                    }}
                  >
                    <Button aria-label={`Archive ${item.name}`} danger type="text" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          scroll={{ x: 720 }}
        />
      </div>
      <Modal
        title={editing ? 'Edit client' : 'Add client'}
        open={open}
        okText={editing ? 'Save changes' : 'Create client'}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              const payload = {
                name: values.name,
                companySize: values.companySize,
                status: values.status,
                primaryContact: {
                  name: values.contactName,
                  email: values.email || undefined,
                  phone: values.phone || undefined,
                  title: values.contactTitle || undefined,
                },
                country: values.country || undefined,
                address: values.address || undefined,
                notes: values.notes || undefined,
              };
              if (editing) await api.patch(`/client/${editing._id}`, payload);
              else await api.post('/client', payload);
              message.success(editing ? 'Client updated.' : 'Client created.');
              setOpen(false);
              setEditing(null);
              form.resetFields();
              await load();
            } catch (error) {
              message.error(getErrorMessage(error));
            }
          }}
        >
          <Form.Item name="name" label="Company or client name" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label="Primary contact" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item name="email" label="Email" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Phone" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item name="contactTitle" label="Contact title" style={{ flex: 1 }}><Input /></Form.Item>
            <Form.Item name="country" label="Country" style={{ flex: 1 }}><Input /></Form.Item>
          </Space>
          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item name="companySize" label="Company size" style={{ flex: 1 }}>
              <Select options={['solo', '2-10', '11-50', '51-200', '201+'].map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="status" label="Status" style={{ flex: 1 }}>
              <Select options={['lead', 'active', 'archived'].map((value) => ({ value, label: value }))} />
            </Form.Item>
          </Space>
          <Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="notes" label="Internal notes"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
