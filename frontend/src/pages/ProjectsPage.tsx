import { ArrowRightOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Empty, Form, Input, InputNumber, message, Modal, Popconfirm, Row, Select, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from '@/router';
import { api, getErrorMessage } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProjects } from '@/store/projectsSlice';
import type { Client, Project, User } from '@/types';

export function ProjectsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading } = useAppSelector((state) => state.projects);
  const user = useAppSelector((state) => state.auth.user);
  const canManage = user?.role === 'owner' || user?.role === 'manager';
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form] = Form.useForm();

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'planned', currency: 'USD', amount: 0 });
    setOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    form.setFieldsValue({
      name: project.name,
      code: project.code,
      client: typeof project.client === 'string' ? project.client : project.client._id,
      teamMembers: project.teamMembers.map((member) => member._id),
      description: project.description,
      deadline: project.deadline ? dayjs(project.deadline) : undefined,
      status: project.status,
      amount: project.budget.amount,
      currency: project.budget.currency,
    });
    setOpen(true);
  }

  useEffect(() => {
    void dispatch(fetchProjects());
    if (canManage) {
      void Promise.all([api.get('/client?limit=100'), api.get('/team')]).then(([clientsResponse, teamResponse]) => {
        setClients(clientsResponse.data.result);
        setTeam(teamResponse.data.result.users);
      });
    }
  }, [dispatch, canManage]);

  return (
    <>
      <PageHeader
        title="Projects"
        description="A shared view of every client engagement, deadline, and team."
        action={canManage ? <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New project</Button> : undefined}
      />
      {!loading && !items.length ? (
        <Empty description="No projects yet." />
      ) : (
        <Row gutter={[18, 18]}>
          {items.map((project) => (
            <Col xs={24} md={12} xl={8} key={project._id}>
              <Card className="project-card">
                <div className="project-card-top">
                  <span className="project-code">{project.code}</span>
                  <Space>
                    <Tag color={project.status === 'active' ? 'purple' : 'default'}>{project.status}</Tag>
                    {canManage && (
                      <>
                        <Button aria-label={`Edit ${project.name}`} type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(project)} />
                        <Popconfirm
                          title="Archive this project?"
                          description="Running timers must be stopped first."
                          onConfirm={async () => {
                            try {
                              await api.delete(`/project/${project._id}`);
                              message.success('Project archived.');
                              await dispatch(fetchProjects());
                            } catch (error) {
                              message.error(getErrorMessage(error));
                            }
                          }}
                        >
                          <Button aria-label={`Archive ${project.name}`} danger type="text" size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </>
                    )}
                  </Space>
                </div>
                <button className="project-title-button" onClick={() => navigate(`/projects/${project._id}/board`)}>
                  <h3>{project.name}</h3>
                </button>
                <p>{typeof project.client === 'string' ? 'Client project' : project.client.name}</p>
                <div className="project-meta">
                  <span>{project.deadline ? `Due ${dayjs(project.deadline).format('D MMM')}` : 'No deadline'}</span>
                  <Button aria-label={`Open ${project.name} board`} type="text" icon={<ArrowRightOutlined />} onClick={() => navigate(`/projects/${project._id}/board`)} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      <Modal title={editing ? 'Edit project' : 'Create project'} open={open} onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }} onOk={() => form.submit()} okText={editing ? 'Save changes' : 'Create project'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              const payload = {
                client: values.client,
                name: values.name,
                code: values.code,
                description: values.description || undefined,
                teamMembers: values.teamMembers ?? [],
                status: values.status,
                deadline: values.deadline?.toISOString(),
                budget: { amount: values.amount ?? 0, currency: values.currency },
              };
              if (editing) await api.patch(`/project/${editing._id}`, payload);
              else await api.post('/project', payload);
              message.success(editing ? 'Project updated.' : 'Project created.');
              setOpen(false);
              setEditing(null);
              form.resetFields();
              await dispatch(fetchProjects());
            } catch (error) {
              message.error(getErrorMessage(error));
            }
          }}
        >
          <Form.Item name="name" label="Project name" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
          <Form.Item name="code" label="Project code" rules={[{ required: true, min: 2 }]}><Input placeholder="ACME-WEB" /></Form.Item>
          <Form.Item name="client" label="Client" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={clients.map((client) => ({ value: client._id, label: client.name }))} />
          </Form.Item>
          <Form.Item name="teamMembers" label="Team members">
            <Select mode="multiple" options={team.map((member) => ({ value: member._id, label: `${member.name} · ${member.role}` }))} />
          </Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="deadline" label="Deadline"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="Status"><Select options={['planned', 'active', 'on_hold', 'completed', 'cancelled'].map((value) => ({ value, label: value }))} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="amount" label="Budget"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="currency" label="Currency"><Input maxLength={3} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
