import { useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, Trophy, Clock, Zap } from 'lucide-react';
import { useGameState } from '../hooks/useGameState';
import { useControls } from '../hooks/useControls';
import { TOTAL_LEVELS, LEVEL_CONFIGS } from '../utils/constants';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function UI() {
  const {
    level,
    shardsCollected,
    shardsRequired,
    isPaused,
    isGameComplete,
    elapsedTime,
    togglePause,
    resetGame,
    totalShardsCollected,
    totalShardsAvailable,
    screenFlash,
    levelTransition,
    portalActive,
  } = useGameState();

  const { dashCooldown, canDash } = useControls();

  const config = LEVEL_CONFIGS[level];

  const collectRate = useMemo(() => {
    if (totalShardsAvailable === 0) return 0;
    return Math.round((totalShardsCollected / totalShardsAvailable) * 100);
  }, [totalShardsCollected, totalShardsAvailable]);

  useEffect(() => {
    const updateElapsed = () => {
      useGameState.getState().updateElapsedTime();
    };
    const interval = setInterval(updateElapsed, 100);
    return () => clearInterval(interval);
  }, []);

  const dashProgress = Math.max(0, Math.min(1, 1 - dashCooldown / 2));

  return (
    <>
      {screenFlash.active && (
        <div
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: `radial-gradient(ellipse at center, transparent 0%, ${screenFlash.color} 100%)`,
            opacity: screenFlash.intensity * 0.4,
            transition: 'opacity 0.1s ease-out',
          }}
        />
      )}

      {levelTransition.active && (
        <div
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
          }}
        >
          <div className="text-center">
            <div
              className="text-6xl font-bold mb-4"
              style={{
                color: LEVEL_CONFIGS[Math.min(level + 1, TOTAL_LEVELS - 1)].colors.primary,
                textShadow: `0 0 20px ${LEVEL_CONFIGS[Math.min(level + 1, TOTAL_LEVELS - 1)].colors.primary}`,
                animation: 'pulse 0.5s ease-in-out infinite',
              }}
            >
              第 {level + 2} 层
            </div>
            <div className="text-2xl text-cyan-400">
              传送中...
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-6 left-6 z-40 space-y-4">
        <div
          className="px-6 py-4 rounded-2xl backdrop-blur-md"
          style={{
            background: 'rgba(10, 10, 15, 0.8)',
            border: `1px solid ${config.colors.primary}`,
            boxShadow: `0 0 20px ${config.colors.primary}40, inset 0 0 30px rgba(0, 229, 255, 0.05)`,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-sm font-medium"
              style={{ color: config.colors.accent }}
            >
              当前层数
            </span>
            <span
              className="text-4xl font-bold"
              style={{
                color: config.colors.primary,
                textShadow: `0 0 10px ${config.colors.primary}`,
              }}
            >
              {level + 1}
            </span>
            <span className="text-gray-500 text-lg">/ {TOTAL_LEVELS}</span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5" style={{ color: config.colors.shard }} />
            <span className="text-sm font-medium text-gray-400">能量碎片</span>
            <span
              className="text-2xl font-bold"
              style={{
                color: config.colors.shard,
                textShadow: `0 0 10px ${config.colors.shard}`,
              }}
            >
              {shardsCollected}
            </span>
            <span className="text-gray-500">/ {shardsRequired}</span>
          </div>

          <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(shardsCollected / shardsRequired) * 100}%`,
                background: `linear-gradient(90deg, ${config.colors.primary}, ${config.colors.accent})`,
                boxShadow: `0 0 10px ${config.colors.accent}`,
              }}
            />
          </div>

          {portalActive && (
            <div
              className="mt-3 text-center py-2 rounded-lg animate-pulse"
              style={{
                background: `${config.colors.accent}20`,
                border: `1px solid ${config.colors.accent}`,
                color: config.colors.accent,
              }}
            >
              ✨ 传送门已开启！前往出口 ✨
            </div>
          )}
        </div>

        <div
          className="px-6 py-3 rounded-2xl backdrop-blur-md flex items-center gap-3"
          style={{
            background: 'rgba(10, 10, 15, 0.8)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
          }}
        >
          <Clock className="w-5 h-5 text-cyan-400" />
          <span className="text-gray-400 text-sm">用时</span>
          <span className="text-2xl font-mono text-cyan-400" style={{ textShadow: '0 0 10px #00e5ff' }}>
            {formatTime(elapsedTime)}
          </span>
        </div>

        <div
          className="px-6 py-3 rounded-2xl backdrop-blur-md"
          style={{
            background: 'rgba(10, 10, 15, 0.8)',
            border: canDash ? '1px solid rgba(155, 89, 182, 0.5)' : '1px solid rgba(100, 100, 100, 0.3)',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm" style={{ color: canDash ? '#9b59b6' : '#666' }}>
              冲刺 [空格]
            </span>
            <span className="text-xs text-gray-500">
              {canDash ? '就绪' : `${dashCooldown.toFixed(1)}s`}
            </span>
          </div>
          <div className="w-32 h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${dashProgress * 100}%`,
                background: canDash
                  ? 'linear-gradient(90deg, #9b59b6, #00e5ff)'
                  : '#333',
                boxShadow: canDash ? '0 0 8px #9b59b6' : 'none',
              }}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-40 flex gap-3">
        <button
          onClick={togglePause}
          className="p-4 rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-110"
          style={{
            background: 'rgba(10, 10, 15, 0.8)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)',
          }}
        >
          {isPaused ? (
            <Play className="w-6 h-6 text-cyan-400" fill="currentColor" />
          ) : (
            <Pause className="w-6 h-6 text-cyan-400" fill="currentColor" />
          )}
        </button>

        <button
          onClick={resetGame}
          className="p-4 rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-110"
          style={{
            background: 'rgba(10, 10, 15, 0.8)',
            border: '1px solid rgba(155, 89, 182, 0.3)',
            boxShadow: '0 0 15px rgba(155, 89, 182, 0.2)',
          }}
        >
          <RotateCcw className="w-6 h-6" style={{ color: '#9b59b6' }} />
        </button>
      </div>

      <div className="fixed bottom-6 left-6 z-40">
        <div
          className="px-4 py-2 rounded-xl backdrop-blur-md text-sm text-gray-500"
          style={{
            background: 'rgba(10, 10, 15, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          拖拽鼠标移动 · 空格冲刺
        </div>
      </div>

      {isPaused && !isGameComplete && (
        <div className="fixed inset-0 z-45 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="text-center p-12 rounded-3xl"
            style={{
              background: 'rgba(10, 10, 15, 0.95)',
              border: '2px solid #00e5ff',
              boxShadow: '0 0 60px rgba(0, 229, 255, 0.3)',
            }}
          >
            <div
              className="text-5xl font-bold mb-6"
              style={{
                color: '#00e5ff',
                textShadow: '0 0 20px #00e5ff',
              }}
            >
              游戏暂停
            </div>
            <button
              onClick={togglePause}
              className="px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #9b59b6, #00e5ff)',
                color: 'white',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
              }}
            >
              继续游戏
            </button>
          </div>
        </div>
      )}

      {isGameComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div
            className="text-center p-12 rounded-3xl max-w-md"
            style={{
              background: 'rgba(10, 10, 15, 0.95)',
              border: '2px solid #9b59b6',
              boxShadow: '0 0 80px rgba(155, 89, 182, 0.4)',
              animation: 'fadeInUp 0.8s ease-out',
            }}
          >
            <Trophy
              className="w-20 h-20 mx-auto mb-6"
              style={{
                color: '#f1c40f',
                filter: 'drop-shadow(0 0 20px #f1c40f)',
              }}
            />

            <h2
              className="text-5xl font-bold mb-2"
              style={{
                background: 'linear-gradient(135deg, #9b59b6, #00e5ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              恭喜通关！
            </h2>

            <p className="text-gray-400 mb-8">你成功穿越了幻境迷宫</p>

            <div className="space-y-4 mb-8">
              <div
                className="flex justify-between items-center p-4 rounded-xl"
                style={{ background: 'rgba(0, 229, 255, 0.1)' }}
              >
                <span className="text-gray-400">总用时</span>
                <span
                  className="text-3xl font-mono font-bold"
                  style={{ color: '#00e5ff', textShadow: '0 0 10px #00e5ff' }}
                >
                  {formatTime(elapsedTime)}
                </span>
              </div>

              <div
                className="flex justify-between items-center p-4 rounded-xl"
                style={{ background: 'rgba(155, 89, 182, 0.1)' }}
              >
                <span className="text-gray-400">碎片收集率</span>
                <span
                  className="text-3xl font-bold"
                  style={{ color: '#9b59b6', textShadow: '0 0 10px #9b59b6' }}
                >
                  {collectRate}%
                </span>
              </div>

              <div
                className="flex justify-between items-center p-4 rounded-xl"
                style={{ background: 'rgba(241, 196, 15, 0.1)' }}
              >
                <span className="text-gray-400">收集碎片</span>
                <span
                  className="text-3xl font-bold"
                  style={{ color: '#f1c40f', textShadow: '0 0 10px #f1c40f' }}
                >
                  {totalShardsCollected} / {totalShardsAvailable}
                </span>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-4 rounded-xl text-xl font-bold transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #9b59b6, #00e5ff)',
                color: 'white',
                boxShadow: '0 0 30px rgba(0, 229, 255, 0.5)',
              }}
            >
              再玩一次
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
}
