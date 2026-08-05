import { LogoutOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from '@/router';
import { api } from '@/api/client';
import { Logo } from '@/components/Logo';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/authSlice';

export function PortalPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [data, setData] = useState<{ projects: any[]; invoices: any[] }>({ projects: [], invoices: [] });
  useEffect(() => {
    void api.get('/portal/overview').then((response) => setData(response.data.result));
  }, []);

  return (
    <div className="portal-page">
      <header className="portal-header">
        <Logo />
        <div>
          <span>Client portal</span>
          <strong>{user?.name}</strong>
          <Button type="text" icon={<LogoutOutlined />} onClick={() => void dispatch(logout()).then(() => navigate('/login'))}>Sign out</Button>
        </div>
      </header>
      <main className="portal-content">
        <div className="portal-hero">
          <span className="eyebrow">Shared progress</span>
          <h1>Your projects, without the internal noise.</h1>
          <p>Review delivery status, important dates, and invoices in one place.</p>
        </div>
        <Row gutter={[18, 18]}>
          {data.projects.map((project) => (
            <Col xs={24} md={12} lg={8} key={project._id}>
              <Card className="project-card">
                <span className="project-code">{project.code}</span>
                <h3>{project.name}</h3>
                <Tag color={project.status === 'active' ? 'purple' : 'default'}>{project.status}</Tag>
                <p>{project.deadline ? `Target: ${dayjs(project.deadline).format('D MMM YYYY')}` : 'No public deadline'}</p>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="table-card portal-invoices">
          <h2>Invoices</h2>
          <Table
            rowKey="_id"
            dataSource={data.invoices}
            columns={[
              { title: 'Invoice', dataIndex: 'number' },
              { title: 'Project', render: (_, item) => item.project?.name },
              { title: 'Due', render: (_, item) => dayjs(item.dueDate).format('D MMM YYYY') },
              { title: 'Total', render: (_, item) => `${item.currency} ${item.total.toLocaleString()}` },
              { title: 'Status', render: (_, item) => <Tag color={item.status === 'paid' ? 'green' : item.status === 'overdue' ? 'red' : 'blue'}>{item.status}</Tag> },
            ]}
            scroll={{ x: 680 }}
          />
        </div>
      </main>
    </div>
  );
}
