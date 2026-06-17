import React, { useMemo } from 'react';
import { useBoardStore } from '@/stores/boardStore';
import { ActionType, ActionTypeIcons, ActionTypeLabels } from '@/types';
import { formatTimestamp } from '@/utils';
import { History, RotateCcw, LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

const HistoryPanel: React.FC = () => {
  const { snapshots, revertToSnapshot, isReverting } = useBoardStore();

  const recentSnapshots = useMemo(() => {
    return [...snapshots].reverse().slice(0, 10);
  }, [snapshots]);

  const getIcon = (iconName: string): LucideIcon => {
    return (Icons as unknown as Record<string, LucideIcon>)[iconName] || RotateCcw;
  };

  const handleRevert = (snapshotId: string, index: number) => {
    if (index === 0 || isReverting) return;
    revertToSnapshot(snapshotId);
  };

  return (
    <div className="history-panel">
      <div className="history-title">
        <History size={18} />
        <span>历史记录</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 'normal' }}>
          ({snapshots.length})
        </span>
      </div>
      <div className="history-list">
        {recentSnapshots.map((snapshot, index) => {
          const IconComponent = getIcon(ActionTypeIcons[snapshot.actionType as ActionType]);
          return (
            <div
              key={snapshot.id}
              className={`history-item ${index === 0 ? 'current' : ''}`}
              onClick={() => handleRevert(snapshot.id, index)}
              style={{
                opacity: isReverting ? 0.5 : 1,
                cursor: index === 0 || isReverting ? 'not-allowed' : 'pointer',
              }}
            >
              {isReverting && index !== 0 ? (
                <RotateCcw size={16} className="history-icon" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <IconComponent size={16} className="history-icon" />
              )}
              <span className="history-action">
                {ActionTypeLabels[snapshot.actionType as ActionType]}
              </span>
              <span className="history-time">
                {formatTimestamp(snapshot.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default HistoryPanel;
