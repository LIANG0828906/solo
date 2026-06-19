import { useMemo } from 'react';
import RiskCard from './RiskCard';
import type { Risk, RiskStatus } from '@/types';
import { STATUS_LABELS } from '@/types';

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
    <div className="board-view-container">
      {statuses.map((status, columnIndex) => (
        <div key={status} className="board-column">
          <div className="board-column-header">
            <h3 className="board-column-title">{STATUS_LABELS[status]}</h3>
            <span className="board-column-count">{groupedRisks[status].length}</span>
          </div>
          <div className="board-column-content">
            {groupedRisks[status].map((risk, index) => (
              <RiskCard
                key={risk.id}
                risk={risk}
                isNew={risk.id === newRiskId}
                animationDelay={columnIndex * 60 + index * 20}
                transitionPhase={transitionPhase}
                onViewDetail={onViewDetail}
              />
            ))}
            {groupedRisks[status].length === 0 && (
              <div className="view-empty-state">暂无风险</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BoardView;
