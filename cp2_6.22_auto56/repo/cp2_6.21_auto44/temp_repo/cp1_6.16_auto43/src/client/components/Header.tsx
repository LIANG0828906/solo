import React from 'react';

interface HeaderProps {
  currentUser: string;
  currentPage: 'home' | 'profile';
  onNavigate: (page: 'home' | 'profile') => void;
  onPublish: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentPage,
  onNavigate,
  onPublish,
  onLogout,
}) => {
  return (
    <header className="header">
      <div className="header-title">
        <span>🌱</span>
        <span>种子交换平台</span>
      </div>
      <nav className="header-nav">
        <button
          className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          首页
        </button>
        <button
          className={`nav-btn ${currentPage === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
        >
          个人主页
        </button>
        <button className="btn btn-primary" onClick={onPublish}>
          + 发布条目
        </button>
      </nav>
      <div className="user-info">
        <span className="user-nickname">👤 {currentUser}</span>
        <button className="nav-btn" onClick={onLogout}>
          退出
        </button>
      </div>
    </header>
  );
};

export default Header;
