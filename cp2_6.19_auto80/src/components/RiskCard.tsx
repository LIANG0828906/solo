import { memo } from 'react';
import type { Risk } from '@/types';
import { RISK_LEVEL_COLORS, STATUS_LABELS, LEVEL_LABELS } from '@/types';
import { formatDate } from '@/utils/date';

interface RiskCardProps {
  risk: Risk;
  isNew?: boolean;
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
  const levelColor = RISK_LEVEL_COLORS[risk.level];
  const statusLabel = STATUS_LABELS[risk.status];
  const levelLabel = LEVEL_LABELS[risk.level];

  const getCardClasses = () => {
    const classes = ['risk-card'];
    classes.push(`level-${risk.level}`);
    if (isNew) classes.push('risk-card-new');
    if (transitionPhase === 'out') classes.push('risk-card-exit');
    if (transitionPhase === 'in') classes.push('risk-card-enter');
    return classes.join(' ');
  };

  return (
    <div
      className={getCardClasses()}
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
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
      <div className="risk-card-header">
        <h3 className="risk-card-title">{risk.title}</h3>
        <span
          className="risk-level-tag"
          style={{ backgroundColor: levelColor + '20', color: levelColor }}
        >
          {levelLabel}
        </span>
      </div>

      <div className="risk-card-body">
        <div className="risk-card-meta">
          <span className="risk-meta-item">
            <span className="risk-meta-label">状态</span>
            <span className={`risk-status-badge risk-status-${risk.status}`}>
              {statusLabel}
            </span>
          </span>
          <span className="risk-meta-item">
            <span className="risk-meta-label">负责人</span>
            <span className="risk-meta-value">{risk.owner}</span>
          </span>
        </div>

        <p className="risk-impact-preview">
          {risk.impact.length > 50 ? risk.impact.slice(0, 50) + '...' : risk.impact}
        </p>
      </div>

      <div className="risk-card-footer">
        <span className="risk-date-text">创建于 {formatDate(risk.createdAt)}</span>
        <span className="risk-date-text">预计 {formatDate(risk.expectedCloseDate)} 解决</span>
      </div>

      <div className="risk-card-indicator" style={{ backgroundColor: levelColor }} />
    </div>
  );
});

export default RiskCard;
