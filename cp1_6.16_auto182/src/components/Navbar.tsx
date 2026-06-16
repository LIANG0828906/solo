import { Layout, Menu, Avatar, Flex } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { useMarketplaceStore } from '../store/useMarketplaceStore';

const { Header } = Layout;

interface NavbarProps {
  currentPage: 'home' | 'my-listings';
  onNavigate: (page: 'home' | 'my-listings') => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const currentUser = useMarketplaceStore(state => state.currentUser);

  const menuItems = [
    {
      key: 'home',
      label: '首页',
      onClick: () => onNavigate('home')
    },
    {
      key: 'my-listings',
      label: '我的发布',
      onClick: () => onNavigate('my-listings')
    }
  ];

  return (
    <Header
      style={{
        background: '#5D4037',
        padding: '0 24px',
        height: 64,
        lineHeight: '64px'
      }}
    >
      <Flex justify="space-between" align="center" style={{ height: '100%' }}>
        <Flex align="center" gap={8}>
          <ShopOutlined style={{ fontSize: 24, color: '#FFFFFF' }} />
          <span style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 600 }}>二手集市</span>
        </Flex>

        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          items={menuItems}
          style={{
            background: '#5D4037',
            borderBottom: 'none',
            minWidth: 200
          }}
          theme="dark"
        />

        <Flex align="center" gap={10}>
          <Avatar
            src={currentUser?.avatar}
            size={36}
            style={{ border: '2px solid rgba(255,255,255,0.3)' }}
          />
          <span style={{ color: '#FFFFFF', fontSize: 14 }}>{currentUser?.name || '游客'}</span>
        </Flex>
      </Flex>
    </Header>
  );
}
