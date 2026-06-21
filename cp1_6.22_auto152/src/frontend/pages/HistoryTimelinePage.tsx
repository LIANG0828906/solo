import React, { useState } from 'react';
import { HistoryRecord, DimensionScore } from '../../shared/types';

interface Props {
  history: HistoryRecord[];
  loading: boolean;
}

function getScoreColor(score: number): string {
  if (score <= 2) return '#EF4444';
  if (score <= 3) return '#EAB308';
  if (score <= 4) return '#84CC16';
  return '#22C55E';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const HistoryTimelinePage: React.FC<Props> = ({ history, loading }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>历史评估记录</h1>
        <p className="page-subtitle">点击节点查看详细评分</p>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <p>暂无历史评估记录</p>
        </div>
      ) : (
        <div className="timeline">
          {history.map((record, index) => {
            const isExpanded = expandedId === record.id;
            return (
              <div
                key={record.id}
                className={`timeline-item ${isExpanded ? 'expanded' : ''}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="timeline-node-wrapper">
                  <div
                    className="timeline-node"
                    style={{ backgroundColor: getScoreColor(record.totalScore) }}
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  >
                    <span className="timeline-node-score">{record.totalScore.toFixed(1)}</span>
                  </div>
                  {index < history.length - 1 && <div className="timeline-line"></div>}
                </div>
                <div className="timeline-content">
                  <div
                    className="timeline-header"
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  >
                    <h3 className="timeline-cycle">{record.cycleName}</h3>
                    <span className="timeline-date">{formatDate(record.submittedAt)}</span>
                    <span className="timeline-mobile-score" style={{ color: getScoreColor(record.totalScore) }}>
                      {record.totalScore.toFixed(1)}分
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="timeline-detail">
                      <div className="total-score-display">
                        <span className="total-label">综合得分</span>
                        <span
                          className="total-value"
                          style={{ color: getScoreColor(record.totalScore) }}
                        >
                          {record.totalScore.toFixed(2)} / 5.00
                        </span>
                      </div>
                      <div className="dimensions-detail">
                        {record.dimensions.map((dim: DimensionScore) => (
                          <div key={dim.dimensionId} className="dimension-detail">
                            <div className="dimension-detail-header">
                              <span className="dimension-detail-name">{dim.dimensionName}</span>
                              <span
                                className="dimension-detail-score"
                                style={{ color: getScoreColor(dim.averageScore) }}
                              >
                                平均分：{dim.averageScore.toFixed(2)}
                              </span>
                            </div>
                            <ul className="indicator-scores">
                              {dim.indicators.map((ind) => (
                                <li key={ind.indicatorId} className="indicator-score-item">
                                  <span className="indicator-score-name">{ind.indicatorName}</span>
                                  <span className="indicator-score-meta">
                                    <span style={{ color: getScoreColor(ind.score) }}>
                                      {ind.score}分
                                    </span>
                                    <span className="indicator-score-weight">权重 {ind.weight}%</span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryTimelinePage;
