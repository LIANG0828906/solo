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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
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
