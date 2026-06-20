import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store';
import type { NavTab } from '@/types';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  tab: NavTab;
  label: string;
  icon: string;
  path: string;
}

const navItems: NavItem[] = [
  { tab: 'home', label: '统计', icon: 'fa-solid fa-chart-simple', path: '/' },
  { tab: 'materials', label: '材料库', icon: 'fa-solid fa-boxes-stacked', path: '/materials' },
  { tab: 'projects', label: '项目', icon: 'fa-solid fa-list-check', path: '/projects' },
  { tab: 'gallery', label: '作品墙', icon: 'fa-solid fa-image', path: '/gallery' },
];

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, activeTab } = useAppStore();

  const sidebarWidth = sidebarCollapsed ? 76 : 240;

  const currentTab = (() => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/materials')) return 'materials';
    if (path.startsWith('/projects')) return 'projects';
    if (path.startsWith('/gallery')) return 'gallery';
    return activeTab;
  })();

  const handleNavClick = (path: string, tab: NavTab) => {
    navigate(path);
  };

  const topbarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 68,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    background: 'rgba(245, 240, 232, 0.75)',
    borderBottom: '1px solid var(--color-border)',
  };

  const hamburgerBtnStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: 'var(--color-text)',
    transition: 'background 0.2s var(--ease-out)',
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--color-text)',
    letterSpacing: 0.5,
  };

  const avatarStyle: React.CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: 600,
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
  };

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 68,
    left: 0,
    bottom: 0,
    width: sidebarWidth,
    zIndex: 90,
    background: 'var(--color-bg-alt)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 12px',
    transition: 'width 0.3s var(--ease-out)',
    overflow: 'hidden',
  };

  const navListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  };

  const getNavItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: sidebarCollapsed ? '12px 0' : '12px 16px',
    borderRadius: 12,
    cursor: 'pointer',
    textDecoration: 'none',
    color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text)',
    background: isActive ? '#ECE5F5' : 'transparent',
    fontWeight: isActive ? 600 : 500,
    fontSize: 14,
    transition: 'all 0.2s var(--ease-out)',
    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  });

  const navIconStyle: React.CSSProperties = {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
    flexShrink: 0,
  };

  const sidebarTipStyle: React.CSSProperties = {
    padding: sidebarCollapsed ? '12px 0' : '12px 14px',
    marginTop: 12,
    borderTop: '1px solid var(--color-border)',
    fontSize: 12,
    color: 'var(--color-text-muted)',
    textAlign: sidebarCollapsed ? 'center' : 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };

  const mainContentStyle: React.CSSProperties = {
    marginTop: 68,
    marginLeft: sidebarWidth,
    padding: 28,
    minHeight: 'calc(100vh - 68px)',
    transition: 'margin-left 0.3s var(--ease-out)',
    background: 'var(--color-bg)',
  };

  const bottomNavStyle: React.CSSProperties = {
    display: 'none',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    background: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
    zIndex: 90,
    boxShadow: '0 -4px 12px rgba(74, 66, 56, 0.06)',
  };

  const bottomNavListStyle: React.CSSProperties = {
    display: 'flex',
    height: '100%',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  };

  const getBottomNavItemStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer',
    color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
    background: isActive ? 'rgba(184, 169, 201, 0.1)' : 'transparent',
    transition: 'all 0.2s var(--ease-out)',
    textDecoration: 'none',
    fontSize: 11,
    fontWeight: isActive ? 600 : 500,
  });

  const bottomNavIconStyle: React.CSSProperties = {
    fontSize: 20,
  };

  const responsiveHideStyle: React.CSSProperties = {};

  return (
    <div style={{ minHeight: '100vh' }}>
      <style>{`
        .nav-item:hover {
          background: rgba(184, 169, 201, 0.15) !important;
        }
        .nav-item:active {
          transform: scale(0.97);
        }
        .hamburger-btn:hover {
          background: rgba(74, 66, 56, 0.06) !important;
        }
        @media (max-width: 768px) {
          .sidebar-desktop {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 20px 16px !important;
            padding-bottom: 84px !important;
            min-height: calc(100vh - 68px) !important;
          }
          .bottom-nav {
            display: block !important;
          }
          .topbar-title {
            font-size: 18px !important;
          }
        }
      `}</style>

      <div style={topbarStyle}>
        <button
          className="hamburger-btn"
          style={hamburgerBtnStyle}
          onClick={toggleSidebar}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(74, 66, 56, 0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <i className={`fa-solid ${sidebarCollapsed ? 'fa-bars' : 'fa-bars-staggered'}`}></i>
        </button>

        <div className="topbar-title" style={logoStyle}>
          <i className="fa-solid fa-needle" style={{ color: 'var(--color-primary)' }}></i>
          <span>CraftSpace</span>
        </div>

        <div style={avatarStyle} title="用户头像">
          <i className="fa-solid fa-user"></i>
        </div>
      </div>

      <div className="sidebar-desktop" style={sidebarStyle}>
        <nav style={navListStyle}>
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            return (
              <a
                key={item.tab}
                className="nav-item"
                style={getNavItemStyle(isActive)}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.path, item.tab);
                }}
                href={item.path}
              >
                <i className={item.icon} style={navIconStyle}></i>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </a>
            );
          })}
        </nav>

        <div style={sidebarTipStyle}>
          {sidebarCollapsed ? (
            <i className="fa-solid fa-lightbulb"></i>
          ) : (
            <span>
              <i className="fa-solid fa-lightbulb" style={{ marginRight: 6 }}></i>
              保持创意，享受手工
            </span>
          )}
        </div>
      </div>

      <div className="bottom-nav" style={bottomNavStyle}>
        <nav style={bottomNavListStyle}>
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            return (
              <a
                key={item.tab}
                style={getBottomNavItemStyle(isActive)}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.path, item.tab);
                }}
                href={item.path}
              >
                <i className={item.icon} style={bottomNavIconStyle}></i>
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <main className="main-content" style={mainContentStyle}>
        {children}
      </main>
    </div>
  );
}
