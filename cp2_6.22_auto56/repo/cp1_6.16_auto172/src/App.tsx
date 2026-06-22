import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  CoffeeOutlined,
  CalendarOutlined,
  EditOutlined,
  MessageOutlined,
  ShareAltOutlined,
  GiftOutlined,
  TrophyOutlined,
  UserOutlined,
  MenuOutlined,
  CloseOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { notification } from 'antd';
import TaskPage from '@/pages/TaskPage';
import ExchangePage from '@/pages/ExchangePage';
import RankPage from '@/pages/RankPage';
import ProfilePage from '@/pages/ProfilePage';
import { useStore } from '@/stores/store';
import Confetti from '@/components/Confetti';
import type { ReactNode } from 'react';

const iconMap: Record<string, ReactNode> = {
  CalendarOutlined: <CalendarOutlined />,
  EditOutlined: <EditOutlined />,
  MessageOutlined: <MessageOutlined />,
  ShareAltOutlined: <ShareAltOutlined />,
};

export { iconMap };

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const location = useLocation();
  const animationRef = useRef<number | null>(null);

  const {
    user,
    exchangeSuccess,
    errorMessage,
    pointsAnimation,
    fetchUser,
    clearExchangeSuccess,
    clearErrorMessage,
    clearPointsAnimation,
  } = useStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (errorMessage) {
      api.error({
        message: '操作失败',
        description: errorMessage,
        duration: 3,
      });
      clearErrorMessage();
    }
  }, [errorMessage, api, clearErrorMessage]);

  useEffect(() => {
    if (pointsAnimation.show) {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      animationRef.current = window.setTimeout(() => {
        clearPointsAnimation();
      }, 1500);
    }
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [pointsAnimation.show, clearPointsAnimation]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const menuItems = [
    { path: '/', icon: <CalendarOutlined />, label: '任务中心' },
    { path: '/exchange', icon: <GiftOutlined />, label: '咖啡兑换' },
    { path: '/rank', icon: <TrophyOutlined />, label: '排行榜' },
    { path: '/profile', icon: <UserOutlined />, label: '个人中心' },
  ];

  return (
    <div className="app-layout">
      {contextHolder}

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">
            <CoffeeOutlined style={{ color: '#D4A574', fontSize: '28px' }} />
          </span>
          <span className="sidebar-title">咖啡兑换平台</span>
          <button
            className="hamburger-btn"
            style={{ marginLeft: 'auto', display: 'none' }}
            onClick={handleSidebarToggle}
          >
            <CloseOutlined />
          </button>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-menu-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              <img src={user.avatar} alt={user.nickname} />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.nickname}</div>
              <div className="sidebar-user-points">
                <CoffeeOutlined />
                <span>{user.points} 积分</span>
                {pointsAnimation.show && (
                  <span className="points-bounce" style={{ color: '#52C41A' }}>
                    +{pointsAnimation.value}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="main-content">
        <div className="mobile-header">
          <button className="hamburger-btn" onClick={handleSidebarToggle}>
            <MenuOutlined />
          </button>
          <span style={{ fontSize: '16px', fontWeight: 500 }}>咖啡兑换平台</span>
          {user && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CoffeeOutlined style={{ color: '#D4A574' }} />
              <span>{user.points}</span>
            </div>
          )}
        </div>

        <div className="page-container">
          <Routes>
            <Route path="/" element={<TaskPage />} />
            <Route path="/exchange" element={<ExchangePage />} />
            <Route path="/rank" element={<RankPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      </main>

      {exchangeSuccess?.show && (
        <>
          <Confetti />
          <div className="modal-overlay" onClick={clearExchangeSuccess}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="success-icon">
                <CrownOutlined style={{ color: '#D4A574' }} />
              </div>
              <h2 className="success-title">兑换成功！</h2>
              <p className="success-message">
                恭喜您成功兑换
                <strong style={{ color: '#6B4226' }}> {exchangeSuccess.coffeeName} </strong>
                <br />
                消耗 {exchangeSuccess.points} 积分
              </p>
              <button className="btn-primary" onClick={clearExchangeSuccess}>
                知道了
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
