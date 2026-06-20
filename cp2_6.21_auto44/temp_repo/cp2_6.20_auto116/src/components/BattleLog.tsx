import React, { useRef, useEffect } from 'react';
import { Tag } from 'antd';
import { BattleLogEntry, LogType } from '../modules/card/CardTypes';

interface BattleLogProps {
  logs: BattleLogEntry[];
  className?: string;
}

const logTypeConfig: Record<LogType, { color: string; label: string }> = {
  [LogType.PLAYER]: { color: 'blue', label: '玩家' },
  [LogType.AI]: { color: 'red', label: 'AI' },
  [LogType.SYSTEM]: { color: 'default', label: '系统' },
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const BattleLog: React.FC<BattleLogProps> = ({ logs, className = '' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

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
        <span className="text-yellow-400 font-bold text-sm">📜</span>
        <h3 className="text-yellow-400 font-bold text-sm">对战日志</h3>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1.5"
        style={{ maxHeight: '300px' }}
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">
            暂无对战记录
          </div>
        ) : (
          logs.map((log) => {
            const config = logTypeConfig[log.type];
            return (
              <div
                key={log.id}
                className="flex items-start gap-2 text-xs leading-relaxed"
              >
                <span className="text-gray-500 flex-shrink-0 mt-0.5">
                  [{formatTime(log.timestamp)}]
                </span>
                <Tag
                  color={config.color}
                  style={{
                    margin: 0,
                    fontSize: '10px',
                    lineHeight: '18px',
                    padding: '0 4px',
                    flexShrink: 0,
                  }}
                >
                  {config.label}
                </Tag>
                <span className="text-gray-300">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
