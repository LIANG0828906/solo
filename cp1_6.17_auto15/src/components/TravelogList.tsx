import React, { useEffect, useState } from 'react';
import { Empty, Spin, Button, Tag } from 'antd';
import {
  EyeOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  BookOutlined,
} from '@ant-design/icons';
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
    const timers: ReturnType<typeof setTimeout>[] = [];
    travelogs.forEach((t, index) => {
      const timer = setTimeout(() => {
        setVisibleItems((prev) => new Set([...prev, t.id]));
      }, index * 100);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
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
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#999' }}>
              还没有游记，去地图签到处生成你的第一篇游记吧！
            </span>
          }
        />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          <BookOutlined style={{ marginRight: 8 }} />
          我的游记
        </h2>
        <Tag color="blue" style={styles.countTag}>
          共 {travelogs.length} 篇
        </Tag>
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
          >
            <div style={styles.imageContainer}>
              <img
                src={travelog.coverImage}
                alt={travelog.title}
                className="travelog-card-image"
                style={styles.coverImage}
              />
              <div className="travelog-card-overlay" style={styles.imageOverlay} />
              {travelog.checkins && travelog.checkins.length > 0 && (
                <div style={styles.checkinBadge}>
                  <EnvironmentOutlined style={{ fontSize: 10, marginRight: 3 }} />
                  {travelog.checkins.length} 个签到点
                </div>
              )}
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
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {formatDateTime(travelog.createdAt)}
                </span>
              </div>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTravelog(travelog);
                }}
                style={styles.viewDetailButton}
                block
              >
                查看详情
              </Button>
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
  countTag: {
    fontSize: 13,
    padding: '2px 12px',
    borderRadius: 12,
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
  checkinBadge: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    background: 'rgba(26, 35, 126, 0.8)',
    color: '#fff',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 11,
    backdropFilter: 'blur(4px)',
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
    marginBottom: 12,
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  viewDetailButton: {
    background: '#1976D2',
    borderColor: '#1976D2',
    borderRadius: 4,
    height: 36,
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
