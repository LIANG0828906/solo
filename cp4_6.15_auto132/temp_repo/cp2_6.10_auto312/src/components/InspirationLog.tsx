import React, { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { InspirationLogEntry, StarDustColor } from '@/types';
import { cn } from '@/lib/utils';

const COLOR_MAP: Record<StarDustColor, string> = {
  red: 'bg-stardust-red',
  blue: 'bg-stardust-blue',
  gold: 'bg-stardust-gold',
  purple: 'bg-stardust-purple',
  green: 'bg-stardust-green',
};

interface InspirationLogProps {
  logs: InspirationLogEntry[];
}

const InspirationLog: React.FC<InspirationLogProps> = ({ logs }) => {
  const recentLogs = logs.slice(0, 5);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass-panel p-4 w-72 fixed bottom-4 right-4 z-20">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-stardust-gold" />
        <h3 className="font-display text-lg text-white text-glow">灵感日志</h3>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
        {recentLogs.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-4">暂无灵感记录...</p>
        ) : (
          recentLogs.map((log, index) => (
            <div key={log.id} className="relative pl-4">
              {index < recentLogs.length - 1 && (
                <div className="absolute left-[7px] top-4 w-px h-full bg-white/20" />
              )}
              <div
                className={cn(
                  'absolute left-0 top-2 w-3 h-3 rounded-full border-2 border-space-dark',
                  log.success ? 'bg-stardust-green' : 'bg-stardust-red'
                )}
              />
              <div className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium">{log.taskName}</span>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      log.success ? 'text-stardust-green' : 'text-stardust-red'
                    )}
                  >
                    {log.success ? `+${log.points}` : '-5'}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  {log.combination.map((color, i) => (
                    <div
                      key={i}
                      className={cn('w-3 h-3 rounded-full star-glow', COLOR_MAP[color])}
                    />
                  ))}
                </div>
                <span className="text-white/40 text-xs">{formatTime(log.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default memo(InspirationLog);
