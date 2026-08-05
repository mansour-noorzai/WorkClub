import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Avatar, Button, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag, Tabs } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';
import { useAppSelector } from '@/store';
import type { Client, User } from '@/types';

interface PendingInvite {
  _id: string;
  email: string;
  role: string;
  expiresAt: string;
}

interface PortalUser {
  _id: string;
  name: string;
  email: string;
  client?: { _id: string; name: string };
}

export function TeamPage() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [portalInvites, setPortalInvites] = useState<PendingInvite[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const role = Form.useWatch('role', form);

  const load = useCallback(async () => {
    const requests = [api.get('/team'), api.get('/client?limit=100')];
    if (currentUser?.role === 'owner') requests.push(api.get('/team/portal-access'));
    const [teamResponse, clientResponse, portalResponse] = await Promise.all(requests);
    setUsers(teamResponse.data.result.users);
    setInvites(teamResponse.data.result.invites);
    setClients(clientResponse.data.result);
    setPortalUsers(portalResponse?.data?.result?.users ?? []);
    setPortalInvites(portalResponse?.data?.result?.invites ?? []);
  }, [currentUser?.role]);
  useEffect(() => void load(), [load]);

  return (
    <>
      <PageHeader
        title="Team & access"
        description="Invite collaborators, assign the right role, and control client portal access."
        action={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Invite someone</Button>}
      />
      <Tabs
        items={[
          {
            key: 'team',
            label: `Team (${users.length})`,
            children: (
              <div className="table-card">
                <Table
                  rowKey="_id"
                  dataSource={users}
                  columns={[
                    { title: 'Person', render: (_, user) => <Space><Avatar>{user.name[0]}</Avatar><div><strong>{user.name}</strong><span className="cell-subtitle">{user.email}</span></div></Space> },
                    { title: 'Role', dataIndex: 'role', render: (value) => <Tag color={value === 'owner' ? 'purple' : 'blue'}>{value}</Tag> },
                    {
                      title: '',
                      render: (_, user) =>
                        user.role !== 'owner' && user._id !== currentUser?._id ? (
                          <Popconfirm title="Revoke this user’s access?" onConfirm={async () => {
                            try {
                              await api.delete(`/team/user/${user._id}`);
                              message.success('Team access revoked.');
                              await load();
                            } catch (error) {
                              message.error(getErrorMessage(error));
                            }
                          }}>
                            <Button aria-label={`Revoke ${user.name}`} type="text" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        ) : null,
                    },
                  ]}
                  scroll={{ x: 620 }}
                />
              </div>
            ),
          },
          {
            key: 'pending',
            label: `Pending (${invites.length})`,
            children: (
              <div className="table-card">
                <Table
                  rowKey="_id"
                  dataSource={invites}
                  columns={[
                    { title: 'Email', dataIndex: 'email' },
                    { title: 'Role', dataIndex: 'role', render: (value) => <Tag>{value}</Tag> },
                    { title: '', render: (_, invite) => <Button danger type="text" onClick={async () => {
                      try {
                        await api.delete(`/team/invite/${invite._id}`);
                        message.success('Invitation revoked.');
                        await load();
                      } catch (error) {
                        message.error(getErrorMessage(error));
                      }
                    }}>Revoke</Button> },
                  ]}
                  scroll={{ x: 520 }}
                />
              </div>
            ),
          },
          ...(currentUser?.role === 'owner'
            ? [{
                key: 'portal',
                label: `Client portal (${portalUsers.length + portalInvites.length})`,
                children: (
                  <Space direction="vertical" size={18} style={{ width: '100%' }}>
                    <div className="table-card">
                      <Table
                        rowKey="_id"
                        dataSource={portalUsers}
                        columns={[
                          { title: 'Client user', render: (_: unknown, user: PortalUser) => <div><strong>{user.name}</strong><span className="cell-subtitle">{user.email}</span></div> },
                          { title: 'Client', render: (_: unknown, user: PortalUser) => user.client?.name ?? '—' },
                          {
                            title: '',
                            render: (_: unknown, user: PortalUser) => (
                              <Popconfirm title="Revoke this client’s portal access?" onConfirm={async () => {
                                try {
                                  await api.delete(`/team/user/${user._id}`);
                                  message.success('Client portal access revoked.');
                                  await load();
                                } catch (error) {
                                  message.error(getErrorMessage(error));
                                }
                              }}>
                                <Button aria-label={`Revoke portal access for ${user.name}`} danger type="text" icon={<DeleteOutlined />} />
                              </Popconfirm>
                            ),
                          },
                        ]}
                        scroll={{ x: 620 }}
                      />
                    </div>
                    {portalInvites.length > 0 && (
                      <div className="table-card">
                        <Table
                          rowKey="_id"
                          dataSource={portalInvites}
                          columns={[
                            { title: 'Pending client invitation', dataIndex: 'email' },
                            { title: 'Expires', render: (_: unknown, invite: PendingInvite) => new Date(invite.expiresAt).toLocaleDateString() },
                            { title: '', render: (_: unknown, invite: PendingInvite) => (
                              <Button danger type="text" onClick={async () => {
                                try {
                                  await api.delete(`/team/invite/${invite._id}`);
                                  message.success('Client invitation revoked.');
                                  await load();
                                } catch (error) {
                                  message.error(getErrorMessage(error));
                                }
                              }}>Revoke</Button>
                            ) },
                          ]}
                          scroll={{ x: 560 }}
                        />
                      </div>
                    )}
                  </Space>
                ),
              }]
            : []),
        ]}
      />
      <Modal title="Send invitation" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Send invite">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: 'member' }}
          onFinish={async (values) => {
            try {
              const response = await api.post('/team/invite', values);
              message.success(response.data.result.emailStatus === 'sent' ? 'Invitation emailed.' : 'Invitation created.');
              if (response.data.result.inviteUrl) {
                await navigator.clipboard?.writeText(response.data.result.inviteUrl);
                message.info('Development invite link copied to clipboard.');
              }
              setOpen(false);
              form.resetFields();
              await load();
            } catch (error) {
              message.error(getErrorMessage(error));
            }
          }}
        >
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="role" label="Access role">
            <Select
              options={
                currentUser?.role === 'manager'
                  ? [{ value: 'member', label: 'Member' }]
                  : [
                      { value: 'manager', label: 'Manager' },
                      { value: 'member', label: 'Member' },
                      { value: 'client', label: 'Client portal user' },
                    ]
              }
            />
          </Form.Item>
          {role === 'client' && (
            <Form.Item name="client" label="Client" rules={[{ required: true }]}>
              <Select options={clients.map((client) => ({ value: client._id, label: client.name }))} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
