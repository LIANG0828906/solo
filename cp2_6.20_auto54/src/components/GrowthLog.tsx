import React from 'react';
import dayjs from 'dayjs';
import { GrowthLogEntry, ActionType, GrowthStage } from '../types';

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

const getActionColor = (action: ActionType): string => {
  switch (action) {
    case ActionType.PLANT:
      return '#5a8f4c';
    case ActionType.WATER:
      return '#2196f3';
    case ActionType.FERTILIZE:
      return '#ff9800';
    default:
      return '#888';
  }
};

const getStageName = (stage: GrowthStage): string => {
  switch (stage) {
    case GrowthStage.SEEDLING:
      return '幼苗期';
    case GrowthStage.GROWING:
      return '成长期';
    case GrowthStage.MATURE:
      return '成熟期';
    default:
      return '';
  }
};

export const GrowthLog: React.FC<GrowthLogProps> = ({ logs, plantedAt }) => {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="growth-log-container">
      <div className="log-planting-info">
        <span className="planting-label">🌱 种植时间</span>
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
            sortedLogs.map((log) => {
              const actionColor = getActionColor(log.action);
              const hasProgress = 
                log.details?.oldProgress !== undefined && 
                log.details?.newProgress !== undefined;
              return (
                <div key={log.id} className="log-item">
                  <div className="log-dot" style={{ background: actionColor, boxShadow: `0 0 0 3px ${actionColor}33` }} />
                  <div className="log-content">
                    <div className="log-top-row">
                      <span className="log-action">
                        <span className="log-icon">{getActionIcon(log.action)}</span>
                        <span className="log-action-label" style={{ color: actionColor }}>
                          {getActionLabel(log.action)}
                        </span>
                      </span>
                      <span className="log-time">{dayjs(log.timestamp).format('HH:mm:ss')}</span>
                    </div>
                    
                    {hasProgress && (
                      <div className="log-progress-bar">
                        <div className="log-progress-track">
                          <div 
                            className="log-progress-old" 
                            style={{ width: `${log.details!.oldProgress}%` }}
                          />
                          <div 
                            className="log-progress-new" 
                            style={{ 
                              width: `${log.details!.boostValue || 0}%`,
                              left: `${log.details!.oldProgress}%`
                            }}
                          />
                          <div 
                            className="log-progress-handle" 
                            style={{ left: `${log.details!.newProgress}%` }}
                          />
                        </div>
                        <div className="log-progress-values">
                          <span className="log-progress-old-val">{log.details!.oldProgress}%</span>
                          <span className="log-progress-boost" style={{ color: actionColor }}>
                            +{log.details!.boostValue}%
                          </span>
                          <span className="log-progress-new-val" style={{ color: actionColor }}>
                            {log.details!.newProgress}%
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="log-desc">{log.description}</div>

                    {log.details?.stageChanged && log.action !== ActionType.PLANT && (
                      <div className="log-stage-change">
                        <span className="stage-badge old-badge">
                          {getStageName(log.details.oldStage!)}
                        </span>
                        <span className="stage-arrow">➡️</span>
                        <span className="stage-badge new-badge">
                          {getStageName(log.details.newStage!)}
                        </span>
                      </div>
                    )}

                    <div className="log-date-row">
                      <span className="log-date">{dayjs(log.timestamp).format('YYYY-MM-DD')}</span>
                    </div>
                  </div>
                </div>
              );
            })
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
          padding: 10px 14px;
          background: linear-gradient(90deg, rgba(90, 143, 76, 0.1), rgba(245, 230, 163, 0.1));
          border-radius: 10px;
          margin-bottom: 14px;
          border: 1px solid rgba(90, 143, 76, 0.15);
        }
        .planting-label {
          font-size: 12px;
          color: #8b6f47;
          font-weight: 600;
        }
        .planting-time {
          font-size: 13px;
          color: #5a8f4c;
          font-weight: 700;
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
          font-weight: 700;
          color: #5a8f4c;
        }
        .log-count {
          font-size: 11px;
          color: #999;
          background: #f5f1e8;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .log-list {
          max-height: 260px;
          overflow-y: auto;
          padding-right: 6px;
        }
        .log-list::-webkit-scrollbar {
          width: 5px;
        }
        .log-list::-webkit-scrollbar-track {
          background: #f5f1e8;
          border-radius: 3px;
        }
        .log-list::-webkit-scrollbar-thumb {
          background: #5a8f4c55;
          border-radius: 3px;
        }
        .log-list::-webkit-scrollbar-thumb:hover {
          background: #5a8f4c88;
        }
        .log-item {
          display: flex;
          gap: 12px;
          padding: 10px 0;
          animation: log-fade-in 0.35s ease;
          border-bottom: 1px dashed #f0ebe0;
        }
        .log-item:last-child {
          border-bottom: none;
        }
        @keyframes log-fade-in {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .log-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
          position: relative;
        }
        .log-item:not(:last-child) .log-dot::after {
          content: '';
          position: absolute;
          top: 18px;
          left: 5px;
          width: 2px;
          height: calc(100% + 14px);
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
          margin-bottom: 6px;
        }
        .log-action {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .log-icon {
          font-size: 15px;
          line-height: 1;
        }
        .log-action-label {
          font-size: 13px;
          font-weight: 700;
        }
        .log-time {
          font-size: 11px;
          color: #aaa;
          font-family: 'Courier New', monospace;
          font-weight: 600;
        }
        .log-progress-bar {
          background: #faf7f0;
          border-radius: 8px;
          padding: 8px 10px;
          margin-bottom: 6px;
          border: 1px solid #f0ebe0;
        }
        .log-progress-track {
          position: relative;
          height: 6px;
          background: #e8e0d0;
          border-radius: 3px;
          margin-bottom: 4px;
          overflow: visible;
        }
        .log-progress-old {
          position: absolute;
          height: 100%;
          left: 0;
          background: #d0c8b8;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .log-progress-new {
          position: absolute;
          height: 100%;
          background: linear-gradient(90deg, rgba(90, 143, 76, 0.6), rgba(90, 143, 76, 1));
          border-radius: 3px;
          animation: progress-grow 0.5s ease;
        }
        @keyframes progress-grow {
          from {
            transform: scaleX(0);
            transform-origin: left;
          }
          to {
            transform: scaleX(1);
            transform-origin: left;
          }
        }
        .log-progress-handle {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #5a8f4c;
          top: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
        .log-progress-values {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }
        .log-progress-old-val {
          color: #b0a898;
        }
        .log-progress-boost {
          font-size: 11px;
          font-weight: 800;
        }
        .log-desc {
          font-size: 12px;
          color: #555;
          margin-bottom: 6px;
          line-height: 1.4;
        }
        .log-stage-change {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: linear-gradient(90deg, rgba(160, 212, 104, 0.15), rgba(172, 146, 236, 0.15));
          border-radius: 8px;
          margin-bottom: 6px;
        }
        .stage-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .old-badge {
          background: #fff;
          color: #a0d468;
          border: 1px solid #a0d468;
        }
        .new-badge {
          background: rgba(172, 146, 236, 0.2);
          color: #ac92ec;
          border: 1px solid #ac92ec;
        }
        .stage-arrow {
          font-size: 10px;
          opacity: 0.7;
        }
        .log-date-row {
          display: flex;
          justify-content: flex-end;
        }
        .log-date {
          font-size: 10px;
          color: #c0b8a8;
        }
        .log-empty {
          text-align: center;
          padding: 32px 24px;
          color: #c0b8a8;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};
