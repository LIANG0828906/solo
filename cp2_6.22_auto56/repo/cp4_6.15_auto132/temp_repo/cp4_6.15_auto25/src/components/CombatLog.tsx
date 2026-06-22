import React, { useEffect, useRef } from 'react';
import type { CombatLogEntry } from '@/types';

interface CombatLogProps {
  logs: CombatLogEntry[];
  collapsed?: boolean;
}

const typeStyles: Record<CombatLogEntry['type'], string> = {
  attack: 'log-entry--attack',
  heal: 'log-entry--heal',
  defense: 'log-entry--defense',
  system: 'log-entry--system',
  buff: 'log-entry--buff',
};

const CombatLog: React.FC<CombatLogProps> = ({ logs, collapsed = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (collapsed) return null;

  return (
    <div className="combat-log">
      <div className="log-header">
        <span className="log-title">📜 战斗日志</span>
      </div>
      <div className="log-content" ref={scrollRef}>
        {logs.length === 0 ? (
          <div className="log-empty">战斗尚未开始...</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`log-entry ${typeStyles[log.type]}`}
            >
              <span className="log-turn">T{log.turn}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CombatLog;
