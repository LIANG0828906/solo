import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/boardgames', label: '桌游库', icon: '🎲' },
  { path: '/join', label: '加入活动', icon: '🔗' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen, currentPlayer } =
    useAppStore();
  const navigate = useNavigate();

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    if (currentPlayer) {
      navigate(`/profile/${currentPlayer.id}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="菜单"
      >
        ☰
      </button>

      <div
        className={`${styles.overlay} ${mobileMenuOpen ? styles.visible : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside
        className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${
          mobileMenuOpen ? styles.mobileOpen : styles.mobileClosed
        }`}
      >
        <div className={styles.header}>
          <span className={styles.logo}>🎴</span>
          <span className={styles.title}>桌游吧</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={handleNavClick}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.playerSection}>
          {currentPlayer ? (
            <div className={styles.playerCard} onClick={handleProfileClick}>
              <div className={styles.playerAvatar}>{currentPlayer.avatarInitial}</div>
              <div className={styles.playerInfo}>
                <div className={styles.playerName}>{currentPlayer.name}</div>
                <div className={styles.playerLabel}>个人资料</div>
              </div>
            </div>
          ) : (
            <div className={styles.playerCard} onClick={() => navigate('/profile/me')}>
              <div className={styles.playerAvatar}>?</div>
              <div className={styles.playerInfo}>
                <div className={styles.playerName}>未登录</div>
                <div className={styles.playerLabel}>点击设置昵称</div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.collapseBtn} onClick={toggleSidebar}>
            <span className={styles.collapseIcon}>◀</span>
            {!sidebarCollapsed && <span>收起菜单</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
