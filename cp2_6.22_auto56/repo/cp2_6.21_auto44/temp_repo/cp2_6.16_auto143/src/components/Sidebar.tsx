import React from 'react';
import { useAppStore } from '@/store';
import { DateFilter, TypeFilter } from '@/types';

const Sidebar: React.FC = () => {
  const {
    dateFilter,
    typeFilter,
    setDateFilter,
    setTypeFilter,
    favorites,
    markets,
    sidebarOpen,
    toggleSidebar,
  } = useAppStore();

  const favoriteCount = favorites.length;
  const pendingCount = markets.reduce(
    (sum, m) => sum + m.booths.filter(b => b.status === 'pending').length,
    0
  );

  const dateOptions: { value: DateFilter; label: string }[] = [
    { value: 'all', label: '全部日期' },
    { value: 'thisWeekend', label: '本周末' },
    { value: 'nextWeekend', label: '下周末' },
    { value: 'thisMonth', label: '本月' },
  ];

  const typeOptions: { value: TypeFilter; label: string; icon: string }[] = [
    { value: 'all', label: '全部类型', icon: '🎪' },
    { value: 'secondhand', label: '二手市集', icon: '🛍️' },
    { value: 'handmade', label: '手作市集', icon: '🎨' },
    { value: 'food', label: '美食市集', icon: '🍜' },
  ];

  return (
    <>
      {sidebarOpen && (
        <div style={styles.overlay} onClick={toggleSidebar} />
      )}
      
      <aside style={{ ...styles.sidebar, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div style={styles.navSection}>
          <h3 style={styles.sectionTitle}>📅 日期筛选</h3>
          <div style={styles.filterGroup}>
            {dateOptions.map(option => (
              <button
                key={option.value}
                style={{
                  ...styles.filterBtn,
                  backgroundColor: dateFilter === option.value ? 'var(--accent)' : 'transparent',
                  color: dateFilter === option.value ? 'white' : 'rgba(255, 255, 255, 0.85)',
                }}
                onClick={() => setDateFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.navSection}>
          <h3 style={styles.sectionTitle}>🎯 类型筛选</h3>
          <div style={styles.filterGroup}>
            {typeOptions.map(option => (
              <button
                key={option.value}
                style={{
                  ...styles.filterBtn,
                  backgroundColor: typeFilter === option.value ? 'var(--accent)' : 'transparent',
                  color: typeFilter === option.value ? 'white' : 'rgba(255, 255, 255, 0.85)',
                }}
                onClick={() => setTypeFilter(option.value)}
              >
                <span style={{ marginRight: '8px' }}>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.navSection}>
          <h3 style={styles.sectionTitle}>⭐ 我的收藏</h3>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{favoriteCount}</span>
            <span style={styles.statLabel}>个收藏市集</span>
          </div>
        </div>

        <div style={styles.navSection}>
          <h3 style={styles.sectionTitle}>📝 待审核</h3>
          <div style={{ ...styles.statCard, borderColor: 'var(--warning)' }}>
            <span style={{ ...styles.statNumber, color: 'var(--warning)' }}>{pendingCount}</span>
            <span style={styles.statLabel}>个摊位申请</span>
          </div>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>BazaarHub v1.0</p>
          <p style={styles.footerSubtext}>发现城市里的有趣市集</p>
        </div>
      </aside>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed',
    left: 0,
    top: '64px',
    bottom: 0,
    width: '230px',
    background: 'linear-gradient(180deg, #3E2723 0%, #4E342E 100%)',
    color: 'white',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    overflowY: 'auto',
    zIndex: 90,
    transition: 'transform 300ms ease-out',
  },
  overlay: {
    display: 'none',
    position: 'fixed',
    top: '64px',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 89,
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '4px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterBtn: {
    padding: '10px 14px',
    borderRadius: '10px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition)',
  },
  statCard: {
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    textAlign: 'center',
  },
  statNumber: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--accent)',
  },
  statLabel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footerSubtext: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '4px',
  },
};

export default Sidebar;
