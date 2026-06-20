import React from 'react';

interface User {
  id: string;
  nickname: string;
  avatar: string;
}

interface SidebarProps {
  user: User | null;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { key: 'reviews', label: '书评广场', icon: '📖' },
  { key: 'bookshelf', label: '书架', icon: '📚' },
  { key: 'debate', label: '辩论区', icon: '⚖️' },
  { key: 'settings', label: '设置', icon: '⚙️' },
];

const Sidebar: React.FC<SidebarProps> = ({ user, currentPage, onNavigate }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-user">
        {user && (
          <>
            <img className="sidebar-avatar" src={user.avatar} alt={user.nickname} />
            <span className="sidebar-nickname">{user.nickname}</span>
          </>
        )}
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item${currentPage === item.key ? ' active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
