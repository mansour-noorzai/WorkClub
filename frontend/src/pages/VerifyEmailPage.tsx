import { Button, Result, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { publicPost, getErrorMessage } from '@/api/client';
import { useSearchParams } from '@/router';
import type { ApiResponse, User } from '@/types';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      setMessage('Verification token is missing.');
      setState('error');
      return;
    }
    void publicPost<ApiResponse<{ user: User }>>('/auth/verify-email', { token })
      .then(() => setState('success'))
      .catch((error) => {
        setMessage(getErrorMessage(error));
        setState('error');
      });
  }, [token]);

  if (state === 'loading') {
    return <div className="route-loader"><Spin /> Verifying your email…</div>;
  }
  if (state === 'error') {
    return <Result status="error" title="Verification failed" subTitle={message} />;
  }
  return (
    <Result
      status="success"
      title="Email verified"
      extra={<Button type="primary" href="/dashboard">Continue to WorkClub</Button>}
    />
  );
}
