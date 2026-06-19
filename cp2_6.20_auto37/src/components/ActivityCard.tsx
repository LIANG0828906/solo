import React from 'react';
import type { Promotion, PromotionType, PromotionStatus } from '../types';
import { format } from 'date-fns';
import RippleButton from './RippleButton';

interface ActivityCardProps {
  promotion: Promotion;
  onToggle: (id: string) => void;
  onEdit: (promotion: Promotion) => void;
  onDelete: (id: string) => void;
  style?: React.CSSProperties;
  index?: number;
}

const getTypeConfig = (type: PromotionType) => {
  switch (type) {
    case 'DISCOUNT':
      return { label: '折扣', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' };
    case 'FULL_REDUCTION':
      return { label: '满减', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' };
    case 'GIFT':
      return { label: '赠品', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' };
    default:
      return { label: '未知', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)' };
  }
};

const getStatusConfig = (status: PromotionStatus) => {
  switch (status) {
    case 'ACTIVE':
      return { label: '进行中', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' };
    case 'INACTIVE':
      return { label: '已暂停', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)' };
    case 'EXPIRED':
      return { label: '已过期', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' };
    case 'DRAFT':
      return { label: '草稿', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' };
    default:
      return { label: '未知', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)' };
  }
};

const ActivityCard = React.memo<ActivityCardProps>(({
  promotion,
  onToggle,
  onEdit,
  onDelete,
  style,
  index = 0,
}) => {
  const typeConfig = getTypeConfig(promotion.type);
  const statusConfig = getStatusConfig(promotion.status);
  const isPaused = promotion.status === 'INACTIVE';

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd');
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        ...style,
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {isPaused && (
        <div style={styles.pausedOverlay}>
          <span style={styles.pausedLabel}>已暂停</span>
        </div>
      )}

      <div style={styles.cardHeader}>
        <h3 style={styles.title}>{promotion.name}</h3>
        <div style={styles.typeBadgeContainer}>
          <span style={{
            ...styles.typeBadge,
            color: typeConfig.color,
            backgroundColor: typeConfig.bgColor,
          }}>
            {typeConfig.label}
          </span>
        </div>
      </div>

      <div style={styles.cardBody}>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>时间范围</span>
          <span style={styles.infoValue}>
            {formatDate(promotion.startTime)} ~ {formatDate(promotion.endTime)}
          </span>
        </div>

        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>适用类别</span>
          <span style={styles.infoValue}>
            {promotion.type === 'DISCOUNT' && `折扣 ${(promotion.config as any).discountRate}折`}
            {promotion.type === 'FULL_REDUCTION' && `满${(promotion.config as any).fullAmount}减${(promotion.config as any).reductionAmount}`}
            {promotion.type === 'GIFT' && `赠品: ${(promotion.config as any).giftName}`}
          </span>
        </div>

        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>状态</span>
          <span style={{
            ...styles.statusBadge,
            color: statusConfig.color,
            backgroundColor: statusConfig.bgColor,
          }}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div style={styles.cardFooter}>
        <RippleButton
          variant="outline"
          onClick={() => onEdit(promotion)}
          className="edit-btn"
        >
          编辑
        </RippleButton>
        <RippleButton
          variant="secondary"
          onClick={() => onDelete(promotion.id)}
          className="delete-btn"
        >
          删除
        </RippleButton>
        <RippleButton
          variant="primary"
          onClick={() => onToggle(promotion.id)}
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
  },
  pausedLabel: {
    padding: '8px 24px',
    backgroundColor: 'rgba(107, 114, 128, 0.9)',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
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
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  infoLabel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'right',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  cardFooter: {
    display: 'flex',
    gap: '8px',
    marginTop: 'auto',
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
