import { useState } from 'react';
import { useAuth, User } from './hooks/useAuth';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Courses from './components/Courses';
import Schedule from './components/Schedule';
import Checkin from './components/Checkin';

// 主应用组件
// 数据流向：根据路由渲染不同页面，从useAuth获取token传递给各子组件
// 调用关系：App -> useAuth -> [Login, Register, Dashboard, Courses, Schedule, Checkin] -> fetch -> 后端API
export default function App() {
  const { token, user, loading, login, logout, updateUser } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 加载状态
  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  // 未登录时显示登录或注册页面
  if (!token) {
    if (currentRoute === 'register') {
      return (
        <Register
          onRegister={(token, user) => {
            login(token, user);
            setCurrentRoute('dashboard');
          }}
          onSwitchToLogin={() => setCurrentRoute('login')}
        />
      );
    }
    return (
      <Login
        onLogin={(token, user) => {
          login(token, user);
          setCurrentRoute('dashboard');
        }}
        onSwitchToRegister={() => setCurrentRoute('register')}
      />
    );
  }

  // 导航菜单配置
  const navItems = [
    { id: 'dashboard', label: '个人中心', icon: '👤' },
    { id: 'courses', label: '课程', icon: '📅' },
    { id: 'mybookings', label: '我的预约', icon: '📋' },
    { id: 'checkin', label: '签到', icon: '✅' },
    { id: 'schedule', label: '排班管理', icon: '⚙️' },
  ];

  // 路由渲染
  const renderContent = () => {
    switch (currentRoute) {
      case 'login':
      case 'register':
        return <Dashboard user={user!} token={token} updateUser={updateUser} />;
      case 'dashboard':
      case 'mybookings':
        return <Dashboard user={user!} token={token} updateUser={updateUser} />;
      case 'courses':
        return <Courses token={token} user={user!} updateUser={updateUser} />;
      case 'schedule':
        return <Schedule token={token} />;
      case 'checkin':
        return <Checkin token={token} />;
      default:
        return <Dashboard user={user!} token={token} updateUser={updateUser} />;
    }
  };

  return (
    <div className="app">
      {/* 顶部导航栏 */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">🏋️ GYM PRO</div>

          {/* 桌面端导航 */}
          <div className="nav-links">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-link ${currentRoute === item.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentRoute(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div className="nav-right">
            <span className="user-info">
              {user?.level === 'vip' ? '⭐ VIP' : '👤'} {user?.name}
            </span>
            <button className="logout-btn" onClick={logout}>
              退出
            </button>

            {/* 移动端汉堡菜单 */}
            <button
              className="hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* 移动端下拉菜单 */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`mobile-nav-link ${currentRoute === item.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentRoute(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* 主内容区域 */}
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}
