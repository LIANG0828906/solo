import React from 'react';
import { StatusLog, STATUS_LABELS, STATUS_COLORS } from '../types';

interface OrderTimelineProps {
  logs: StatusLog[];
  currentStatus: string;
}

const ALL_STATUSES = ['pending', 'confirmed', 'soaking', 'extracting', 'dyeing', 'fixing', 'washing', 'inspecting', 'completed'];

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ logs, currentStatus }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogForStatus = (status: string) => {
    return logs.find(log => log.status === status);
  };

  const currentIndex = ALL_STATUSES.indexOf(currentStatus);

  return (
    <div className="timeline">
      {ALL_STATUSES.map((status, index) => {
        const log = getLogForStatus(status);
        const isCompleted = index <= currentIndex;
        const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS];

        return (
          <div 
            key={status} 
            className={`timeline-item ${isCompleted ? 'completed' : ''}`}
            style={{ ['--status-color' as any]: color }}
          >
            <div className="timeline-dot" style={{ ['--status-color' as any]: color }}></div>
            <div className="timeline-content">
              <div className="timeline-status" style={{ color }}>
                {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              </div>
              <div className="timeline-time">
                {log ? formatTime(log.timestamp) : '未完成'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
