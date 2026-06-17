import React, { useEffect, useState } from 'react';
import { Empty, Spin } from 'antd';
import { useTravelogStore } from '../store/travelogStore';
import { formatDateTime } from '../utils/format';
import type { Travelog } from '../types';

interface TravelogListProps {
  onSelectTravelog: (travelog: Travelog) => void;
}

const TravelogList: React.FC<TravelogListProps> = ({ onSelectTravelog }) => {
  const { travelogs, loading, fetchTravelogs } = useTravelogStore();
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTravelogs();
  }, [fetchTravelogs]);

  useEffect(() => {
    travelogs.forEach((t, index) => {
      setTimeout(() => {
        setVisibleItems((prev) => new Set([...prev, t.id]));
      }, index * 100);
    });
  }, [travelogs]);

  if (loading && travelogs.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (travelogs.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <Empty description="还没有游记，去地图签到处生成你的第一篇游记吧！" />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>我的游记</h2>
        <span style={styles.count}>共 {travelogs.length} 篇</span>
      </div>
      <div className="travelog-grid" style={styles.grid}>
        {travelogs.map((travelog) => (
          <div
            key={travelog.id}
            className="travelog-card"
            style={{
              ...styles.card,
              opacity: visibleItems.has(travelog.id) ? 1 : 0,
              transform: visibleItems.has(travelog.id)
                ? 'translateY(0)'
                : 'translateY(20px)',
            }}
            onClick={() => onSelectTravelog(travelog)}
          >
            <div style={styles.imageContainer}>
              <img
                src={travelog.coverImage}
                alt={travelog.title}
                className="travelog-card-image"
                style={styles.coverImage}
              />
              <div className="travelog-card-overlay" style={styles.imageOverlay} />
            </div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>{travelog.title}</h3>
              <p style={styles.cardSummary}>
                {travelog.content.length > 60
                  ? travelog.content.slice(0, 60) + '...'
                  : travelog.content}
              </p>
              <div style={styles.cardFooter}>
                <span style={styles.cardDate}>
                  {formatDateTime(travelog.createdAt)}
                </span>
                <span style={styles.cardCheckins}>
                  {travelog.checkins?.length || 0} 个签到点
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px 32px',
    height: '100%',
    overflowY: 'auto' as const,
    boxSizing: 'border-box' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: '#1A237E',
    margin: 0,
  },
  count: {
    fontSize: 14,
    color: '#999',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    justifySelf: 'center',
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition:
      'box-shadow 0.3s ease, transform 0.3s ease, opacity 0.3s ease',
  },
  imageContainer: {
    position: 'relative' as const,
    width: '100%',
    paddingTop: '66.67%',
    overflow: 'hidden',
  },
  coverImage: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    transition: 'transform 0.3s ease',
  },
  imageOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3))',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  cardContent: {
    padding: '16px 20px 20px',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1A237E',
    margin: '0 0 8px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardSummary: {
    fontSize: 13,
    color: '#666',
    lineHeight: 1.6,
    margin: '0 0 12px 0',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    minHeight: 42,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTop: '1px solid #f0f0f0',
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  cardCheckins: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: 500,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  emptyContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
};

export default TravelogList;
