import React from 'react';
import { useAppStore, selectFilteredMarkets } from '@/store';
import MarketCard from '@/components/MarketCard';
import { useNavigate } from 'react-router-dom';

const MarketList: React.FC = () => {
  const navigate = useNavigate();
  const filteredMarkets = useAppStore(selectFilteredMarkets);
  const { dateFilter, typeFilter } = useAppStore();

  const handleCardClick = (marketId: string) => {
    navigate(`/market/${marketId}`);
  };

  const getFilterSummary = () => {
    const parts: string[] = [];
    if (dateFilter !== 'all') {
      const labels: Record<string, string> = {
        thisWeekend: '本周末',
        nextWeekend: '下周末',
        thisMonth: '本月',
      };
      parts.push(labels[dateFilter] || dateFilter);
    }
    if (typeFilter !== 'all') {
      const labels: Record<string, string> = {
        secondhand: '二手',
        handmade: '手作',
        food: '美食',
      };
      parts.push(labels[typeFilter] || typeFilter);
    }
    return parts.length > 0 ? parts.join(' · ') : '全部';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🎪 探索市集</h1>
          <p style={styles.subtitle}>
            当前筛选：<span style={styles.filterTag}>{getFilterSummary()}</span>
            <span style={styles.count}> 共 {filteredMarkets.length} 个市集</span>
          </p>
        </div>
      </div>

      {filteredMarkets.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔍</div>
          <h3 style={styles.emptyTitle}>没有找到符合条件的市集</h3>
          <p style={styles.emptyText}>试试调整筛选条件，看看其他有趣的市集吧！</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredMarkets.map((market, index) => (
            <MarketCard
              key={market.id}
              market={market}
              index={index}
              onClick={() => handleCardClick(market.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    flex: 1,
    overflowY: 'auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  filterTag: {
    color: 'var(--accent)',
    fontWeight: 600,
  },
  count: {
    marginLeft: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
};

export default MarketList;
