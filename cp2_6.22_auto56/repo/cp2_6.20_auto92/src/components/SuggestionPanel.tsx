import React, { memo, useMemo } from 'react';
import { Suggestion, getStatusColor } from '../types';

interface SuggestionPanelProps {
  suggestions: Suggestion[];
}

const priorityOrder: Record<string, number> = {
  danger: 0,
  warning: 1,
  normal: 2,
};

const statusBadge: Record<string, string> = {
  danger: 'badge-danger',
  warning: 'badge-warning',
  normal: 'badge-success',
};

const statusText: Record<string, string> = {
  danger: '高风险',
  warning: '注意',
  normal: '正常',
};

const SuggestionPanel: React.FC<SuggestionPanelProps> = memo(function SuggestionPanel({
  suggestions,
}) {
  const sortedSuggestions = useMemo(() => {
    return [...suggestions].sort(
      (a, b) => (priorityOrder[a.status] ?? 9) - (priorityOrder[b.status] ?? 9)
    );
  }, [suggestions]);

  if (!sortedSuggestions.length) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#a0aec0' }}>
        暂无建议
      </div>
    );
  }

  return (
    <div className="fade-data" style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
      {sortedSuggestions.map((s) => {
        const color = getStatusColor(s.status);
        return (
          <div key={s.id} className="suggestion-card">
            <div className="suggestion-header">
              <div>
                <span className="suggestion-metric" style={{ color }}>
                  {s.metric}
                </span>
                <span
                  className={`badge ${statusBadge[s.status]}`}
                  style={{ marginLeft: 8 }}
                >
                  {statusText[s.status]}
                </span>
              </div>
              <span className="suggestion-value" style={{ color }}>
                {s.current_value}
              </span>
            </div>
            <div className="suggestion-advice">{s.advice}</div>
            <div className="suggestion-source">来源：{s.source}</div>
          </div>
        );
      })}
    </div>
  );
});

export default SuggestionPanel;
