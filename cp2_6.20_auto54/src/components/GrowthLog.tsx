import React from 'react';
import dayjs from 'dayjs';
import { GrowthLogEntry, ActionType } from '../types';

interface GrowthLogProps {
  logs: GrowthLogEntry[];
  plantedAt: number;
}

const getActionIcon = (action: ActionType): string => {
  switch (action) {
    case ActionType.PLANT:
      return '🌱';
    case ActionType.WATER:
      return '💧';
    case ActionType.FERTILIZE:
      return '✨';
    default:
      return '📝';
  }
};

const getActionLabel = (action: ActionType): string => {
  switch (action) {
    case ActionType.PLANT:
      return '种植';
    case ActionType.WATER:
      return '浇水';
    case ActionType.FERTILIZE:
      return '施肥';
    default:
      return '操作';
  }
};

export const GrowthLog: React.FC<GrowthLogProps> = ({ logs, plantedAt }) => {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="growth-log-container">
      <div className="log-planting-info">
        <span className="planting-label">种植时间</span>
        <span className="planting-time">{dayjs(plantedAt).format('YYYY-MM-DD HH:mm:ss')}</span>
      </div>
      <div className="log-timeline">
        <div className="log-header">
          <span className="log-title">📋 生长日志</span>
          <span className="log-count">共 {logs.length} 条记录</span>
        </div>
        <div className="log-list">
          {sortedLogs.length === 0 ? (
            <div className="log-empty">暂无记录</div>
          ) : (
            sortedLogs.map((log) => (
              <div key={log.id} className="log-item">
                <div className="log-dot" />
                <div className="log-content">
                  <div className="log-top-row">
                    <span className="log-action">
                      <span className="log-icon">{getActionIcon(log.action)}</span>
                      <span className="log-action-label">{getActionLabel(log.action)}</span>
                    </span>
                    <span className="log-time">{dayjs(log.timestamp).format('HH:mm:ss')}</span>
                  </div>
                  <div className="log-desc">{log.description}</div>
                  <div className="log-date">{dayjs(log.timestamp).format('YYYY-MM-DD')}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`
        .growth-log-container {
          padding: 12px 4px 4px;
          border-top: 1px solid #e8e0d0;
        }
        .log-planting-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: linear-gradient(90deg, #f5e6a344, transparent);
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .planting-label {
          font-size: 12px;
          color: #8b6f47;
          font-weight: 500;
        }
        .planting-time {
          font-size: 13px;
          color: #5a8f4c;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 0 4px;
        }
        .log-title {
          font-size: 14px;
          font-weight: 600;
          color: #5a8f4c;
        }
        .log-count {
          font-size: 11px;
          color: #999;
        }
        .log-list {
          max-height: 240px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .log-list::-webkit-scrollbar {
          width: 4px;
        }
        .log-list::-webkit-scrollbar-thumb {
          background: #5a8f4c44;
          border-radius: 2px;
        }
        .log-item {
          display: flex;
          gap: 12px;
          padding: 8px 0;
          animation: log-fade-in 0.3s ease;
        }
        @keyframes log-fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .log-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #5a8f4c;
          margin-top: 6px;
          flex-shrink: 0;
          box-shadow: 0 0 0 3px #5a8f4c22;
          position: relative;
        }
        .log-item:not(:last-child) .log-dot::after {
          content: '';
          position: absolute;
          top: 14px;
          left: 4px;
          width: 2px;
          height: calc(100% + 8px);
          background: #e8e0d0;
        }
        .log-content {
          flex: 1;
          min-width: 0;
        }
        .log-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }
        .log-action {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .log-icon {
          font-size: 14px;
        }
        .log-action-label {
          font-size: 12px;
          font-weight: 600;
          color: #333;
        }
        .log-time {
          font-size: 11px;
          color: #999;
          font-family: 'Courier New', monospace;
        }
        .log-desc {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }
        .log-date {
          font-size: 10px;
          color: #bbb;
        }
        .log-empty {
          text-align: center;
          padding: 24px;
          color: #ccc;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};
