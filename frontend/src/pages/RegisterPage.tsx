import { Alert, Button, Card, Form, Input, Result } from 'antd';
import { useState } from 'react';
import { Link } from '@/router';
import { getErrorMessage, publicPost } from '@/api/client';
import { Logo } from '@/components/Logo';

const strongPasswordRules = [
  { required: true, min: 10 },
  { pattern: /[a-z]/, message: 'Add a lowercase letter.' },
  { pattern: /[A-Z]/, message: 'Add an uppercase letter.' },
  { pattern: /[0-9]/, message: 'Add a number.' },
  { pattern: /[^A-Za-z0-9]/, message: 'Add a special character.' },
];

export function RegisterPage() {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string>();

  if (verificationUrl) {
    return (
      <Result
        status="success"
        title="Check your email"
        subTitle="Your workspace is ready. Verify your email address before signing in."
        extra={
          verificationUrl.startsWith('http') ? (
            <Button type="primary" href={verificationUrl}>
              Open development verification link
            </Button>
          ) : (
            <Button type="primary" href="/login">Go to sign in</Button>
          )
        }
      />
    );
  }

  return (
    <div className="simple-auth-page">
      <Card className="auth-card">
        <Logo />
        <h1>Create your WorkClub</h1>
        <p>Start a workspace for your agency or freelance team.</p>
        {error && <Alert type="error" message={error} showIcon />}
        <Form
          layout="vertical"
          onFinish={async (values) => {
            setLoading(true);
            setError(undefined);
            try {
              const response = await publicPost<{
                success: true;
                result: { requiresVerification: boolean; verificationUrl?: string };
              }>('/auth/register-workspace', values);
              if (response.result.requiresVerification) {
                setVerificationUrl(response.result.verificationUrl || '/login');
              } else {
                window.location.assign('/dashboard');
              }
            } catch (requestError) {
              setError(getErrorMessage(requestError));
              setLoading(false);
            }
          }}
        >
          <Form.Item name="workspaceName" label="Workspace name" rules={[{ required: true, min: 2 }]}>
            <Input size="large" placeholder="Northstar Studio" />
          </Form.Item>
          <Form.Item name="name" label="Your name" rules={[{ required: true, min: 2 }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="email" label="Work email" rules={[{ required: true, type: 'email' }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            extra="Use 10+ characters with uppercase, lowercase, number and symbol."
            rules={strongPasswordRules}
          >
            <Input.Password size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            Create workspace
          </Button>
        </Form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </Card>
    </div>
  );
}
