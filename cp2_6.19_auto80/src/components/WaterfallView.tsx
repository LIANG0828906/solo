import { useMemo } from 'react';
import RiskCard from './RiskCard';
import type { Risk, RiskLevel } from '@/types';
import { LEVEL_LABELS, RISK_LEVEL_COLORS } from '@/types';
import styles from './WaterfallView.module.css';

interface WaterfallViewProps {
  risks: Risk[];
  newRiskId: string | null;
  transitionPhase: 'out' | 'in' | 'stable';
  onViewDetail: (risk: Risk) => void;
}

const WaterfallView = ({ risks, newRiskId, transitionPhase, onViewDetail }: WaterfallViewProps) => {
  const groupedRisks = useMemo(() => {
    const groups: Record<RiskLevel, Risk[]> = {
      high: [],
      medium: [],
      low: [],
    };

    risks.forEach((risk) => {
      groups[risk.level].push(risk);
    });

    return groups;
  }, [risks]);

  const levels: RiskLevel[] = ['high', 'medium', 'low'];

  return (
    <div className={styles.waterfallContainer}>
      {levels.map((level) => (
        <div key={level} className={styles.waterfallGroup}>
          <div className={styles.groupHeader}>
            <div
              className={styles.levelIndicator}
              style={{ backgroundColor: RISK_LEVEL_COLORS[level] }}
            />
            <h3 className={styles.groupTitle}>{LEVEL_LABELS[level]}</h3>
            <span className={styles.groupCount}>{groupedRisks[level].length}</span>
          </div>
          <div className={styles.groupContent}>
            {groupedRisks[level].map((risk, index) => (
              <div key={risk.id} className={styles.cardWrapper}>
                <RiskCard
                  risk={risk}
                  isNew={risk.id === newRiskId}
                  animationDelay={index * 20}
                  transitionPhase={transitionPhase}
                  onViewDetail={onViewDetail}
                />
              </div>
            ))}
            {groupedRisks[level].length === 0 && (
              <div className={styles.emptyState}>暂无风险</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WaterfallView;
