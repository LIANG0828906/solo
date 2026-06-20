import { Layout, Button, Avatar, Dropdown, Space } from 'antd';
import { UserOutlined, LoginOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header } = Layout;

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = true;

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
      { key: 'settings', icon: <SettingOutlined />, label: '账户设置' },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'profile') navigate('/my-clubs');
    },
  };

  const activePath = location.pathname;
  const pageTitle =
    activePath === '/' ? '社团探索' :
    activePath.startsWith('/club/') ? '社团详情' :
    activePath === '/my-clubs' ? '我的社团' : '校园社团平台';

  return (
    <Header className="navbar-glass">
      <Space size={12} onClick={() => navigate('/')} style={{ cursor: 'pointer', flex: 1 }}>
        <div className="logo-gradient">社</div>
        <span style={{ fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          校园社团平台
        </span>
        <span style={{ color: '#999', fontSize: 14, marginLeft: 12 }}>{pageTitle}</span>
      </Space>

      <Space size={16}>
        {isLoggedIn ? (
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: 20, background: '#f5f6fa' }}>
              <Avatar size={28} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }} icon={<UserOutlined />} />
              <span style={{ color: '#333', fontSize: 14 }}>张同学</span>
            </Space>
          </Dropdown>
        ) : (
          <Space>
            <Button type="text">注册</Button>
            <Button type="primary" icon={<LoginOutlined />}>登录</Button>
          </Space>
        )}
      </Space>
    </Header>
  );
}

export default Navbar;
