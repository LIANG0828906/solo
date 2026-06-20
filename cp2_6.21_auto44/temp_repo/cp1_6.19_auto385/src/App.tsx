import { useEffect } from 'react';
import { useAttendanceStore } from './store/attendanceStore';
import ClockPanel from './components/ClockPanel';
import Heatmap from './components/Heatmap';
import ChartBars from './components/ChartBars';
import LeaveBalancePanel from './components/LeaveBalancePanel';

const App = () => {
  const { actions } = useAttendanceStore();

  useEffect(() => {
    actions.fetchRecords();
  }, [actions]);

  const navItems = [
    { icon: '📊', label: '考勤看板', active: true },
    { icon: '📝', label: '打卡记录', active: false },
    { icon: '⏰', label: '加班管理', active: false },
    { icon: '👥', label: '员工管理', active: false },
    { icon: '⚙️', label: '系统设置', active: false },
  ];

  return (
    <div style={styles.app}>
      <nav className="sidebar" style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏢</span>
          <span className="logo-text" style={styles.logoText}>考勤通</span>
        </div>
        <div style={styles.navList}>
          {navItems.map((item, index) => (
            <div
              key={index}
              style={{
                ...styles.navItem,
                backgroundColor: item.active ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderLeftColor: item.active ? '#2196F3' : 'transparent',
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span className="nav-label" style={styles.navLabel}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>张</div>
            <div>
              <div className="user-name" style={styles.userName}>管理员</div>
              <div className="user-role" style={styles.userRole}>系统管理员</div>
            </div>
          </div>
        </div>
      </nav>

      <main style={styles.mainContent}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>员工考勤与工时统计看板</h1>
          <div style={styles.headerActions}>
            <span style={styles.dateRange}>最近7天</span>
          </div>
        </header>

        <div className="content-grid" style={styles.contentGrid}>
          <div style={styles.leftPanel}>
            <ClockPanel />
          </div>
          <div style={styles.rightPanel}>
            <Heatmap />
            <ChartBars />
          </div>
        </div>

        <LeaveBalancePanel />
      </main>
    </div>
  );
};

const styles = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#FAFAFA',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#37474F',
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'all 0.2s ease-in-out',
  },
  logo: {
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logoIcon: {
    fontSize: '28px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
  },
  navList: {
    flex: 1,
    padding: '16px 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    borderLeft: '3px solid transparent',
  },
  navIcon: {
    fontSize: '18px',
  },
  navLabel: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.85)',
  },
  sidebarFooter: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#2196F3',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '14px',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    marginBottom: '2px',
  },
  userRole: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflowX: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #EEE',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#333',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  dateRange: {
    padding: '8px 16px',
    backgroundColor: '#F5F5F5',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#666',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    padding: '20px 32px',
  },
  leftPanel: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
};

export default App;
