import { Alert, Button, Card, Form, Input, Result } from 'antd';
import { useState } from 'react';
import { publicPost, getErrorMessage } from '@/api/client';
import { Logo } from '@/components/Logo';
import { Link } from '@/router';
import type { ApiResponse } from '@/types';

export function ForgotPasswordPage() {
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<{ message: string; resetUrl?: string }>();

  if (result) {
    return (
      <Result
        status="success"
        title="Check your email"
        subTitle={result.message}
        extra={[
          ...(result.resetUrl
            ? [
                <Button key="reset" type="primary" href={result.resetUrl}>
                  Open development reset link
                </Button>,
              ]
            : []),
          <Button key="login" href="/login">Return to sign in</Button>,
        ]}
      />
    );
  }

  return (
    <div className="simple-auth-page">
      <Card className="auth-card">
        <Logo />
        <h1>Reset your password</h1>
        <p>Enter your account email and we will send a time-limited reset link.</p>
        {error && <Alert type="error" message={error} showIcon />}
        <Form
          layout="vertical"
          onFinish={async (values) => {
            try {
              const response = await publicPost<
                ApiResponse<{ message: string; resetUrl?: string }>
              >('/auth/request-password-reset', values);
              setResult(response.result);
            } catch (requestError) {
              setError(getErrorMessage(requestError));
            }
          }}
        >
          <Form.Item name="email" label="Work email" rules={[{ required: true, type: 'email' }]}>
            <Input size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>
            Send reset link
          </Button>
        </Form>
        <div className="auth-switch"><Link to="/login">Return to sign in</Link></div>
      </Card>
    </div>
  );
}
