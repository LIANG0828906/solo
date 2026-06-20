import React, { useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Row,
  Col,
  Button,
  Drawer,
} from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  FundProjectionScreenOutlined,
  MenuOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import { useAppStore } from './store/useAppStore';
import type { User } from './types';

const { Header, Sider, Content } = Layout;

const UserSelectPage: React.FC = () => {
  const { users, loadUsers, setCurrentUser } = useAppStore();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleConfirm = () => {
    const user = users.find((u) => u.id === selected);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 600, width: '100%' }}>
        <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: 8 }}>
          个人财务管理看板
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 32 }}>
          请选择或创建一个模拟用户开始使用
        </p>
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          {users.map((user) => (
            <Col xs={24} sm={8} key={user.id}>
              <div
                className={`user-select-card ${selected === user.id ? 'selected' : ''}`}
                onClick={() => setSelected(user.id)}
              >
                <Avatar src={user.avatar} size={64} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 16, fontWeight: 500 }}>{user.name}</div>
              </div>
            </Col>
          ))}
        </Row>
        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            disabled={!selected}
            onClick={handleConfirm}
            style={{ minWidth: 160 }}
          >
            进入系统
          </Button>
        </div>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, setCurrentUser, loadAllData } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadAllData(currentUser.id);
    }
  }, [currentUser, loadAllData]);

  if (!currentUser) {
    return <UserSelectPage />;
  }

  const selectedKey =
    location.pathname === '/transactions'
      ? 'transactions'
      : location.pathname === '/budgets'
      ? 'budgets'
      : 'dashboard';

  const handleLogout = () => {
    setCurrentUser(null as unknown as User);
    navigate('/');
  };

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '仪表盘', onClick: () => navigate('/') },
    { key: 'transactions', icon: <UnorderedListOutlined />, label: '交易记录', onClick: () => navigate('/transactions') },
    { key: 'budgets', icon: <FundProjectionScreenOutlined />, label: '预算管理', onClick: () => navigate('/budgets') },
  ];

  const siderWidth = 220;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile ? (
        <Sider
          className="app-sider"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={siderWidth}
          trigger={null}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: collapsed ? 14 : 18,
              fontWeight: 600,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {collapsed ? '财务' : '财务管理看板'}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{ borderRight: 0, marginTop: 8 }}
          />
        </Sider>
      ) : null}

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: isMobile ? '0 12px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
              />
            )}
            {!isMobile && (
              <h2 style={{ margin: 0, fontSize: 18, color: 'rgba(0,0,0,0.85)' }}>
                {selectedKey === 'dashboard' && '仪表盘'}
                {selectedKey === 'transactions' && '交易记录'}
                {selectedKey === 'budgets' && '预算管理'}
              </h2>
            )}
            {isMobile && (
              <h2 style={{ margin: 0, fontSize: 16, color: 'rgba(0,0,0,0.85)' }}>
                {selectedKey === 'dashboard' && '仪表盘'}
                {selectedKey === 'transactions' && '交易记录'}
                {selectedKey === 'budgets' && '预算管理'}
              </h2>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar src={currentUser.avatar} />
            <span style={{ display: isMobile ? 'none' : 'inline' }}>
              {currentUser.name}
            </span>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} />
          </div>
        </Header>
        <Content className="content-wrapper">
          <div style={{ paddingTop: 24 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Content>
      </Layout>

      {isMobile && (
        <Drawer
          placement="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          width={siderWidth}
          styles={{ body: { padding: 0, background: '#001529' } }}
          headerStyle={{ background: '#001529', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          title={<span style={{ color: '#fff' }}>财务管理看板</span>}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems.map((item) => ({
              ...item,
              onClick: () => {
                item.onClick?.();
                setMobileMenuOpen(false);
              },
            }))}
            style={{ background: '#001529', color: '#fff', borderRight: 0 }}
            theme="dark"
          />
        </Drawer>
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
};

export default App;
