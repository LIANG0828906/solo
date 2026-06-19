import React from 'react';
import { useBattlefieldStore, Command, CommandType } from '../store';
import { History, Play, Square, Clock, Users, Target } from 'lucide-react';

const typeLabels: Record<CommandType, string> = {
  surround: '包围',
  disperse: '分散',
  formation: '列阵',
};

const typeColors: Record<CommandType, string> = {
  surround: '#ff9800',
  disperse: '#9c27b0',
  formation: '#2196f3',
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

export const HistoryPanel: React.FC = () => {
  const store = useBattlefieldStore();
  const commands = [...store.commands].reverse();

  const handleReplay = (index: number) => {
    const originalIndex = store.commands.length - 1 - index;
    store.startReplay(originalIndex);
  };

  return (
    <aside className="history-panel">
      <div className="panel-header">
        <History size={18} />
        <h2>指令历史</h2>
      </div>
      <div className="stats-bar">
        <div className="stat-item">
          <Users size={12} />
          <span>
            {store.units.filter((u) => u.state !== 'dead').length} 单位
          </span>
        </div>
        <div className="stat-item">
          <Target size={12} />
          <span>{store.commands.length} 指令</span>
        </div>
      </div>
      <div className="history-list">
        {commands.length === 0 && (
          <div className="empty-history">
            <Clock size={28} opacity={0.3} />
            <p>暂无指令记录</p>
            <span>选择单位并下发指令后将显示在此</span>
          </div>
        )}
        {commands.map((cmd: Command, revIdx: number) => {
          const idx = store.commands.length - 1 - revIdx;
          const isActive = store.isReplaying && store.replayFromIndex <= idx;
          return (
            <div
              key={cmd.id}
              className={`history-item ${isActive ? 'active' : ''}`}
              onClick={() => handleReplay(revIdx)}
            >
              <div className="history-top">
                <span
                  className="cmd-badge"
                  style={{ background: typeColors[cmd.type] + '33', color: typeColors[cmd.type] }}
                >
                  {typeLabels[cmd.type]}
                </span>
                <span className={`team-tag ${cmd.team}`}>
                  {cmd.team === 'red' ? '红方' : '蓝方'}
                </span>
              </div>
              <div className="history-meta">
                <span className="time">
                  <Clock size={10} /> {formatTime(cmd.timestamp)}
                </span>
                <span className="unit-count">
                  <Users size={10} /> {cmd.unitIds.length} 单位
                </span>
              </div>
              <div className="history-target">
                目标: ({Math.round(cmd.target.x)}, {Math.round(cmd.target.y)})
              </div>
              {store.isReplaying && store.replayFromIndex === idx && (
                <div className="replay-indicator">
                  <Play size={10} /> 回放中 {store.replaySpeed}x
                </div>
              )}
            </div>
          );
        })}
      </div>
      {store.isReplaying && (
        <div className="replay-bar">
          <button className="stop-replay" onClick={() => store.stopReplay()}>
            <Square size={12} /> 停止回放
          </button>
        </div>
      )}
    </aside>
  );
};

export default HistoryPanel;
