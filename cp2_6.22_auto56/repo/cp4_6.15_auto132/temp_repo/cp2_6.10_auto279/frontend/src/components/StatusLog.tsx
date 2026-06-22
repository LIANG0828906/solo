import { useGameStore } from '@/store/useGameStore';
import type { LogType } from '@/types';

const logColors: Record<LogType, string> = {
  success: 'text-green-400 border-green-500/30 bg-green-500/10',
  failure: 'text-red-400 border-red-500/30 bg-red-500/10',
  event: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  info: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
};

const logIcons: Record<LogType, string> = {
  success: '✅',
  failure: '❌',
  event: '⚠️',
  info: 'ℹ️',
};

export const StatusLog = () => {
  const { logs, score, level, experience } = useGameStore();
  const expThreshold = level * 100;
  const expProgress = (experience / expThreshold) * 100;

  return (
    <div className="h-full flex flex-col bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-700/50">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2 mb-3">
          <span>📊</span>
          状态信息
        </h2>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{score}</div>
            <div className="text-xs text-gray-400">总分数</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">Lv.{level}</div>
            <div className="text-xs text-gray-400">等级</div>
          </div>
        </div>
        
        <div className="bg-gray-800/60 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">经验值</span>
            <span className="text-purple-400">{experience} / {expThreshold}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${expProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
          <span>📝</span>
          操作日志
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {logs.slice(0, 5).map((log, index) => (
            <div
              key={log.id}
              className={`p-2 rounded-lg border text-sm transition-all duration-300 ${
                logColors[log.type]
              } ${index === 0 ? 'animate-pulse' : ''}`}
              style={{
                animation: index === 0 ? 'slideIn 0.3s ease-out' : 'none',
              }}
            >
              <div className="flex items-start gap-2">
                <span>{logIcons[log.type]}</span>
                <span className="flex-1">{log.message}</span>
              </div>
            </div>
          ))}
          
          {logs.length === 0 && (
            <div className="text-center text-gray-500 py-4 text-sm">
              暂无操作记录
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
