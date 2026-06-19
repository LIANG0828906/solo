import { useMemo } from 'react';
import RiskCard from './RiskCard';
import type { Risk, RiskLevel } from '@/types';
import { LEVEL_LABELS, RISK_LEVEL_COLORS } from '@/types';

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
    <div className="waterfall-container">
      {levels.map((level) => (
        <div key={level} className="waterfall-group">
          <div className="waterfall-group-header">
            <div
              className="waterfall-level-indicator"
              style={{ backgroundColor: RISK_LEVEL_COLORS[level] }}
            />
            <h3 className="waterfall-group-title">{LEVEL_LABELS[level]}</h3>
            <span className="waterfall-group-count">{groupedRisks[level].length}</span>
          </div>
          <div className="waterfall-group-content">
            {groupedRisks[level].map((risk, index) => (
              <div key={risk.id} className="waterfall-card-wrapper">
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
              <div className="view-empty-state">暂无风险</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WaterfallView;
