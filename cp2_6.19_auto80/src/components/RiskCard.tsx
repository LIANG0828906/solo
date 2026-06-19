import { useState, memo } from 'react';
import type { Risk } from '@/types';
import { RISK_LEVEL_COLORS, STATUS_LABELS, LEVEL_LABELS } from '@/types';
import { formatDate } from '@/utils/date';
import styles from './RiskCard.module.css';

interface RiskCardProps {
  risk: Risk;
  isNew?: boolean;
  index?: number;
  animationDelay?: number;
  onViewDetail: (risk: Risk) => void;
  transitionPhase?: 'out' | 'in' | 'stable';
}

const RiskCard = memo(function RiskCard({
  risk,
  isNew = false,
  animationDelay = 0,
  onViewDetail,
  transitionPhase = 'stable',
}: RiskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const levelColor = RISK_LEVEL_COLORS[risk.level];
  const statusLabel = STATUS_LABELS[risk.status];
  const levelLabel = LEVEL_LABELS[risk.level];

  const getAnimationClass = () => {
    if (isNew) return styles.cardNew;
    if (transitionPhase === 'out') return styles.cardExit;
    if (transitionPhase === 'in') return styles.cardEnter;
    return '';
  };

  const animationStyle: React.CSSProperties = {
    animationDelay: `${animationDelay}ms`,
  };

  return (
    <div
      className={`${styles.card} ${getAnimationClass()} ${isHovered ? styles.cardHovered : ''}`}
      style={{
        ...animationStyle,
        borderLeft: isHovered ? `3px solid ${levelColor}` : '3px solid transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetail(risk)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetail(risk);
        }
      }}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{risk.title}</h3>
        <span
          className={styles.levelTag}
          style={{ backgroundColor: levelColor + '20', color: levelColor }}
        >
          {levelLabel}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>状态</span>
            <span className={`${styles.statusBadge} ${styles[`status-${risk.status}`]}`}>
              {statusLabel}
            </span>
          </span>
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>负责人</span>
            <span className={styles.metaValue}>{risk.owner}</span>
          </span>
        </div>

        <p className={styles.impactPreview}>
          {risk.impact.length > 50 ? risk.impact.slice(0, 50) + '...' : risk.impact}
        </p>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.dateText}>创建于 {formatDate(risk.createdAt)}</span>
        <span className={styles.dateText}>预计 {formatDate(risk.expectedCloseDate)} 解决</span>
      </div>

      <div className={styles.cardIndicator} style={{ backgroundColor: levelColor }} />
    </div>
  );
});

export default RiskCard;
