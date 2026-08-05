import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
} from 'antd';
import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';
import { useAppDispatch, useAppSelector } from '@/store';
import { refreshSession } from '@/store/authSlice';

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const { user, workspace } = useAppSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [sessions, setSessions] = useState<
    Array<{
      sessionId: string;
      current: boolean;
      createdAt: string;
      lastUsedAt: string;
      expiresAt: string;
      ip?: string;
      userAgent?: string;
    }>
  >([]);

  async function loadSessions() {
    const response = await api.get('/auth/sessions');
    setSessions(response.data.result);
  }

  useEffect(() => {
    if (workspace) {
      form.setFieldsValue({
        name: workspace.name,
        ...workspace.settings,
      });
    }
  }, [workspace, form]);

  useEffect(() => {
    void loadSessions();
  }, []);

  return (
    <>
      <PageHeader title="Workspace settings" description="Set shared defaults for how your team works and bills." />
      {user?.role === 'manager' && (
        <Alert type="info" showIcon message="Managers can update workspace preferences, but billing settings are Owner-only." />
      )}
      <Card className="settings-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              const settings: Record<string, unknown> = {
                timezone: values.timezone,
                weekStartsOn: values.weekStartsOn,
              };
              if (user?.role === 'owner') {
                settings.currency = values.currency;
                settings.defaultHourlyRate = values.defaultHourlyRate;
                settings.invoicePrefix = values.invoicePrefix;
              }
              await api.patch('/workspace', { name: values.name, settings });
              await dispatch(refreshSession());
              message.success('Workspace settings saved.');
            } catch (error) {
              message.error(getErrorMessage(error));
            }
          }}
        >
          <Row gutter={18}>
            <Col xs={24} md={12}><Form.Item name="name" label="Workspace name" rules={[{ required: true, min: 2 }]}><Input /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="timezone" label="Timezone" rules={[{ required: true }]}><Input placeholder="Asia/Kabul" /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="weekStartsOn" label="Week starts on"><Select options={[{ value: 1, label: 'Monday' }, { value: 0, label: 'Sunday' }, { value: 6, label: 'Saturday' }]} /></Form.Item></Col>
          </Row>
          {user?.role === 'owner' && (
            <>
              <h3>Billing defaults</h3>
              <Row gutter={18}>
                <Col xs={24} md={8}><Form.Item name="currency" label="Currency"><Input maxLength={3} /></Form.Item></Col>
                <Col xs={24} md={8}><Form.Item name="defaultHourlyRate" label="Default hourly rate"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={8}><Form.Item name="invoicePrefix" label="Invoice prefix"><Input maxLength={10} /></Form.Item></Col>
              </Row>
            </>
          )}
          <Button type="primary" htmlType="submit">Save settings</Button>
        </Form>
      </Card>
      <Card className="settings-card" title="Active sessions">
        <List
          dataSource={sessions}
          locale={{ emptyText: 'No active sessions.' }}
          renderItem={(session) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="revoke"
                  title="Revoke this session?"
                  onConfirm={async () => {
                    await api.delete(`/auth/sessions/${session.sessionId}`);
                    if (session.current) window.location.assign('/login');
                    else await loadSessions();
                  }}
                >
                  <Button danger type="link">Revoke</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {session.current ? <Tag color="green">Current</Tag> : <Tag>Session</Tag>}
                    <span>{session.userAgent || 'Unknown browser'}</span>
                  </Space>
                }
                description={`IP: ${session.ip || 'unknown'} · Last used: ${new Date(
                  session.lastUsedAt
                ).toLocaleString()}`}
              />
            </List.Item>
          )}
        />
        <Popconfirm
          title="Sign out every device?"
          description="You will need to sign in again on this device."
          onConfirm={async () => {
            await api.post('/auth/logout-all', {});
            localStorage.removeItem('workclub_identity');
            window.location.assign('/login');
          }}
        >
          <Button danger>Sign out all devices</Button>
        </Popconfirm>
      </Card>
    </>
  );
}
