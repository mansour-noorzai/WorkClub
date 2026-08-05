import { Button, Result } from 'antd';
import { Link } from '@/router';

export function NotFoundPage() {
  return <Result status="404" title="Page not found" extra={<Link to="/"><Button type="primary">Back to WorkClub</Button></Link>} />;
}
