import {
  BellOutlined,
  AuditOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Drawer, Layout, List, Menu, Space, Tag, Typography } from 'antd';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import { useLocation, useNavigate } from '@/router';
import { logout } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store';
import { Logo } from './Logo';

const { Header, Sider, Content } = Layout;

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  readAt?: string;
  createdAt: string;
}

export function AppShell({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, workspace } = useAppSelector((state) => state.auth);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 820px)').matches);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const canManage = user?.role === 'owner' || user?.role === 'manager';

  const items = useMemo(
    () =>
      [
        { key: '/dashboard', icon: <DashboardOutlined />, label: 'Overview' },
        ...(canManage
          ? [{ key: '/clients', icon: <UsergroupAddOutlined />, label: 'Clients' }]
          : []),
        { key: '/projects', icon: <FolderOpenOutlined />, label: 'Projects' },
        { key: '/timesheets', icon: <ClockCircleOutlined />, label: 'Time' },
        ...(canManage
          ? [
              { key: '/invoices', icon: <FileTextOutlined />, label: 'Invoices' },
              { key: '/proposals', icon: <FileDoneOutlined />, label: 'Proposals' },
              { key: '/team', icon: <TeamOutlined />, label: 'Team' },
              { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
              ...(user?.role === 'owner'
                ? [{ key: '/audit', icon: <AuditOutlined />, label: 'Audit trail' }]
                : []),
            ]
          : []),
      ],
    [canManage, user?.role]
  );

  async function loadNotifications() {
    const response = await api.get('/notification?limit=20');
    setNotifications(response.data.result);
    setUnread(response.data.meta?.unread ?? 0);
  }

  useEffect(() => {
    void loadNotifications().catch(() => undefined);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 820px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  async function markRead(item: NotificationItem) {
    if (!item.readAt) await api.patch(`/notification/${item._id}/read`, {});
    await loadNotifications();
  }

  const selected = items.find((item) => location.startsWith(item.key))?.key ?? '/dashboard';
  const navigation = (
    <>
      <div className="sidebar-logo">
        <Logo compact={!isMobile && collapsed} />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selected]}
        items={items}
        onClick={({ key }) => {
          navigate(key);
          setMobileNavOpen(false);
        }}
      />
      <div className="sidebar-footer">
        <Button
          block
          type="text"
          icon={<LogoutOutlined />}
          onClick={() => void dispatch(logout()).then(() => navigate('/login'))}
        >
          {(isMobile || !collapsed) && 'Sign out'}
        </Button>
      </div>
    </>
  );

  return (
    <Layout className="app-layout">
      {!isMobile && <Sider className="sidebar" collapsed={collapsed} width={250} trigger={null}>{navigation}</Sider>}
      <Drawer
        className="mobile-nav-drawer"
        placement="left"
        width={270}
        open={isMobile && mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        closable={false}
        styles={{ body: { padding: '0 12px' } }}
      >
        {navigation}
      </Drawer>
      <Layout>
        <Header className="topbar">
          <Space>
            <Button
              aria-label={isMobile ? 'Open navigation' : collapsed ? 'Expand navigation' : 'Collapse navigation'}
              type="text"
              icon={isMobile || collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => isMobile ? setMobileNavOpen(true) : setCollapsed(!collapsed)}
            />
            <div className="workspace-switcher">
              <span className="eyebrow">Workspace</span>
              <strong>{workspace?.name ?? 'WorkClub'}</strong>
            </div>
          </Space>
          <Space size={16}>
            <Badge count={unread} size="small">
              <Button
                shape="circle"
                icon={<BellOutlined />}
                onClick={() => {
                  setDrawerOpen(true);
                  void loadNotifications();
                }}
              />
            </Badge>
            <div className="user-chip">
              <Avatar>{user?.name?.[0]?.toUpperCase()}</Avatar>
              <div>
                <strong>{user?.name}</strong>
                <span>{user?.role}</span>
              </div>
            </div>
          </Space>
        </Header>
        <Content className="content">
          {children}
        </Content>
        <footer className="app-footer">
          WorkClub ·{' '}
          <a
            href={import.meta.env.VITE_SOURCE_URL || '/LICENSE.txt'}
            target="_blank"
            rel="noreferrer"
          >
            Source &amp; license
          </a>
        </footer>
      </Layout>
      <Drawer title="Notifications" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List
          dataSource={notifications}
          locale={{ emptyText: 'You’re all caught up.' }}
          renderItem={(item) => (
            <List.Item
              className={!item.readAt ? 'unread-notification' : ''}
              role="button"
              tabIndex={0}
              onClick={() => void markRead(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  void markRead(item);
                }
              }}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Typography.Text strong>{item.title}</Typography.Text>
                    {!item.readAt && <Tag color="purple">New</Tag>}
                  </Space>
                }
                description={item.message}
              />
            </List.Item>
          )}
        />
      </Drawer>
    </Layout>
  );
}
