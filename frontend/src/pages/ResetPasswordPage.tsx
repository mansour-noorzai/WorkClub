import { Alert, Button, Card, Form, Input, Result } from 'antd';
import { useState } from 'react';
import { publicPost, getErrorMessage } from '@/api/client';
import { Logo } from '@/components/Logo';
import { useSearchParams } from '@/router';
import type { ApiResponse, User } from '@/types';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const token = params.get('token');

  if (!token) return <Result status="error" title="Password-reset token is missing." />;
  if (done) {
    return (
      <Result
        status="success"
        title="Password updated"
        subTitle="All previous sessions were revoked."
        extra={<Button type="primary" href="/dashboard">Continue to WorkClub</Button>}
      />
    );
  }

  return (
    <div className="simple-auth-page">
      <Card className="auth-card">
        <Logo />
        <h1>Choose a new password</h1>
        {error && <Alert type="error" message={error} showIcon />}
        <Form
          layout="vertical"
          onFinish={async (values) => {
            try {
              await publicPost<ApiResponse<{ user: User }>>('/auth/reset-password', {
                token,
                password: values.password,
              });
              setDone(true);
            } catch (requestError) {
              setError(getErrorMessage(requestError));
            }
          }}
        >
          <Form.Item
            name="password"
            label="New password"
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
          <Form.Item
            name="confirm"
            label="Confirm password"
            dependencies={['password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  return !value || getFieldValue('password') === value
                    ? Promise.resolve()
                    : Promise.reject(new Error('Passwords do not match.'));
                },
              }),
            ]}
          >
            <Input.Password size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>
            Update password
          </Button>
        </Form>
      </Card>
    </div>
  );
}
