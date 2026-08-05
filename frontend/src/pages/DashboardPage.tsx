import {
  ClockCircleOutlined,
  DollarOutlined,
  FolderOpenOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Card, Col, Progress, Row, Skeleton, Statistic, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProjects } from '@/store/projectsSlice';

interface Summary {
  activeProjects: number;
  overdueTasks: number;
  hoursThisWeek: number;
  outstandingInvoices: Array<{ _id: string; amount: number }>;
}

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const { items: projects, loading } = useAppSelector((state) => state.projects);
  const user = useAppSelector((state) => state.auth.user);
  const [summary, setSummary] = useState<Summary>();

  useEffect(() => {
    void dispatch(fetchProjects());
    void api.get('/dashboard/summary').then((response) => setSummary(response.data.result));
  }, [dispatch]);

  const outstanding = summary?.outstandingInvoices?.[0];
  return (
    <>
      <PageHeader
        title={`Good to see you, ${user?.name ?? 'there'}`}
        description="Here’s what needs your team’s attention today."
      />
      <Row gutter={[18, 18]}>
        <Metric
          icon={<FolderOpenOutlined />}
          label="Active projects"
          value={summary?.activeProjects}
          accent="violet"
        />
        <Metric
          icon={<WarningOutlined />}
          label="Overdue tasks"
          value={summary?.overdueTasks}
          accent="coral"
        />
        <Metric
          icon={<ClockCircleOutlined />}
          label="Hours this week"
          value={summary?.hoursThisWeek}
          suffix="h"
          accent="blue"
        />
        {user?.role !== 'member' && (
          <Metric
            icon={<DollarOutlined />}
            label="Outstanding"
            value={outstanding?.amount ?? 0}
            prefix={outstanding?._id ?? 'USD'}
            accent="green"
          />
        )}
      </Row>
      <Row gutter={[18, 18]} className="dashboard-grid">
        <Col xs={24} xl={16}>
          <Card title="Project pulse" className="panel-card">
            {loading ? (
              <Skeleton active />
            ) : (
              <Table
                rowKey="_id"
                pagination={false}
                dataSource={projects.slice(0, 6)}
                columns={[
                  {
                    title: 'Project',
                    render: (_, project) => (
                      <div>
                        <strong>{project.name}</strong>
                        <span className="cell-subtitle">{project.code}</span>
                      </div>
                    ),
                  },
                  {
                    title: 'Client',
                    render: (_, project) =>
                      typeof project.client === 'string' ? '—' : project.client.name,
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    render: (status) => <Tag color={status === 'active' ? 'purple' : 'default'}>{status}</Tag>,
                  },
                  {
                    title: 'Budget',
                    render: (_, project) =>
                      `${project.budget.currency} ${project.budget.amount.toLocaleString()}`,
                  },
                ]}
                scroll={{ x: 620 }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Weekly focus" className="panel-card focus-card">
            <span className="eyebrow">Personal target</span>
            <h2>{summary?.hoursThisWeek ?? 0} / 40 hours</h2>
            <Progress
              percent={Math.min(100, Math.round(((summary?.hoursThisWeek ?? 0) / 40) * 100))}
              showInfo={false}
              strokeColor="#6558f5"
            />
            <p>Keep timers tied to tasks so reports and invoices stay accurate.</p>
          </Card>
        </Col>
      </Row>
    </>
  );
}

function Metric({
  icon,
  label,
  value,
  prefix,
  suffix,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  prefix?: string;
  suffix?: string;
  accent: string;
}) {
  return (
    <Col xs={24} sm={12} xl={6}>
      <Card className={`metric-card ${accent}`}>
        <div className="metric-icon">{icon}</div>
        <Statistic title={label} value={value ?? 0} prefix={prefix} suffix={suffix} />
      </Card>
    </Col>
  );
}
