import { BookOpen, Music, Move, MousePointer, Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { LogEntry } from '@/types';
import { NOTE_NAMES } from '@/types';

const getLogIcon = (type: LogEntry['type']) => {
  switch (type) {
    case 'create':
      return <Music className="w-4 h-4 text-coral-pink" />;
    case 'move':
      return <Move className="w-4 h-4 text-aqua-glow" />;
    case 'click':
      return <MousePointer className="w-4 h-4 text-coral-pink" />;
    case 'frequency':
      return <Settings className="w-4 h-4 text-wave-white" />;
    default:
      return <BookOpen className="w-4 h-4 text-wave-white" />;
  }
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const TideLog = () => {
  const { logs } = useStore();

  return (
    <div className="absolute bottom-6 right-6 z-10 w-80">
      <div className="backdrop-blur-xl bg-deep-ocean/60 border border-wave-white/20 rounded-2xl p-5 shadow-2xl shadow-deep-ocean/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aqua-glow to-ocean-light flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg text-wave-white tracking-wide">
              潮汐日志
            </h2>
            <p className="text-xs text-wave-white/50">
              最近 {logs.length} 次操作
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ocean-light/30 flex items-center justify-center">
                <Music className="w-6 h-6 text-wave-white/30" />
              </div>
              <p className="text-sm text-wave-white/40 font-body">
                点击海面放置第一个浮标
              </p>
              <p className="text-xs text-wave-white/30 mt-1">
                开始编织你的潮汐音乐网络
              </p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={log.id}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300
                  ${index === 0 ? 'bg-wave-white/5 border border-wave-white/10' : 'bg-transparent hover:bg-wave-white/5'}
                  animate-fade-in`}
                style={{
                  animationDelay: `${index * 50}ms`,
                  opacity: 1 - index * 0.15,
                }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-ocean-light/50 flex items-center justify-center mt-0.5">
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-wave-white font-body leading-relaxed">
                    {log.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-wave-white/40">
                      {formatTime(log.timestamp)}
                    </span>
                    {log.pitchChange !== undefined && log.pitchChange !== 0 && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full
                        ${log.pitchChange > 0 ? 'bg-aqua-glow/20 text-aqua-glow' : 'bg-coral-pink/20 text-coral-pink'}`}
                      >
                        {log.pitchChange > 0 ? '+' : ''}{NOTE_NAMES[((log.pitchChange % 12) + 12) % 12]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-wave-white/10">
          <div className="flex items-center justify-between text-xs text-wave-white/40">
            <span className="font-body">音高变化</span>
            <div className="flex gap-1">
              {NOTE_NAMES.map((note, i) => (
                <span
                  key={note}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono
                    ${i % 12 === 0 ? 'bg-coral-pink/30 text-coral-pink' : 
                      i % 12 === 5 ? 'bg-aqua-glow/30 text-aqua-glow' : 
                      'bg-ocean-light/30 text-wave-white/50'}`}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
