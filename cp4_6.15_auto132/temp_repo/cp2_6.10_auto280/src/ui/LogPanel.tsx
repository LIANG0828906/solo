import { ScrollText, Plus, MousePointer2, Hand } from 'lucide-react';
import { useDreamStore } from '@/store/useDreamStore';
import type { LogType } from '@/types/dream';

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const getLogIcon = (type: LogType) => {
  switch (type) {
    case 'create':
      return <Plus className="w-4 h-4 text-cyan-400" />;
    case 'click':
      return <MousePointer2 className="w-4 h-4 text-pink-400" />;
    case 'drag':
      return <Hand className="w-4 h-4 text-purple-400" />;
  }
};

const getLogBgColor = (type: LogType): string => {
  switch (type) {
    case 'create':
      return 'bg-cyan-500/10 border-cyan-500/30';
    case 'click':
      return 'bg-pink-500/10 border-pink-500/30';
    case 'drag':
      return 'bg-purple-500/10 border-purple-500/30';
  }
};

export function LogPanel() {
  const { logs } = useDreamStore();

  return (
    <div className="fixed bottom-6 right-6 z-10 w-80">
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl"
           style={{
             boxShadow: '0 0 40px rgba(255, 107, 107, 0.15), 0 0 80px rgba(155, 89, 182, 0.1)',
           }}>
        <div className="flex items-center gap-2 mb-4">
          <ScrollText className="w-5 h-5 text-pink-400" />
          <h2 className="text-white font-semibold text-lg tracking-wide">梦境日志</h2>
          <span className="ml-auto text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">
            {logs.length}/5
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-white/30 text-sm">暂无梦境记录</div>
              <div className="text-white/20 text-xs mt-1">点击场景开始编织梦境</div>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-xl border ${getLogBgColor(log.type)} 
                          transition-all duration-300 hover:scale-[1.02] animate-fadeIn`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm leading-relaxed truncate">
                      {log.message}
                    </p>
                    <p className="text-white/40 text-xs mt-1 font-mono">
                      {formatTime(log.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
