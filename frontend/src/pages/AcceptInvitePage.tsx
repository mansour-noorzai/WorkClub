import { Alert, Button, Card, Form, Input, Result } from 'antd';
import { useState } from 'react';
import { useSearchParams } from '@/router';
import { getErrorMessage, publicPost } from '@/api/client';
import { Logo } from '@/components/Logo';

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const token = params.get('token');

  if (!token) return <Result status="error" title="Invitation token is missing." />;
  if (done) {
    return (
      <Result
        status="success"
        title="Your WorkClub account is ready."
        extra={<Button type="primary" href="/login">Sign in</Button>}
      />
    );
  }

  return (
    <div className="simple-auth-page">
      <Card className="auth-card">
        <Logo />
        <h1>Join your workspace</h1>
        <p>Create your account to accept the invitation.</p>
        {error && <Alert type="error" message={error} showIcon />}
        <Form
          layout="vertical"
          onFinish={async (values) => {
            try {
              await publicPost('/auth/accept-invite', { token, ...values });
              setDone(true);
            } catch (requestError) {
              setError(getErrorMessage(requestError));
            }
          }}
        >
          <Form.Item name="name" label="Your name" rules={[{ required: true, min: 2 }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            extra="Use 10+ characters with uppercase, lowercase, number and symbol."
            rules={[
              { required: true, min: 10 },
              { pattern: /[a-z]/, message: 'Add a lowercase letter.' },
              { pattern: /[A-Z]/, message: 'Add an uppercase letter.' },
              { pattern: /[0-9]/, message: 'Add a number.' },
              { pattern: /[^A-Za-z0-9]/, message: 'Add a special character.' },
            ]}
          >
            <Input.Password size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>
            Accept invitation
          </Button>
        </Form>
      </Card>
    </div>
  );
}
