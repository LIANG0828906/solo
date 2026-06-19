import React from 'react';
import { StatusUpdate } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import './Timeline.css';

interface TimelineProps {
  history: StatusUpdate[];
}

const statusIcons: Record<string, string> = {
  pending: '📝',
  processing: '🔧',
  completed: '✅',
  failed: '❌'
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '无法修复'
};

export default function Timeline({ history }: TimelineProps) {
  const reversedHistory = [...history].reverse();

  return (
    <div className="timeline">
      {reversedHistory.map((item, index) => {
        const isLatest = index === 0;
        return (
          <div key={index} className={`timeline-item ${isLatest ? 'latest' : ''}`}>
            <div className="timeline-node">
              <span className="timeline-icon">{statusIcons[item.status]}</span>
            </div>
            <div className="timeline-line"></div>
            <div className="timeline-content">
              <div className="timeline-header">
                <span className={`timeline-status ${isLatest ? 'highlight' : ''}`}>
                  {statusLabels[item.status]}
                </span>
                <span className="timeline-time">
                  {format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </span>
              </div>
              <p className="timeline-note">{item.note}</p>
              {item.repairer && (
                <span className="timeline-repairer">操作人: {item.repairer}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
