import React, { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { GrowthLogEntry, ActionType, GrowthStage } from '../types';

interface GrowthLogProps {
  logs: GrowthLogEntry[];
  plantedAt: number;
}

const PAGE_SIZE = 5;

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

const LogItem: React.FC<{
  log: GrowthLogEntry;
  index: number;
  total: number;
  isLast: boolean;
}> = React.memo(({ log, index, total, isLast }) => {
  const actionColor = getActionColor(log.action);
  const hasProgress = 
    log.details?.oldProgress !== undefined && 
    log.details?.newProgress !== undefined;

  return (
    <div 
      className="log-item"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div 
        className="log-dot" 
        style={{ 
          background: actionColor, 
          boxShadow: `0 0 0 3px ${actionColor}33` 
        }}
      />
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
          <span className="log-index">#{total - index}</span>
        </div>
      </div>
      {!isLast && <div className="log-connector" />}
    </div>
  );
});

LogItem.displayName = 'LogItem';

export const GrowthLog: React.FC<GrowthLogProps> = ({ logs, plantedAt }) => {
  const [page, setPage] = useState(0);

  const sortedLogs = useMemo(() => 
    [...logs].sort((a, b) => b.timestamp - a.timestamp),
    [logs]
  );

  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  
  const visibleLogs = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return sortedLogs.slice(start, start + PAGE_SIZE);
  }, [sortedLogs, currentPage]);

  const hasMore = currentPage < totalPages - 1;
  const hasPrev = currentPage > 0;
  const showingStart = currentPage * PAGE_SIZE + 1;
  const showingEnd = Math.min((currentPage + 1) * PAGE_SIZE, sortedLogs.length);

  const handleLoadMore = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const handlePrev = useCallback(() => {
    setPage((p) => Math.max(0, p - 1));
  }, []);

  const handlePageSelect = useCallback((pageNum: number) => {
    setPage(pageNum);
  }, []);

  const renderPageButtons = () => {
    const buttons: React.ReactNode[] = [];
    const maxVisible = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(0, endPage - maxVisible + 1);
    }

    if (startPage > 0) {
      buttons.push(
        <button key="first" className="page-btn" onClick={() => handlePageSelect(0)}>
          «
        </button>
      );
      if (startPage > 1) {
        buttons.push(<span key="ellipsis-start" className="page-ellipsis">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`page-btn ${i === currentPage ? 'active' : ''}`}
          onClick={() => handlePageSelect(i)}
        >
          {i + 1}
        </button>
      );
    }

    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        buttons.push(<span key="ellipsis-end" className="page-ellipsis">...</span>);
      }
      buttons.push(
        <button key="last" className="page-btn" onClick={() => handlePageSelect(totalPages - 1)}>
          »
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="growth-log-container">
      <div className="log-planting-info">
        <span className="planting-label">🌱 种植时间</span>
        <span className="planting-time">{dayjs(plantedAt).format('YYYY-MM-DD HH:mm:ss')}</span>
      </div>
      <div className="log-timeline">
        <div className="log-header">
          <div className="log-header-left">
            <span className="log-title">📋 生长日志</span>
            <span className="log-count">共 {sortedLogs.length} 条记录</span>
          </div>
          <div className="log-pagination-mini">
            {hasPrev && (
              <button className="pg-btn" onClick={handlePrev} aria-label="上一页">‹</button>
            )}
            <span className="pg-indicator">{showingStart}-{showingEnd} / {sortedLogs.length}</span>
            {hasMore && (
              <button className="pg-btn" onClick={handleLoadMore} aria-label="下一页">›</button>
            )}
          </div>
        </div>
        
        <div className="log-list">
          {sortedLogs.length === 0 ? (
            <div className="log-empty">暂无记录</div>
          ) : (
            visibleLogs.map((log, idx) => (
              <LogItem
                key={log.id}
                log={log}
                index={currentPage * PAGE_SIZE + idx}
                total={sortedLogs.length}
                isLast={idx === visibleLogs.length - 1 && !hasMore}
              />
            ))
          )}
        </div>

        {sortedLogs.length > PAGE_SIZE && (
          <div className="log-footer">
            {sortedLogs.length > PAGE_SIZE * 2 && (
              <div className="pagination-controls">
                {renderPageButtons()}
              </div>
            )}
            <div className="load-more-container">
              {hasMore && (
                <button className="load-more-btn" onClick={handleLoadMore}>
                  加载更多 ↑
                </button>
              )}
            </div>
          </div>
        )}
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
          flex-wrap: wrap;
          gap: 8px;
        }
        .log-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
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
          font-weight: 600;
        }
        .log-pagination-mini {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pg-btn {
          width: 22px;
          height: 22px;
          border: none;
          background: #f0ebe0;
          color: #8b7d6b;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-bottom: 2px;
          transition: all 0.2s;
        }
        .pg-btn:hover {
          background: #5a8f4c;
          color: white;
        }
        .pg-indicator {
          font-size: 10px;
          color: #999;
          font-weight: 600;
          font-family: 'Courier New', monospace;
          min-width: 60px;
          text-align: center;
        }
        .log-list {
          max-height: 280px;
          overflow-y: auto;
          padding-right: 6px;
          position: relative;
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
          animation: log-fade-in 0.35s ease both;
          border-bottom: 1px dashed #f0ebe0;
          position: relative;
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
          z-index: 2;
        }
        .log-connector {
          position: absolute;
          left: 5px;
          top: 22px;
          width: 2px;
          height: calc(100% - 10px);
          background: linear-gradient(180deg, #e8e0d0, transparent);
          z-index: 1;
        }
        .log-content {
          flex: 1;
          min-width: 0;
          position: relative;
          z-index: 2;
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
          justify-content: space-between;
          align-items: center;
        }
        .log-date {
          font-size: 10px;
          color: #c0b8a8;
        }
        .log-index {
          font-size: 9px;
          color: #d0c8b8;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }
        .log-empty {
          text-align: center;
          padding: 32px 24px;
          color: #c0b8a8;
          font-size: 13px;
        }
        .log-footer {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed #e8e0d0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .page-btn {
          min-width: 26px;
          height: 26px;
          padding: 0 8px;
          border: 1px solid #e8e0d0;
          background: #fff;
          color: #8b7d6b;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .page-btn:hover:not(.active) {
          border-color: #5a8f4c;
          color: #5a8f4c;
        }
        .page-btn.active {
          background: #5a8f4c;
          color: white;
          border-color: #5a8f4c;
        }
        .page-ellipsis {
          color: #c0b8a8;
          font-size: 12px;
          padding: 0 2px;
        }
        .load-more-container {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .load-more-btn {
          padding: 8px 20px;
          border: 1px dashed #5a8f4c66;
          background: rgba(90, 143, 76, 0.08);
          color: #5a8f4c;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .load-more-btn:hover {
          background: rgba(90, 143, 76, 0.15);
          border-style: solid;
        }
      `}</style>
    </div>
  );
};
