import React from 'react';
import { useNavigate } from 'react-router-dom';
import { isAfter, isBefore, parseISO, format } from 'date-fns';
import type { Promotion, PromotionType } from '../types';
import RippleButton from './RippleButton';
import { PROMOTION_TYPE_CONFIG, TIME_STATUS_CONFIG, DATE_FORMAT, type TimeStatus } from '../constants';

interface ActivityCardProps {
  promotion: Promotion;
  onToggle: (id: string) => void;
  onEdit: (promotion: Promotion) => void;
  onDelete: (id: string) => void;
  style?: React.CSSProperties;
  index?: number;
}

const calculateTimeStatus = (startTime: string, endTime: string): TimeStatus => {
  const now = new Date();
  const start = parseISO(startTime);
  const end = parseISO(endTime);

  if (isBefore(now, start)) {
    return 'NOT_STARTED';
  }
  if (isAfter(now, end)) {
    return 'ENDED';
  }
  return 'ONGOING';
};

const formatDateTime = (dateStr: string): string => {
  try {
    return format(parseISO(dateStr), DATE_FORMAT.DATETIME);
  } catch {
    return dateStr;
  }
};

const getConfigDisplay = (promotion: Promotion): string => {
  switch (promotion.type) {
    case 'DISCOUNT':
      return `折扣 ${((promotion.config as any).discountRate * 10).toFixed(1)}折`;
    case 'FULL_REDUCTION':
      return `满${(promotion.config as any).fullAmount}减${(promotion.config as any).reductionAmount}`;
    case 'GIFT':
      return `赠品: ${(promotion.config as any).giftName || '未设置'}`;
    default:
      return '-';
  }
};

const getTypeConfig = (type: PromotionType) => PROMOTION_TYPE_CONFIG[type];

const getTimeStatusConfig = (status: TimeStatus) => TIME_STATUS_CONFIG[status];

const ActivityCard = React.memo<ActivityCardProps>(({
  promotion,
  onToggle,
  onEdit,
  onDelete,
  style,
  index = 0,
}) => {
  const navigate = useNavigate();
  const typeConfig = getTypeConfig(promotion.type);
  const timeStatus = calculateTimeStatus(promotion.startTime, promotion.endTime);
  const timeStatusConfig = getTimeStatusConfig(timeStatus);
  const isPaused = promotion.status === 'INACTIVE';

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    onEdit(promotion);
    navigate(`/edit/${promotion.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(promotion);
    navigate(`/edit/${promotion.id}`);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(promotion.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(promotion.id);
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        ...styles.card,
        ...style,
        animationDelay: `${index * 0.05}s`,
        cursor: 'pointer',
      }}
    >
      {isPaused && (
        <div style={styles.pausedOverlay}>
          <span style={styles.pausedLabel}>已暂停</span>
        </div>
      )}

      <div className={`status-badge ${timeStatusConfig.className}`} style={styles.statusBadgeTopRight}>
        <span className="status-dot" />
        <span>{timeStatusConfig.label}</span>
      </div>

      <div style={styles.cardHeader}>
        <h3 style={styles.title}>{promotion.name}</h3>
        <div style={styles.typeBadgeContainer}>
          <span className={`promotion-type-badge ${typeConfig.className}`}>
            {typeConfig.label}
          </span>
        </div>
      </div>

      <div style={styles.cardBody}>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>起止时间</span>
          <span style={styles.infoValue}>
            {formatDateTime(promotion.startTime)}
          </span>
        </div>

        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>至</span>
          <span style={styles.infoValue}>
            {formatDateTime(promotion.endTime)}
          </span>
        </div>

        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>促销规则</span>
          <span style={styles.infoValue}>
            {getConfigDisplay(promotion)}
          </span>
        </div>

        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>适用类别</span>
          <div style={styles.categoriesContainer}>
            {(promotion.categories || []).map((cat, idx) => (
              <span key={idx} style={styles.categoryTag}>
                {cat}
              </span>
            ))}
            {(!promotion.categories || promotion.categories.length === 0) && (
              <span style={{ ...styles.infoValue, opacity: 0.5 }}>未设置</span>
            )}
          </div>
        </div>
      </div>

      <div style={styles.cardFooter}>
        <RippleButton
          variant="outline"
          onClick={handleEditClick}
          className="edit-btn"
        >
          编辑
        </RippleButton>
        <RippleButton
          variant="secondary"
          onClick={handleDeleteClick}
          className="delete-btn"
        >
          删除
        </RippleButton>
        <RippleButton
          variant="primary"
          onClick={handleToggleClick}
          className="toggle-btn"
        >
          {isPaused ? '恢复' : '暂停'}
        </RippleButton>
      </div>
    </div>
  );
});

ActivityCard.displayName = 'ActivityCard';

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: 'relative',
    padding: '20px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    animation: 'slideInUp 0.4s ease-out forwards',
    opacity: 0,
    transform: 'translateY(30px)',
    transition: 'all 0.3s ease',
  },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  pausedLabel: {
    padding: '8px 24px',
    backgroundColor: 'rgba(107, 114, 128, 0.9)',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
  },
  statusBadgeTopRight: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    zIndex: 5,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    paddingRight: '80px',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  typeBadgeContainer: {
    flexShrink: 0,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  infoLabel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
    flexShrink: 0,
    minWidth: '64px',
  },
  infoValue: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'right',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  categoriesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    justifyContent: 'flex-end',
    maxWidth: '70%',
  },
  categoryTag: {
    fontSize: '11px',
    padding: '2px 8px',
    backgroundColor: 'rgba(226, 183, 20, 0.15)',
    color: '#e2b714',
    borderRadius: '4px',
    fontWeight: 500,
  },
  cardFooter: {
    display: 'flex',
    gap: '8px',
    marginTop: 'auto',
    paddingTop: '8px',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default ActivityCard;
