import { useEffect, useState, useMemo } from 'react';
import { getLogs } from '@/services/timelineService';
import type { LogEntry, LogAction } from '@/types';

const ACTION_COLORS: Record<LogAction, string> = {
  created: '#3B82F6',
  moved: '#F59E0B',
  deleted: '#EF4444',
};

const ACTION_LABELS: Record<LogAction, string> = {
  created: '创建',
  moved: '移动',
  deleted: '删除',
};

interface TimelineViewProps {
  boardId: string;
}

export default function TimelineView({ boardId }: TimelineViewProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    getLogs(boardId).then(setLogs).catch(() => {});
  }, [boardId]);

  const grouped = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    logs
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach((log) => {
        const date = new Date(log.timestamp).toLocaleDateString('zh-CN');
        if (!map.has(date)) map.set(date, []);
        map.get(date)!.push(log);
      });
    return Array.from(map.entries());
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="bg-[#FAFAFA] rounded-lg p-8 text-center">
        <p className="text-sm text-slate-400">暂无时间线记录</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAFA] rounded-lg p-6 w-full overflow-x-auto custom-scrollbar">
      <div className="relative min-w-max pb-4">
        <div className="h-0.5 bg-slate-300 relative" style={{ marginTop: '28px' }}>
          {grouped.map(([date, entries]) => (
            <div key={date} className="inline-flex flex-col items-start mr-12 align-top" style={{ display: 'inline-flex' }}>
              <div className="text-xs text-slate-500 font-medium mb-2 whitespace-nowrap">{date}</div>
              <div className="flex items-center gap-3 relative" style={{ top: '-3px' }}>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="relative"
                    onMouseEnter={() => setHoveredId(entry.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full cursor-pointer transition-transform hover:scale-150"
                      style={{ backgroundColor: ACTION_COLORS[entry.action] }}
                    />
                    {hoveredId === entry.id && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                        <div className="font-medium">{entry.taskTitle}</div>
                        <div className="text-slate-300 mt-0.5">
                          {ACTION_LABELS[entry.action]} · {new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-slate-400 mt-0.5">操作人: {entry.operator}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
