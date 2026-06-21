import React, { useEffect, useRef } from 'react';
import type { BattleLogEntry } from '../types';

interface BattleLogProps {
  logs: BattleLogEntry[];
}

const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="battle-log">
      <h3 className="panel-title">战斗日志</h3>
      <div className="log-container" ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className="empty-log">暂无记录</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.id}
              className={`log-entry ${index === logs.length - 1 ? 'latest' : ''}`}
            >
              <span className="log-turn">[{log.turn}]</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BattleLog;
