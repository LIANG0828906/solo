import React, { useRef, useEffect } from 'react';
import { BattleLogEntry, LogType } from '../modules/card/CardTypes';
import { ScrollText } from 'lucide-react';

interface BattleLogProps {
  logs: BattleLogEntry[];
  className?: string;
}

const logTypeColors: Record<LogType, string> = {
  [LogType.PLAYER]: '#4a9eff',
  [LogType.AI]: '#ff6b6b',
  [LogType.SYSTEM]: '#888888',
};

export const BattleLog: React.FC<BattleLogProps> = ({ logs, className = '' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(26, 26, 46, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50">
        <ScrollText size={18} className="text-yellow-400" />
        <h3 className="text-yellow-400 font-bold text-sm">对战日志</h3>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{ maxHeight: '300px' }}
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">
            暂无对战记录
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="text-xs leading-relaxed"
              style={{ color: logTypeColors[log.type] }}
            >
              <span className="text-gray-500 mr-2">[{formatTime(log.timestamp)}]</span>
              {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
