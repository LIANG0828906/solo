import { useMemo } from 'react';
import RiskCard from './RiskCard';
import type { Risk, RiskStatus } from '@/types';
import { STATUS_LABELS } from '@/types';
import styles from './BoardView.module.css';

interface BoardViewProps {
  risks: Risk[];
  newRiskId: string | null;
  transitionPhase: 'out' | 'in' | 'stable';
  onViewDetail: (risk: Risk) => void;
}

const BoardView = ({ risks, newRiskId, transitionPhase, onViewDetail }: BoardViewProps) => {
  const groupedRisks = useMemo(() => {
    const groups: Record<RiskStatus, Risk[]> = {
      pending: [],
      'in-progress': [],
      closed: [],
    };

    risks.forEach((risk) => {
      groups[risk.status].push(risk);
    });

    return groups;
  }, [risks]);

  const statuses: RiskStatus[] = ['pending', 'in-progress', 'closed'];

  return (
    <div className={styles.boardContainer}>
      {statuses.map((status) => (
        <div key={status} className={styles.boardColumn}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>{STATUS_LABELS[status]}</h3>
            <span className={styles.columnCount}>{groupedRisks[status].length}</span>
          </div>
          <div className={styles.columnContent}>
            {groupedRisks[status].map((risk, index) => (
              <RiskCard
                key={risk.id}
                risk={risk}
                isNew={risk.id === newRiskId}
                animationDelay={index * 20}
                transitionPhase={transitionPhase}
                onViewDetail={onViewDetail}
              />
            ))}
            {groupedRisks[status].length === 0 && (
              <div className={styles.emptyState}>暂无风险</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BoardView;
