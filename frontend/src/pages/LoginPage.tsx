import { ArrowRightOutlined, ClockCircleOutlined, ProjectOutlined, TeamOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { Link, Navigate, useNavigate } from '@/router';
import { Logo } from '@/components/Logo';
import { useAppDispatch, useAppSelector } from '@/store';
import { login } from '@/store/authSlice';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  if (user) return <Navigate to={user.role === 'client' ? '/portal' : '/dashboard'} replace />;

  return (
    <div className="auth-page">
      <section className="auth-story">
        <Logo />
        <div>
          <span className="auth-kicker">Client work, together</span>
          <h1>One calm place for the work your team delivers.</h1>
          <p>
            Plan projects, move tasks, track billable hours, and keep clients informed without
            stitching together five different tools.
          </p>
          <div className="feature-row">
            <span><ProjectOutlined /> Project clarity</span>
            <span><ClockCircleOutlined /> Billable time</span>
            <span><TeamOutlined /> Team focus</span>
          </div>
        </div>
        <p className="auth-quote">Built for agencies and freelance teams that value focus.</p>
      </section>
      <section className="auth-form-wrap">
        <Card className="auth-card" bordered={false}>
          <Typography.Title level={2}>Welcome back</Typography.Title>
          <Typography.Paragraph type="secondary">
            Sign in to continue to your workspace.
          </Typography.Paragraph>
          {error && <Alert type="error" showIcon message={error} />}
          <Form
            layout="vertical"
            requiredMark={false}
            onFinish={(values) =>
              void dispatch(login(values)).then((action) => {
                if (login.fulfilled.match(action)) {
                  navigate(action.payload.user.role === 'client' ? '/portal' : '/dashboard');
                }
              })
            }
          >
            <Form.Item name="email" label="Work email" rules={[{ required: true, type: 'email' }]}>
              <Input size="large" placeholder="you@agency.com" />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
              <Input.Password size="large" placeholder="Your password" />
            </Form.Item>
            <div className="auth-help-link">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              block
              icon={<ArrowRightOutlined />}
              iconPosition="end"
            >
              Sign in
            </Button>
          </Form>
          <div className="auth-switch">
            New to WorkClub? <Link to="/register">Create a workspace</Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
