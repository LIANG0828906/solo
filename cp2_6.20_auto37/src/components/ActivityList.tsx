import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid } from 'react-window';
import type { Promotion, PromotionType, PromotionStatus } from '../types';
import ActivityCard from './ActivityCard';
import { usePromotionStore, useFilteredPromotions } from '../store';

const CARD_HEIGHT = 280;
const GAP = 16;

const getGridConfig = (width: number) => {
  if (width >= 1024) return { columns: 3, cardWidth: (width - GAP * 4) / 3 };
  if (width >= 768) return { columns: 2, cardWidth: (width - GAP * 3) / 2 };
  return { columns: 1, cardWidth: width - GAP * 2 };
};

const SkeletonCard: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ ...styles.skeletonCard, ...style }}>
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

interface CellData {
  promotions: Promotion[];
  columns: number;
  cardWidth: number;
  onToggle: (id: string) => void;
  onEdit: (promotion: Promotion) => void;
  onDelete: (id: string) => void;
}

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: CellData;
}

const Cell: React.FC<CellProps> = ({ columnIndex, rowIndex, style, data }) => {
  const { promotions, columns, cardWidth, onToggle, onEdit, onDelete } = data;
  const index = rowIndex * columns + columnIndex;

  if (index >= promotions.length) {
    return null;
  }

  const promotion = promotions[index];
  const cardStyle = {
    ...style,
    width: cardWidth,
    height: CARD_HEIGHT,
    left: (style.left as number) + GAP,
    top: (style.top as number) + GAP,
  };

  return (
    <ActivityCard
      promotion={promotion}
      onToggle={onToggle}
      onEdit={onEdit}
      onDelete={onDelete}
      style={cardStyle}
      index={index}
    />
  );
};

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

  const { columns, cardWidth } = useMemo(
    () => getGridConfig(containerWidth),
    [containerWidth]
  );

  const rowCount = Math.ceil(filteredPromotions.length / columns);
  const gridHeight = Math.min(rowCount * (CARD_HEIGHT + GAP) + GAP, 800);

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

  const gridData = useMemo(() => ({
    promotions: filteredPromotions,
    columns,
    cardWidth,
    onToggle: handleToggle,
    onEdit: handleEdit,
    onDelete: handleDelete,
  }), [filteredPromotions, columns, cardWidth, handleToggle, handleEdit, handleDelete]);

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
          <div style={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard
                key={i}
                style={{
                  width: cardWidth,
                  height: CARD_HEIGHT,
                }}
              />
            ))}
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div style={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={styles.emptyIcon}>
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <p style={styles.emptyText}>暂无活动数据</p>
          </div>
        ) : (
          <Grid
            columnCount={columns}
            columnWidth={() => cardWidth + GAP}
            height={gridHeight}
            rowCount={rowCount}
            rowHeight={() => CARD_HEIGHT + GAP}
            width={containerWidth}
            itemData={gridData}
            itemKey={({ columnIndex, rowIndex, data }: { columnIndex: number; rowIndex: number; data: CellData }) => {
              const index = rowIndex * data.columns + columnIndex;
              return data.promotions[index]?.id || `empty-${rowIndex}-${columnIndex}`;
            }}
            style={{ overflowX: 'hidden' }}
          >
            {Cell}
          </Grid>
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
  skeletonGrid: {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(300px, 1fr))`,
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
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: '16px',
  },
  emptyIcon: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '16px',
    margin: 0,
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
