import React, { useState } from 'react';
import { format } from 'date-fns';
import type { SyncLogEntry } from '../types';
import { useBoardStore } from '../store/boardStore';

const SyncLogPanel: React.FC = () => {
  const syncLogs = useBoardStore((s) => s.syncLogs);
  const clearSyncLogs = useBoardStore((s) => s.clearSyncLogs);
  const [isOpen, setIsOpen] = useState(false);

  const actionIcons: Record<string, string> = {
    create_board: '🏗️',
    rename_board: '✏️',
    delete_board: '🗑️',
    add_card: '📌',
    edit_card: '✏️',
    delete_card: '🗑️',
    copy_card: '📋',
    top_card: '⬆️',
    add_connection: '🔗',
    delete_connection: '✂️',
  };

  return (
    <div className="sync-log-panel-wrapper">
      <button
        className="sync-log-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="操作记录"
      >
        📜
      </button>
      {isOpen && (
        <div className="sync-log-panel">
          <div className="sync-log-header">
            <h3>最近操作记录</h3>
            <button className="sync-log-clear" onClick={clearSyncLogs}>清空</button>
          </div>
          <div className="sync-log-list">
            {syncLogs.length === 0 ? (
              <div className="sync-log-empty">暂无操作记录</div>
            ) : (
              syncLogs.map((log) => (
                <div key={log.id} className="sync-log-item">
                  <div className="sync-log-icon">{actionIcons[log.action] || '📝'}</div>
                  <div className="sync-log-content">
                    <div className="sync-log-detail">{log.detail}</div>
                    <div className="sync-log-time">{format(log.timestamp, 'HH:mm:ss')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncLogPanel;
