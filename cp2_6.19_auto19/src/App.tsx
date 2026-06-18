import React, { useState, useEffect } from 'react';
import { useGroupBuyStore } from './modules/groupBuy/store/groupBuyStore';
import { useScheduleStore } from './modules/schedule/store/scheduleStore';
import { GroupCreator } from './modules/groupBuy/components/GroupCreator';
import { GroupCard } from './modules/groupBuy/components/GroupCard';
import { VirtualGrid } from './components/VirtualGrid';
import { UserProfile } from './components/UserProfile';

type Page = 'home' | 'my';

function App() {
  const { groupBuys, loading, error, fetchGroupBuys, checkAndCloseExpired } = useGroupBuyStore();
  const { fetchSlots } = useScheduleStore();
  const [showCreator, setShowCreator] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');

  useEffect(() => {
    fetchGroupBuys();
    fetchSlots();
    const timer = setInterval(() => {
      checkAndCloseExpired();
    }, 10000);
    return () => clearInterval(timer);
  }, [fetchGroupBuys, fetchSlots, checkAndCloseExpired]);

  return (
    <div style={styles.app}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; text-shadow: 0 0 5px rgba(255, 126, 103, 0.5); }
          50% { opacity: 0.8; text-shadow: 0 0 15px rgba(255, 126, 103, 0.8); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
        }
        .tab-active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 3px;
          background-color: #FF7E67;
          border-radius: 2px;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
          background-color: #FFF8E7;
        }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>🍊 拼鲜团</h1>
          <div style={styles.headerActions}>
            <button
              style={{
                ...styles.navBtn,
                ...(currentPage === 'home' ? styles.navBtnActive : {}),
              }}
              onClick={() => setCurrentPage('home')}
            >
              首页
            </button>
            <button
              style={{
                ...styles.navBtn,
                ...(currentPage === 'my' ? styles.navBtnActive : {}),
              }}
              onClick={() => setCurrentPage('my')}
            >
              我的
            </button>
            <button style={styles.createBtn} onClick={() => setShowCreator(true)}>
              + 发起拼团
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}

        {currentPage === 'home' && (
          <>
            <div style={styles.pageHeader}>
              <h2 style={styles.pageTitle}>热门拼团</h2>
              <span style={styles.pageSubtitle}>共 {groupBuys.length} 个拼团进行中</span>
            </div>

            {loading && groupBuys.length === 0 ? (
              <div style={styles.loading}>加载中...</div>
            ) : (
              <div style={styles.gridContainer}>
                <VirtualGrid
                  items={groupBuys}
                  itemHeight={380}
                  gap={16}
                  overscan={2}
                  renderItem={(group, _, style) => (
                    <div key={group.id} style={style} className="card-hover">
                      <GroupCard group={group} />
                    </div>
                  )}
                />
              </div>
            )}
          </>
        )}

        {currentPage === 'my' && <UserProfile onClose={() => setCurrentPage('home')} />}
      </main>

      {showCreator && <GroupCreator onClose={() => setShowCreator(false)} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#FFF8E7',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#FFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#FF7E67',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navBtn: {
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  navBtnActive: {
    color: '#FF7E67',
    fontWeight: 600,
    backgroundColor: '#FFF0EC',
  },
  createBtn: {
    padding: '8px 20px',
    backgroundColor: '#FF7E67',
    color: '#FFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginLeft: '8px',
  },
  main: {
    flex: 1,
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    width: '100%',
    boxSizing: 'border-box',
  },
  pageHeader: {
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#333',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#999',
  },
  error: {
    backgroundColor: '#FFE8E4',
    color: '#FF7E67',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#999',
    fontSize: '14px',
  },
  gridContainer: {
    height: 'calc(100vh - 200px)',
    minHeight: '400px',
  },
};

export default App;
