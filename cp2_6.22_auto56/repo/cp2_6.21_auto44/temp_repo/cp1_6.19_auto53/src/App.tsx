import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { FiHome, FiGrid, FiUser, FiShield } from 'react-icons/fi';
import { GameCarousel } from '@/components/GameCarousel';
import { Dashboard } from '@/components/Dashboard';
import { UserProfile } from '@/pages/UserProfile';
import { mockDataService } from '@/services/mockData';
import type { User } from '@/types';

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="fade-in">
      {children}
    </div>
  );
};

const Navigation: React.FC<{
  currentUser: User | null;
  currentPage: string;
  setCurrentPage: (p: string) => void;
}> = ({ currentUser, currentPage, setCurrentPage }) => {
  const location = useLocation();

  const navItems = [
    { key: 'home', label: '首页', icon: <FiHome />, path: '/' },
    { key: 'games', label: '游戏大厅', icon: <FiGrid />, path: '/games' },
    { key: 'profile', label: '个人中心', icon: <FiUser />, path: `/profile/${currentUser?.id || 'user-1'}` },
  ];

  if (currentUser?.role === 'admin') {
    navItems.splice(2, 0, {
      key: 'dashboard',
      label: '管理面板',
      icon: <FiShield />,
      path: '/dashboard',
    });
  }

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(30, 30, 46, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--divider)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <Link
          to="/"
          onClick={() => setCurrentPage('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C6FF7 0%, #FF8C42 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 6px 20px rgba(124, 111, 247, 0.4)',
            }}
          >
            ♟️
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              社区棋盘
            </span>
            <span style={{ fontSize: '11px', color: '#6B6B85' }}>BOARD GAME RENTAL</span>
          </div>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px',
            background: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--divider)',
          }}
          className="nav-links"
        >
          {navItems.map((item) => {
            const isActive =
              item.key === currentPage ||
              (item.key === 'home' && location.pathname === '/') ||
              (item.key === 'profile' && location.pathname.startsWith('/profile')) ||
              (item.key === 'dashboard' && location.pathname === '/dashboard') ||
              (item.key === 'games' && location.pathname === '/games');
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => setCurrentPage(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: isActive ? '#fff' : '#9B9BB0',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(124, 111, 247, 0.25), rgba(124, 111, 247, 0.1))'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(124, 111, 247, 0.3)'
                    : '1px solid transparent',
                  transition: 'all 0.2s ease-out',
                  whiteSpace: 'nowrap',
                }}
                onMouseDown={(e) => !isActive && (e.currentTarget.style.transform = 'scale(0.96)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }
                }}
              >
                <span style={{ fontSize: '15px' }}>{item.icon}</span>
                <span className="nav-text">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
          className="user-area"
        >
          {currentUser && (
            <>
              <div style={{ textAlign: 'right' }} className="user-info-text">
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '11px', color: '#7C6FF7', fontWeight: 500 }}>
                  {currentUser.role === 'admin' ? '管理员' : '社区会员'}
                </div>
              </div>
              <Link to={`/profile/${currentUser.id}`} onClick={() => setCurrentPage('profile')}>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2px solid rgba(124, 111, 247, 0.5)',
                    background: 'var(--bg-card)',
                    transition: 'all 0.2s ease-out',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                    e.currentTarget.style.borderColor = '#7C6FF7';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 111, 247, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(124, 111, 247, 0.5)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                />
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .user-info-text {
            display: none;
          }
          .nav-text {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};

const HomePage: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  return (
    <div style={{ paddingTop: '20px' }}>
      <div
        style={{
          textAlign: 'center',
          marginBottom: '48px',
          padding: '40px 20px',
          position: 'relative',
          borderRadius: '28px',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at 20% 20%, rgba(124, 111, 247, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 140, 66, 0.15) 0%, transparent 50%)',
          border: '1px solid var(--divider)',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            color: '#FF8C42',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          ✨ 社区公共棋盘系统
        </div>
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '16px',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #9B9BB0 50%, #7C6FF7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          发现、预约、享受
          <br />
          <span style={{ display: 'block' }}>每一局对弈的乐趣</span>
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: '#9B9BB0',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          精选围棋、象棋、国际象棋、桌游等多种棋盘游戏，
          在线预约、线下使用，让社区生活更有趣味
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '32px',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/games"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 32px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #7C6FF7, #6366F1)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(124, 111, 247, 0.4)',
              transition: 'all 0.2s ease-out',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.boxShadow = '0 14px 38px rgba(124, 111, 247, 0.5)';
            }}
          >
            🎮 浏览游戏
          </Link>
          <Link
            to={`/profile/${currentUser.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 32px',
              borderRadius: '14px',
              background: 'var(--bg-card)',
              color: '#E0E0E0',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
              border: '1px solid var(--divider)',
              transition: 'all 0.2s ease-out',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 140, 66, 0.4)';
              e.currentTarget.style.color = '#FF8C42';
            }}
          >
            📋 我的预约
          </Link>
        </div>
      </div>

      <GameCarousel currentUser={currentUser} />

      <div
        style={{
          marginTop: '60px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        {[
          {
            icon: '⚡',
            title: '快速预约',
            desc: '30秒内完成预约，无需排队等候',
            color: '#7C6FF7',
          },
          {
            icon: '🎯',
            title: '丰富游戏',
            desc: '6+款精选棋盘游戏，满足所有喜好',
            color: '#FF8C42',
          },
          {
            icon: '⭐',
            title: '评分系统',
            desc: '真实用户评价，帮你做出最佳选择',
            color: '#4ADE80',
          },
          {
            icon: '🏘️',
            title: '社区友好',
            desc: '专为社区居民设计的公共服务',
            color: '#60A5FA',
          },
        ].map((item) => (
          <div
            key={item.title}
            style={{
              padding: '28px',
              borderRadius: '20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--divider)',
              transition: 'all 0.3s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = `${item.color}50`;
              e.currentTarget.style.boxShadow = `0 20px 50px ${item.color}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.borderColor = 'var(--divider)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div
              style={{
                fontSize: '40px',
                marginBottom: '16px',
              }}
            >
              {item.icon}
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '8px',
              }}
            >
              {item.title}
            </h3>
            <p style={{ color: '#9B9BB0', fontSize: '14px', lineHeight: 1.6 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const GamesPage: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  return (
    <div style={{ paddingTop: '20px' }}>
      <div
        style={{
          marginBottom: '32px',
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #fff 0%, #9B9BB0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
            marginBottom: '8px',
          }}
        >
          🎮 游戏大厅
        </h1>
        <p style={{ color: '#6B6B85', fontSize: '15px' }}>
          浏览所有可预约的棋盘游戏，点击卡片查看详情并预约
        </p>
      </div>
      <GameCarousel currentUser={currentUser} />
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const users = mockDataService.getUsers();
    setCurrentUser(users.find((u) => u.role === 'admin') || users[0] || null);
  }, []);

  if (!currentUser) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#9B9BB0',
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <HashRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            animation: 'slideUp 0.3s ease-out',
          },
        }}
      />
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Navigation
          currentUser={currentUser}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
        <main
          style={{
            flex: 1,
            maxWidth: '1280px',
            width: '100%',
            margin: '0 auto',
            padding: '24px',
            paddingBottom: '80px',
          }}
        >
          <PageTransition>
            <Routes>
              <Route path="/" element={<HomePage currentUser={currentUser} />} />
              <Route path="/games" element={<GamesPage currentUser={currentUser} />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/profile/:userId?"
                element={<UserProfile />}
              />
              <Route path="*" element={<HomePage currentUser={currentUser} />} />
            </Routes>
          </PageTransition>
        </main>

        <footer
          style={{
            borderTop: '1px solid var(--divider)',
            padding: '24px',
            textAlign: 'center',
            color: '#6B6B85',
            fontSize: '13px',
          }}
        >
          © {new Date().getFullYear()} 社区棋盘租赁预约系统 · 让邻里对弈更便捷 ♟️
        </footer>
      </div>
    </HashRouter>
  );
}
