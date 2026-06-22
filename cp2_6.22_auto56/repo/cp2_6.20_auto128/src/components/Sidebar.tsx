import { Layout, Menu } from 'antd';
import { HomeOutlined, TeamOutlined, CalendarOutlined, StarOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey =
    location.pathname === '/' ? 'home' :
    location.pathname === '/my-clubs' ? 'my-clubs' : 'home';

  const menuItems = [
    { key: 'home', icon: <HomeOutlined />, label: '发现社团', onClick: () => navigate('/') },
    { key: 'my-clubs', icon: <TeamOutlined />, label: '我的社团', onClick: () => navigate('/my-clubs') },
    { key: 'calendar', icon: <CalendarOutlined />, label: '活动日历' },
    { key: 'favorite', icon: <StarOutlined />, label: '我的收藏' },
  ];

  return (
    <aside className={`sidebar-wrap ${collapsed ? 'collapsed' : ''}`}>
      <div
        style={{
          padding: collapsed ? '0 20px 16px' : '0 16px 16px',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
          cursor: 'pointer',
          color: '#666',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        style={{ borderRight: 'none', background: 'transparent' }}
      />
    </aside>
  );
}

export default Sidebar;
