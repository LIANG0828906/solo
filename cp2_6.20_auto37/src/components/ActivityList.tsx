import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Promotion, PromotionType, PromotionStatus } from '../types';
import ActivityCard from './ActivityCard';
import { usePromotionStore, useFilteredPromotions } from '../store';

const CARD_HEIGHT = 280;
const GAP = 16;

const getGridConfig = (width: number) => {
  if (width >= 1024) return { columns: 3 };
  if (width >= 768) return { columns: 2 };
  return { columns: 1 };
};

const SkeletonCard: React.FC = () => (
  <div style={styles.skeletonCard}>
    <div style={styles.skeletonHeader}>
      <div style={styles.skeletonTitle} />
      <div style={styles.skeletonBadge} />
    </div>
    <div style={styles.skeletonBody}>
      {[1, 2, 3].map(i => (
        <div key={i} style={styles.skeletonRow}>
          <div style={{ ...styles.skeletonText, width: '30%' }} />
          <div style={{ ...styles.skeletonText, width: '60%' }} />
        </div>
      ))}
    </div>
    <div style={styles.skeletonFooter}>
      {[1, 2, 3].map(i => (
        <div key={i} style={styles.skeletonButton} />
      ))}
    </div>
  </div>
);

const ActivityList: React.FC = () => {
  const navigate = useNavigate();
  const {
    loading,
    searchTerm,
    typeFilter,
    statusFilter,
    setSearchTerm,
    setTypeFilter,
    setStatusFilter,
    loadPromotions,
    togglePromotionLocal,
    deletePromotionLocal,
    setCurrentPromotion,
  } = usePromotionStore();

  const filteredPromotions = useFilteredPromotions();
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const { columns } = useMemo(
    () => getGridConfig(containerWidth),
    [containerWidth]
  );

  const handleToggle = useCallback((id: string) => {
    togglePromotionLocal(id);
  }, [togglePromotionLocal]);

  const handleEdit = useCallback((promotion: Promotion) => {
    setCurrentPromotion(promotion);
    navigate(`/edit/${promotion.id}`);
  }, [setCurrentPromotion, navigate]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('确定要删除这个活动吗？')) {
      deletePromotionLocal(id);
    }
  }, [deletePromotionLocal]);

  const typeOptions: { value: PromotionType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: '全部类型' },
    { value: 'DISCOUNT', label: '折扣' },
    { value: 'FULL_REDUCTION', label: '满减' },
    { value: 'GIFT', label: '赠品' },
  ];

  const statusOptions: { value: PromotionStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: '全部状态' },
    { value: 'ACTIVE', label: '进行中' },
    { value: 'INACTIVE', label: '已暂停' },
    { value: 'EXPIRED', label: '已过期' },
    { value: 'DRAFT', label: '草稿' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.searchIcon}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="搜索活动名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterSelects}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PromotionType | 'ALL')}
            style={styles.select}
          >
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PromotionStatus | 'ALL')}
            style={styles.select}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.resultInfo}>
        <span style={styles.resultText}>
          共找到 <strong style={{ color: '#667eea' }}>{filteredPromotions.length}</strong> 个活动
        </span>
      </div>

      <div ref={containerRef} style={styles.gridContainer}>
        {loading ? (
          <div
            style={{
              ...styles.grid,
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
            }}
          >
            {Array.from({ length: Math.min(6, columns * 2) }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">暂无活动</h3>
            <p className="empty-state-text">点击"创建活动"来开始您的第一个促销活动</p>
          </div>
        ) : (
          <div
            style={{
              ...styles.grid,
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
            }}
          >
            {filteredPromotions.map((promotion, index) => (
              <ActivityCard
                key={promotion.id}
                promotion={promotion}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
                index={index}
                style={{
                  animationDelay: `${index * 0.03}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  filterBar: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    position: 'relative',
    flex: 1,
    minWidth: '200px',
    maxWidth: '400px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 44px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  filterSelects: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  select: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '140px',
  },
  resultInfo: {
    padding: '0 4px',
  },
  resultText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
  },
  gridContainer: {
    position: 'relative',
    minHeight: '400px',
  },
  grid: {
    display: 'grid',
    gap: `${GAP}px`,
    padding: `${GAP / 2}px`,
  },
  skeletonCard: {
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: CARD_HEIGHT,
  },
  skeletonHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  skeletonTitle: {
    height: '20px',
    borderRadius: '4px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    flex: 1,
  },
  skeletonBadge: {
    width: '50px',
    height: '24px',
    borderRadius: '6px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  skeletonBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  skeletonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  skeletonText: {
    height: '16px',
    borderRadius: '4px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  skeletonFooter: {
    display: 'flex',
    gap: '8px',
    marginTop: 'auto',
  },
  skeletonButton: {
    flex: 1,
    height: '40px',
    borderRadius: '8px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  
  select option {
    background-color: #1a1a2e;
    color: #fff;
  }
`;
document.head.appendChild(styleSheet);

export default ActivityList;
