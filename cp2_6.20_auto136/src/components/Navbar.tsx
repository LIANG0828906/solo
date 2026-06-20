import { Layout, Button, Avatar, Dropdown, MenuProps, Space } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header } = Layout

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'my-clubs',
      label: '我的社团',
      onClick: () => navigate('/my-clubs'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  return (
    <Header className="navbar" style={{ padding: 0, background: 'transparent', height: 64, lineHeight: '64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div className="navbar-logo">社</div>
          <span className="navbar-title">校园社团平台</span>
        </div>
        <Space size={16}>
          <Button
            type={isActive('/') ? 'primary' : 'text'}
            onClick={() => navigate('/')}
          >
            社团探索
          </Button>
          <Button
            type={isActive('/my-clubs') ? 'primary' : 'text'}
            onClick={() => navigate('/my-clubs')}
          >
            我的社团
          </Button>
          <Dropdown menu={{ items }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size={32} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <UserOutlined />
              </Avatar>
              <span style={{ color: '#333', fontSize: 14 }}>学生用户</span>
            </div>
          </Dropdown>
        </Space>
      </div>
    </Header>
  )
}

export default Navbar
