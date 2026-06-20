import React, { useEffect, useRef, memo } from 'react';
import type { BattleLogEntry } from '@/types';

interface BattleLogProps {
  logs: BattleLogEntry[];
}

export const BattleLog: React.FC<BattleLogProps> = memo(function BattleLog({ logs }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className="battle-log-wrapper">
      <div className="section-title">📜 战斗日志</div>
      <div className="battle-log-list" ref={scrollRef}>
        {logs.slice(-30).map((log) => (
          <div key={log.id} className={`log-entry ${log.actor}`}>
            <span style={{ opacity: 0.5 }}>[T{log.turn}]</span> {log.message}
          </div>
        ))}
      </div>
    </div>
  );
});
