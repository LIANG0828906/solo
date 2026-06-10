import { useGameStore } from '@/store/useGameStore';
import { AlertTriangle, Flame, Skull, Music, X } from 'lucide-react';
import { playClickSound } from '@/utils/sound';

const eventConfig = {
  overheat: {
    icon: Flame,
    color: 'text-red-500',
    bgColor: 'from-red-900/90 to-orange-900/90',
    borderColor: 'border-red-500',
  },
  contamination: {
    icon: Skull,
    color: 'text-purple-500',
    bgColor: 'from-purple-900/90 to-gray-900/90',
    borderColor: 'border-purple-500',
  },
  muse_silence: {
    icon: Music,
    color: 'text-blue-500',
    bgColor: 'from-blue-900/90 to-indigo-900/90',
    borderColor: 'border-blue-500',
  },
};

export const EventModal = () => {
  const { currentEvent, dismissEvent, handleContamination } = useGameStore();

  if (!currentEvent) return null;

  const config = eventConfig[currentEvent.type];
  const IconComponent = config.icon;

  const handleAction = (action: string) => {
    playClickSound();
    if (currentEvent.type === 'contamination' && action === 'refresh') {
      handleContamination(true);
    } else if (currentEvent.type === 'contamination' && action === 'ignore') {
      handleContamination(false);
    } else {
      dismissEvent();
    }
  };

  const remainingTime = Math.max(
    0,
    Math.ceil((currentEvent.startTime + currentEvent.duration - Date.now()) / 1000)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`relative max-w-md w-full bg-gradient-to-br ${config.bgColor} border-2 ${config.borderColor} rounded-2xl p-6 shadow-2xl transform animate-bounce-in`}
      >
        <button
          onClick={() => handleAction('dismiss')}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-full bg-black/30 flex items-center justify-center mb-4 ${config.color}`}>
            <IconComponent size={48} className="animate-pulse" />
          </div>

          <AlertTriangle size={24} className="text-yellow-400 mb-2 animate-pulse" />
          
          <h2 className={`text-2xl font-bold mb-2 ${config.color}`}>
            {currentEvent.title}
          </h2>
          
          <p className="text-gray-300 mb-4">
            {currentEvent.description}
          </p>

          {remainingTime > 0 && (
            <div className="mb-4 text-sm text-gray-400">
              剩余时间: <span className="text-white font-mono">{remainingTime}秒</span>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            {currentEvent.type === 'contamination' ? (
              <>
                <button
                  onClick={() => handleAction('refresh')}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  ✨ 刷新清理
                </button>
                <button
                  onClick={() => handleAction('ignore')}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  忽略
                </button>
              </>
            ) : currentEvent.type === 'overheat' ? (
              <div className="px-6 py-3 bg-red-900/50 border border-red-500 text-red-300 rounded-xl font-bold">
                🔥 请等待冷却...
              </div>
            ) : (
              <button
                onClick={() => handleAction('dismiss')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                知道了
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};
