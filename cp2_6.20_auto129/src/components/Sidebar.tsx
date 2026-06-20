import React from 'react';
import { Avatar, Menu } from 'antd';
import {
  BookOutlined,
  ReadOutlined,
  MessageOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { User } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <ReadOutlined />,
      label: '书评广场'
    },
    {
      key: '/bookshelf',
      icon: <BookOutlined />,
      label: '我的书架'
    },
    {
      key: '/debate',
      icon: <MessageOutlined />,
      label: '辩论区'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置'
    }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/debate/')) return '/debate';
    if (location.pathname.startsWith('/bookshelf/')) return '/bookshelf';
    if (location.pathname.startsWith('/review/')) return '/';
    return location.pathname;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-user">
        <Avatar size={64} src={user?.avatar} className="sidebar-avatar">
          {user?.nickname?.charAt(0)}
        </Avatar>
        <div className="sidebar-nickname">{user?.nickname || '访客'}</div>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        onClick={handleMenuClick}
        className="sidebar-menu"
      />
      <div className="sidebar-footer">
        <span className="sidebar-version">书评社区 v1.0</span>
      </div>
    </div>
  );
};

export default Sidebar;
