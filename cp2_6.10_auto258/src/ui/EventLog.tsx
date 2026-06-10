import { useEffect, useState } from 'react';
import { useLoomStore } from '../store/useLoomStore';
import type { LogEntry } from '../types';

interface LogItemProps {
  entry: LogEntry;
  index: number;
  isHighlighted: boolean;
  onClick: () => void;
}

function LogItem({ entry, index, isHighlighted, onClick }: LogItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'create_point':
        return '#e94560';
      case 'connect_thread':
        return '#16c79a';
      case 'play_sound':
        return '#ffd700';
      default:
        return '#888';
    }
  };

  const getTypeIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'create_point':
        return '●';
      case 'connect_thread':
        return '━';
      case 'play_sound':
        return '♪';
      default:
        return '•';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-300 mb-2 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      } ${
        isHighlighted
          ? 'bg-[#16c79a]/20 border border-[#16c79a]/50'
          : 'bg-[#0f3460]/30 border border-transparent hover:bg-[#0f3460]/50 hover:border-[#0f3460]/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className="text-lg flex-shrink-0 mt-0.5"
          style={{ color: getTypeColor(entry.type) }}
        >
          {getTypeIcon(entry.type)}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm text-gray-200 leading-snug"
            style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
          >
            {entry.message}
          </p>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            {formatTime(entry.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function EventLog() {
  const logs = useLoomStore((state) => state.logs);
  const highlightedThreadId = useLoomStore((state) => state.highlightedThreadId);
  const highlightThread = useLoomStore((state) => state.highlightThread);

  const handleLogClick = (entry: LogEntry) => {
    if (entry.threadId) {
      if (highlightedThreadId === entry.threadId) {
        highlightThread(null);
      } else {
        highlightThread(entry.threadId);
      }
    }
  };

  return (
    <div className="fixed right-6 top-6 w-80 bg-[#16213e]/80 backdrop-blur-md rounded-xl p-5 border border-[#0f3460]/50 shadow-2xl z-10 max-h-[calc(100vh-3rem)] flex flex-col">
      <h2
        className="text-xl font-bold mb-5 text-center flex-shrink-0"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          background: 'linear-gradient(90deg, #16c79a, #e94560)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '2px',
        }}
      >
        事件日志
      </h2>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <div className="text-4xl mb-3 opacity-30">✨</div>
            <p className="text-sm" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              暂无操作记录
            </p>
            <p className="text-xs mt-2 text-gray-600">
              点击3D场景开始编织光的网络
            </p>
          </div>
        ) : (
          logs.map((entry, index) => (
            <LogItem
              key={entry.id}
              entry={entry}
              index={index}
              isHighlighted={highlightedThreadId === entry.threadId}
              onClick={() => handleLogClick(entry)}
            />
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-[#0f3460]/50 flex-shrink-0">
        <p className="text-xs text-gray-500 text-center">
          最近 {logs.length} 条记录
        </p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 52, 96, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(22, 199, 154, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(22, 199, 154, 0.8);
        }
      `}</style>
    </div>
  );
}
