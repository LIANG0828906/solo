import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import useLibraryStore from '../stores/libraryStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { notifications, notificationsVisible, toggleNotifications, borrowRequests } = useLibraryStore();
  const [searchQuery, setSearchQuery] = useState('');

  const pendingCount = borrowRequests.filter((r) => r.status === 'pending').length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const badgeCount = pendingCount || unreadCount || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="header-left">
          <Link to="/dashboard" className="logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">BookDrift</span>
          </Link>

          <nav className="header-nav">
            <Link
              to="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              首页
            </Link>
            <Link
              to="/browse"
              className={`nav-link ${location.pathname.startsWith('/browse') ? 'active' : ''}`}
            >
              浏览
            </Link>
          </nav>
        </div>

        <div className="header-center">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索书籍、作者..."
              className="search-input"
            />
            <button type="submit" className="search-btn">
              🔍
            </button>
          </form>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="notification-btn"
            onClick={toggleNotifications}
          >
            🔔
            {badgeCount > 0 && <span className="badge">{badgeCount > 99 ? '99+' : badgeCount}</span>}
          </button>

          <div className="user-menu">
            {user && (
              <Link to={`/user/${user.id}`} className="user-info">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="avatar" />
                ) : (
                  <div className="avatar-placeholder">{user.username.charAt(0).toUpperCase()}</div>
                )}
                <span className="username">{user.username}</span>
              </Link>
            )}
          </div>

          <button type="button" className="logout-btn" onClick={handleLogout}>
            退出
          </button>
        </div>
      </header>

      {notificationsVisible && (
        <aside className="notification-panel">
          <div className="notification-header">
            <h3>通知</h3>
            <button type="button" className="close-btn" onClick={toggleNotifications}>
              ✕
            </button>
          </div>
          <div className="notification-list">
            {pendingCount > 0 && (
              <div className="notification-item pending-info">
                <span className="notif-type">借阅申请</span>
                <span className="notif-content">您有 {pendingCount} 条待处理的借阅请求</span>
                <Link to="/dashboard" className="notif-link" onClick={toggleNotifications}>
                  去处理
                </Link>
              </div>
            )}
            {notifications.length === 0 && pendingCount === 0 ? (
              <div className="notification-empty">暂无通知</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.read ? '' : 'unread'}`}
                >
                  <span className="notif-type">{notif.type}</span>
                  <span className="notif-content">{notif.message}</span>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      <main className="layout-main">
        {children}
      </main>
    </div>
  );
};

export default Layout;
