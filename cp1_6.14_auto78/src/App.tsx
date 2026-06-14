import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
  useParams,
  Link,
  Navigate,
} from 'react-router-dom';
import type { NavItem } from './types';
import './styles/global.css';

const navItems: NavItem[] = [
  { path: '/', label: '图书管理', icon: '📚' },
  { path: '/records', label: '阅读记录', icon: '📝' },
  { path: '/analytics', label: '分析报告', icon: '📊' },
  { path: '/settings', label: '目标设置', icon: '⚙️' },
];

const HomePage: React.FC = () => {
  return (
    <div className="page-enter">
      <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>📚 图书管理</h1>
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card">
            <div
              style={{
                width: '100%',
                height: '140px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #C49A6C, #8B5A2B)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
              }}
            >
              📖
            </div>
            <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>示例图书 {i}</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '12px' }}>
              作者 {i}
            </p>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'var(--color-border)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${20 * i}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light)',
                  borderRadius: '4px',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-text-light)' }}>
              {20 * i}% 已读
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="page-slide-right">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-light)', marginBottom: '20px' }}>
        ← 返回图书列表
      </Link>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>图书详情 - ID: {id}</h1>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '200px',
              height: '280px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #C49A6C, #8B5A2B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
              flexShrink: 0,
            }}
          >
            📖
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>示例图书标题</h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>作者姓名</p>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span>阅读进度</span>
                <span style={{ fontWeight: 600 }}>156 / 320 页</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '10px',
                  background: 'var(--color-border)',
                  borderRadius: '5px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '48%',
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light)',
                    borderRadius: '5px',
                    animation: 'progressRotate 2s ease-out forwards',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary">更新进度</button>
              <button className="btn btn-secondary">编辑信息</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecordsPage: React.FC = () => {
  return (
    <div className="page-enter">
      <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>📝 阅读记录</h1>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="list-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>阅读示例图书 {i}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                  2024-01-{10 + i} · 第 {20 * i} - {20 * (i + 5)} 页 · {i * 15} 分钟
                </div>
                {i % 2 === 0 && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-text-light)' }}>
                    💡 今天读得很入迷...
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {i % 3 === 0 && (
                  <span
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(139, 90, 43, 0.1)',
                      borderRadius: '20px',
                      fontSize: '12px',
                      color: 'var(--color-accent)',
                    }}
                  >
                    重点
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsPage: React.FC = () => {
  return (
    <div className="page-enter">
      <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>📊 分析报告</h1>
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          marginBottom: '24px',
        }}
      >
        {[
          { label: '本周页数', value: '128', icon: '📖' },
          { label: '本周时间', value: '6h 32m', icon: '⏱️' },
          { label: '连续天数', value: '7', icon: '🔥' },
          { label: '完成书籍', value: '2', icon: '✅' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: 'var(--color-accent)' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>本周阅读趋势</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '16px',
            height: '160px',
            padding: '0 8px',
          }}
        >
          {['一', '二', '三', '四', '五', '六', '日'].map((day, i) => {
            const heights = [40, 65, 30, 80, 55, 90, 45];
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${heights[i]}%`,
                    background: 'linear-gradient(180deg, var(--color-accent-light), var(--color-accent))',
                    borderRadius: '8px 8px 4px 4px',
                    animation: `slideInUp 0.5s ease forwards`,
                    animationDelay: `${i * 0.1}s`,
                    opacity: 0,
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>周{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  return (
    <div className="page-enter">
      <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>⚙️ 目标设置</h1>
      <div
        style={{ display: 'grid', gap: '16px', maxWidth: '600px' }}
      >
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>每日阅读目标</h3>
          <div className="form-group">
            <label className="form-label">每日阅读页数</label>
            <input type="number" className="form-input" defaultValue={30} min={1} />
          </div>
          <div className="form-group">
            <label className="form-label">每日阅读时长（分钟）</label>
            <input type="number" className="form-input" defaultValue={45} min={1} />
          </div>
          <button className="btn btn-primary btn-block">保存设置</button>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>数据管理</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-secondary">导出阅读数据</button>
            <button className="btn btn-secondary">导入阅读数据</button>
            <button className="btn btn-danger">清空所有数据</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const navRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({
    width: 0,
    left: 0,
    top: 0,
    opacity: 0,
  });

  useEffect(() => {
    const activeEl = navRefs.current[currentPath];
    if (activeEl && indicatorRef.current) {
      const rect = activeEl.getBoundingClientRect();
      const parentRect = activeEl.offsetParent?.getBoundingClientRect();
      setIndicatorStyle({
        width: 3,
        left: 16,
        top: rect.top - (parentRect?.top ?? 0) + rect.height / 2 - 12,
        height: 24,
        opacity: 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      });
    }
  }, [currentPath]);

  return (
    <aside
      className="desktop-only"
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: 'var(--color-card)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        zIndex: 100,
      }}
    >
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            📚
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>阅读助手</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>Reading Tracker</div>
          </div>
        </div>
      </div>

      <nav style={{ position: 'relative', flex: 1 }}>
        <div
          ref={indicatorRef}
          style={{
            position: 'absolute',
            background: 'linear-gradient(180deg, var(--color-accent), var(--color-accent-light))',
            borderRadius: '2px',
            ...indicatorStyle,
          }}
        />
        {navItems.map((item) => (
          <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          ref={(el) => {
            navRefs.current[item.path] = el;
          }}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 24px',
            margin: '4px 12px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: isActive ? 600 : 400,
            color: isActive ? 'var(--color-text)' : 'var(--color-text-light)',
            backgroundColor: isActive ? 'rgba(139, 90, 43, 0.08)' : 'transparent',
            transition: 'all 0.2s ease',
          })}
        >
          <span style={{ fontSize: '18px' }}>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            borderRadius: '8px',
            background: 'var(--color-bg)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #C49A6C, #8B5A2B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            R
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>读者</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>连续阅读 7 天 🔥</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const BottomTabBar: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const [indicatorStyleList, setIndicatorStyleList] = useState<Record<string, React.CSSProperties>>({});

  useEffect(() => {
    const newStyles: Record<string, React.CSSProperties> = {};
    navItems.forEach((item) => {
      const isActive =
        (item.path === '/' && currentPath === '/') ||
        (item.path !== '/' && currentPath.startsWith(item.path));
      newStyles[item.path] = {
        width: isActive ? '100%' : '0%',
        opacity: isActive ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    });
    setIndicatorStyleList(newStyles);
  }, [currentPath]);

  return (
    <nav
      className="mobile-only"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--tabbar-height)',
        background: 'var(--color-card)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100,
      }}
    >
      {navItems.map((item) => {
        const isActive =
          (item.path === '/' && currentPath === '/') ||
          (item.path !== '/' && currentPath.startsWith(item.path));
        return (
          <NavLink
            key={item.path}
            end={item.path === '/'}
            to={item.path}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 12px',
              position: 'relative',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-light)',
              textDecoration: 'none',
            }}
          >
            <div style={{ fontSize: '20px' }}>{item.icon}</div>
            <span style={{ fontSize: '11px', fontWeight: isActive ? 600 : 400 }}>
              {item.label}
            </span>
            <div
              style={{
                position: 'absolute',
                top: '4px',
                height: '3px',
                background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light))',
                borderRadius: '2px',
                ...indicatorStyleList[item.path],
              }}
            />
          </NavLink>
        );
      })}
    </nav>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar currentPath={location.pathname} />
      <BottomTabBar currentPath={location.pathname} />
      <main
        style={{
          flex: 1,
          marginLeft: 'var(--sidebar-width)',
          padding: '32px',
          paddingBottom: 'calc(32px + var(--tabbar-height))',
          maxWidth: '1200px',
          width: '100%',
        }}
      >
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/book/:id" element={<BookDetailPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
