import React, { useState } from 'react';
import type { ReportData } from '../types';
import { dataService } from '../DataService';
import StarRating from './StarRating';
import '../styles/HistoryList.css';

interface HistoryListProps {
  reports: ReportData[];
  selectedId: string | null;
  onSelect: (report: ReportData | null) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({
  reports,
  selectedId,
  onSelect,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSelect = (report: ReportData) => {
    if (selectedId === report.id) {
      onSelect(null);
    } else {
      onSelect(report);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="history-list">
        <h3 className="history-list__title">历史报告</h3>
        <div className="history-empty">
          暂无历史报告
        </div>
      </div>
    );
  }

  return (
    <div className="history-list">
      <h3 className="history-list__title">历史报告对比</h3>
      <p className="history-list__subtitle">
        点击选择报告与当前数据叠加对比
      </p>

      <div className="history-items">
        {reports.map((report, index) => {
          const isExpanded = expandedId === report.id;
          const isSelected = selectedId === report.id;
          const avgScore = report.dimensions.length > 0
            ? Object.values(report.averages).reduce((a, b) => a + b, 0) / report.dimensions.length
            : 0;

          return (
            <div
              key={report.id}
              className={`history-item ${isSelected ? 'history-item--selected' : ''}`}
              style={{ animationDelay: `${index * 60}ms` }}
              onClick={() => handleSelect(report)}
            >
              <div
                className="history-item__header"
                onClick={(e) => toggleExpand(report.id, e)}
              >
                <div className="history-item__info">
                  <span className="history-item__date">
                    {dataService.formatDate(report.createdAt)}
                  </span>
                  <span className="history-item__count">
                    {report.totalFeedbacks} 份反馈
                  </span>
                </div>
                <div className="history-item__right">
                  <span className="history-item__score">
                    {avgScore.toFixed(1)}
                  </span>
                  <span className={`history-item__arrow ${isExpanded ? 'history-item__arrow--expanded' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              <div
                className={`history-item__content ${isExpanded ? 'history-item__content--expanded' : ''}`}
              >
                <div className="history-dim-list">
                  {report.dimensions.map(dim => (
                    <div key={dim.id} className="history-dim-item">
                      <span className="history-dim-name">{dim.name}</span>
                      <div className="history-dim-right">
                        <StarRating
                          value={Math.round(report.averages[dim.id] || 0)}
                          max={10}
                          readOnly
                          size="sm"
                        />
                        <span className="history-dim-score">
                          {(report.averages[dim.id] || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isSelected && (
                <div className="history-item__badge">对比中</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryList;
