import React, { useMemo } from 'react';
import { useLoggerStore } from '../store/loggerStore';
import { formatTimestamp, truncateString, formatValueForDisplay } from '../../utils';

export const EventLogPanel: React.FC = React.memo(() => {
  const { logs, expandedLogId, toggleExpandLog } = useLoggerStore();

  const displayLogs = useMemo(() => {
    return logs.slice(0, 50);
  }, [logs]);

  if (displayLogs.length === 0) {
    return (
      <div className="empty-state">
        暂无交互事件日志
      </div>
    );
  }

  return (
    <div className="custom-scrollbar" style={{ height: '100%', overflowY: 'auto' }}>
      {displayLogs.map((log) => {
        const isExpanded = expandedLogId === log.id;
        const payloadPreview = truncateString(
          formatValueForDisplay(log.payload),
          60
        );

        return (
          <div
            key={log.id}
            className={`log-entry ${isExpanded ? 'expanded' : ''}`}
            onClick={() => toggleExpandLog(log.id)}
          >
            <div className="log-header">
              <span className="log-type">{log.type}</span>
              <span className="log-time">{formatTimestamp(log.timestamp)}</span>
            </div>
            <div className="log-payload-preview">{payloadPreview}</div>
            {isExpanded && (
              <div className="log-details">
                {JSON.stringify(log.payload, null, 2)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

EventLogPanel.displayName = 'EventLogPanel';
