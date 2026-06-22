import React, { useState } from 'react';
import { useRecommendation } from './hooks/useRecommendation';

interface RoutePanelProps {
  currentId: number;
  onNavigate: (id: number) => void;
  variant?: 'desktop' | 'mobile';
}

const RecommendCard: React.FC<{
  item: { id: number; name: string };
  onClick: () => void;
}> = ({ item, onClick }) => (
  <div
    style={styles.card}
    onClick={onClick}
    onMouseEnter={(e) => {
      const el = e.currentTarget as HTMLDivElement;
      el.style.transform = 'translateY(-3px)';
      el.style.boxShadow = '0 4px 16px rgba(56,189,248,0.3)';
      el.style.border = '2px solid #38BDF8';
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget as HTMLDivElement;
      el.style.transform = 'translateY(0)';
      el.style.boxShadow = 'none';
      el.style.border = '2px solid transparent';
    }}
  >
    <div style={styles.thumbnail}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#475569">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="#64748B" />
        <path d="M21 15l-5-5L5 21" stroke="#64748B" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
    <span style={styles.cardName}>{item.name}</span>
  </div>
);

const SkeletonCards: React.FC = () => (
  <div style={styles.cardList}>
    {[0, 1].map((i) => (
      <div key={i} className="skeleton-pulse" style={styles.skeletonCard} />
    ))}
  </div>
);

const RoutePanel: React.FC<RoutePanelProps> = ({ currentId, onNavigate, variant = 'desktop' }) => {
  const { recommendations, loading } = useRecommendation(currentId);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (variant === 'mobile') {
    return (
      <div style={styles.mobileDrawer}>
        <div style={styles.drawerHeader} onClick={() => setDrawerOpen(!drawerOpen)}>
          <span style={styles.drawerTitle}>参观路线推荐</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            style={{
              transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease-in-out',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <div
          style={{
            ...styles.drawerContent,
            maxHeight: drawerOpen ? 200 : 0,
            padding: drawerOpen ? '12px 16px' : '0 16px',
          }}
        >
          {loading ? (
            <SkeletonCards />
          ) : (
            <div style={styles.cardList}>
              {recommendations.map((item) => (
                <RecommendCard
                  key={item.id}
                  item={item}
                  onClick={() => {
                    onNavigate(item.id);
                    setDrawerOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.desktopPanel}>
      <h3 style={styles.heading}>参观路线推荐</h3>
      {loading ? (
        <SkeletonCards />
      ) : (
        <div style={styles.cardList}>
          {recommendations.map((item) => (
            <RecommendCard
              key={item.id}
              item={item}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  desktopPanel: {
    padding: 24,
  },
  heading: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: 600,
    margin: '0 0 16px 0',
    textAlign: 'left',
  },
  cardList: {
    display: 'flex',
    gap: 12,
    overflowX: 'auto',
    paddingBottom: 8,
  },
  skeletonCard: {
    width: 160,
    height: 120,
    borderRadius: 12,
    background: '#334155',
    flexShrink: 0,
  },
  card: {
    width: 160,
    height: 120,
    borderRadius: 12,
    background: '#1E293B',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexShrink: 0,
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'transform 0.2s, box-shadow 0.2s, border 0.2s',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    background: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'center',
  },
  mobileDrawer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#0F172A',
    borderTop: '1px solid #334155',
    zIndex: 100,
  },
  drawerHeader: {
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    cursor: 'pointer',
  },
  drawerTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: 600,
  },
  drawerContent: {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-in-out, padding 0.3s ease-in-out',
  },
};

export default RoutePanel;
