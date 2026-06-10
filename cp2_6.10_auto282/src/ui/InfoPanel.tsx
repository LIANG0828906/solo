import { useMemo } from 'react';
import { Layers, Clock, Gem } from 'lucide-react';
import { COLORS } from '@/utils/colors';
import { useGameStore } from '@/store/useGameStore';

export const InfoPanel = () => {
  const { level, crystalsCollected, totalCrystals, time, isStunned, stunTimer } = useGameStore();

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }, [time]);

  const progress = totalCrystals > 0 ? (crystalsCollected / totalCrystals) * 100 : 0;

  return (
    <div className="absolute top-4 left-4 z-10 w-64 max-w-[calc(100vw-2rem)] md:w-72">
      <div
        className="relative p-5 rounded-lg overflow-hidden"
        style={{
          background: COLORS.darkPanel,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${COLORS.neonPurple}40`,
          boxShadow: `0 0 30px ${COLORS.neonPurple}20, inset 0 0 30px ${COLORS.neonPurple}10`,
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-0.5"
          style={{
            background: `linear-gradient(90deg, ${COLORS.neonPurple}, ${COLORS.neonCyan})`,
          }}
        />

        <h2
          className="text-xl font-bold mb-4 text-center"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: COLORS.neonCyan,
            textShadow: `0 0 10px ${COLORS.neonCyan}80`,
            letterSpacing: '0.1em',
          }}
        >
          光影迷宫
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-md"
              style={{ background: `${COLORS.neonPurple}30` }}
            >
              <Layers size={20} style={{ color: COLORS.neonPurple }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider">当前层数</p>
              <p
                className="text-2xl font-bold"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  color: COLORS.neonPurple,
                  textShadow: `0 0 8px ${COLORS.neonPurple}`,
                }}
              >
                LEVEL {level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-md"
              style={{ background: `${COLORS.crystal}30` }}
            >
              <Gem size={20} style={{ color: COLORS.crystal }} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider">收集进度</p>
                <span
                  className="text-sm font-bold"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: COLORS.crystal,
                  }}
                >
                  {crystalsCollected} / {totalCrystals}
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${COLORS.neonCyan}, ${COLORS.crystal})`,
                    boxShadow: `0 0 10px ${COLORS.crystal}80`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-md"
              style={{ background: `${COLORS.neonPink}30` }}
            >
              <Clock size={20} style={{ color: COLORS.neonPink }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider">游戏时间</p>
              <p
                className="text-xl font-bold animate-pulse"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: COLORS.neonPink,
                  textShadow: `0 0 8px ${COLORS.neonPink}80`,
                }}
              >
                {formattedTime}
              </p>
            </div>
          </div>

          {isStunned && (
            <div
              className="mt-3 p-3 rounded-md text-center animate-pulse"
              style={{
                background: `${COLORS.beamFlashing}20`,
                border: `1px solid ${COLORS.beamFlashing}`,
              }}
            >
              <p
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: COLORS.beamFlashing }}
              >
                ⚠ 系统干扰中 {stunTimer.toFixed(1)}s
              </p>
            </div>
          )}
        </div>

        <div
          className="absolute bottom-0 left-0 w-full h-0.5"
          style={{
            background: `linear-gradient(90deg, ${COLORS.neonCyan}, ${COLORS.neonPurple})`,
          }}
        />
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          WASD 移动 | 空格 跳跃 | 鼠标拖拽旋转视角
        </p>
      </div>
    </div>
  );
};
