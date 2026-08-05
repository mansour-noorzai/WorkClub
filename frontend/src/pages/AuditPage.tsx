import { Card, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';

interface AuditEvent {
  _id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  statusCode: number;
  requestId?: string;
  actor?: { name: string; email: string; role: string };
  createdAt: string;
}

export function AuditPage() {
  const [items, setItems] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api
      .get('/audit?limit=50')
      .then((response) => setItems(response.data.result))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Audit trail"
        description="Owner-only history of security-sensitive workspace changes."
      />
      <Card>
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={items}
          pagination={{ pageSize: 20 }}
          columns={[
            {
              title: 'Time',
              dataIndex: 'createdAt',
              render: (value: string) => new Date(value).toLocaleString(),
            },
            {
              title: 'Actor',
              dataIndex: 'actor',
              render: (actor?: AuditEvent['actor']) => actor?.name ?? 'Unknown',
            },
            { title: 'Action', dataIndex: 'action' },
            {
              title: 'Resource',
              render: (_, item: AuditEvent) => (
                <span>{item.resourceType}{item.resourceId ? ` · ${item.resourceId}` : ''}</span>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'statusCode',
              render: (status: number) => (
                <Tag color={status < 400 ? 'green' : 'orange'}>{status}</Tag>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
