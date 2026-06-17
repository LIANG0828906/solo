import { useGameStore } from '../store/gameStore';
import MiniRadar from './MiniRadar';
import { UnitType, GamePhase, TerrainType } from '../types';
import { Shield, Eye, Target, Skull, RotateCcw, Users } from 'lucide-react';

function getHpColor(hpPercent: number): string {
  if (hpPercent > 0.7) return '#6BCB77';
  if (hpPercent > 0.3) return '#FFD93D';
  return '#FF6B6B';
}

function getCoverageColor(coverage: number): string {
  const r = Math.round(255 - (255 - 107) * (coverage / 100));
  const g = Math.round(107 + (203 - 107) * (coverage / 100));
  const b = Math.round(107 + (119 - 107) * (coverage / 100));
  return `rgb(${r}, ${g}, ${b})`;
}

function UnitAvatar({
  unit,
  index,
  isSelected,
  onClick,
}: {
  unit: { id: string; type: UnitType; hp: number; maxHp: number };
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hpPercent = unit.hp / unit.maxHp;
  const isCommander = unit.type === UnitType.COMMANDER;
  const bgColor = isCommander ? '#00E5FF' : '#6BCB77';
  const initial = isCommander ? '指' : `侦${index}`;

  return (
    <button
      onClick={onClick}
      className="relative group transition-transform duration-300 hover:scale-110"
      style={{
        width: 56,
        height: 56,
        borderRadius: 8,
        padding: 0,
        border: isSelected ? '2px solid #00E5FF' : '2px solid #2A2A44',
        background: 'transparent',
        cursor: 'pointer',
        boxShadow: isSelected ? '0 0 16px rgba(0, 229, 255, 0.5)' : 'none',
      }}
    >
      <svg width="56" height="56" className="absolute inset-0">
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke="#2A2A44"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke={getHpColor(hpPercent)}
          strokeWidth="4"
          strokeDasharray={`${hpPercent * 150.8} 150.8`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dasharray 0.3s ease' }}
        />
      </svg>
      <div
        className="absolute inset-2 flex items-center justify-center rounded-md font-bold text-sm"
        style={{
          background: `linear-gradient(135deg, ${bgColor}33, ${bgColor}11)`,
          color: bgColor,
          border: `1px solid ${bgColor}44`,
        }}
      >
        {initial}
      </div>
      <div
        className="absolute -top-1 -left-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
        style={{
          background: '#151528',
          color: '#00E5FF',
          border: '1px solid #2A2A44',
          fontSize: 10,
        }}
      >
        {index + 1}
      </div>
    </button>
  );
}

function CoverageRing({ coverage }: { coverage: number }) {
  const radius = 27;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative" style={{ width: 60, height: 60 }}>
      <svg width="60" height="60">
        <defs>
          <linearGradient id="coverageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="50%" stopColor="#FFD93D" />
            <stop offset="100%" stopColor="#6BCB77" />
          </linearGradient>
        </defs>
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke="#2A2A44"
          strokeWidth="6"
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke="url(#coverageGradient)"
          strokeWidth="6"
          strokeDasharray={`${(coverage / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
          style={{ transition: 'stroke-dasharray 0.3s ease' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-bold"
        style={{ color: getCoverageColor(coverage), fontSize: 18 }}
      >
        {coverage}%
      </div>
    </div>
  );
}

function GameEndOverlay({ phase, onReset }: { phase: GamePhase; onReset: () => void }) {
  if (phase === GamePhase.PLAYING) return null;

  const isWin = phase === GamePhase.WIN;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="flex flex-col items-center gap-6 p-8 rounded-2xl"
        style={{
          background: '#151528',
          border: '1px solid #2A2A44',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          className="text-4xl font-bold"
          style={{ color: isWin ? '#6BCB77' : '#FF6B6B' }}
        >
          {isWin ? (
            <div className="flex items-center gap-3">
              <Shield size={40} />
              任务成功
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Skull size={40} />
              任务失败
            </div>
          )}
        </div>
        <p className="text-gray-400 text-lg">
          {isWin ? '所有队员已成功撤离！' : '有队员被敌人发现...'}
        </p>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-base transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #00E5FF, #0099CC)',
            boxShadow: '0 4px 20px rgba(0, 229, 255, 0.3)',
          }}
        >
          <RotateCcw size={20} />
          重新开始
        </button>
      </div>
    </div>
  );
}

export default function UIPanel() {
  const units = useGameStore((s) => s.units);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const selectUnit = useGameStore((s) => s.selectUnit);
  const triggerRetreat = useGameStore((s) => s.triggerRetreat);
  const resetGame = useGameStore((s) => s.resetGame);
  const coverage = useGameStore((s) => s.fogState.coverage);
  const inputDelay = useGameStore((s) => s.inputDelay);
  const enemies = useGameStore((s) => s.enemies);
  const extractionProgress = useGameStore((s) => s.extractionProgress);
  const phase = useGameStore((s) => s.phase);
  const fps = useGameStore((s) => s.fps);

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  return (
    <>
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6 px-6 py-3 rounded-full"
        style={{
          background: 'rgba(21, 21, 40, 0.9)',
          border: '1px solid #2A2A44',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="flex items-center gap-2">
          <Eye size={18} style={{ color: getCoverageColor(coverage) }} />
          <span
            className="font-bold text-lg tabular-nums"
            style={{ color: getCoverageColor(coverage) }}
          >
            视野 {coverage}%
          </span>
        </div>
        <div style={{ width: 1, height: 24, background: '#2A2A44' }} />
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Target size={16} />
          延迟 {Math.round(inputDelay)}ms
        </div>
        <div style={{ width: 1, height: 24, background: '#2A2A44' }} />
        <div className="text-gray-400 text-sm tabular-nums">
          FPS: {fps}
        </div>
      </div>

      <div className="fixed top-20 left-4 z-30">
        <MiniRadar />
      </div>

      <div
        className="fixed top-4 right-4 z-40 flex flex-col items-end gap-4"
      >
        <div
          className="flex items-center gap-4 px-5 py-3 rounded-xl"
          style={{
            background: 'rgba(21, 21, 40, 0.9)',
            border: '1px solid #2A2A44',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
          }}
        >
          <CoverageRing coverage={coverage} />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Users size={18} style={{ color: '#FF6B6B' }} />
              <span className="text-white font-medium">剩余敌人: {enemies.length}</span>
            </div>
            {extractionProgress > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs">撤退进度</span>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ width: 120, background: '#2A2A44' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${extractionProgress}%`,
                      background: 'linear-gradient(90deg, #FF6B6B, #6BCB77)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedUnit && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(21, 21, 40, 0.9)',
              border: '1px solid #2A2A44',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div className="text-gray-400 mb-1">当前控制</div>
            <div
              className="font-bold text-base"
              style={{ color: selectedUnit.type === UnitType.COMMANDER ? '#00E5FF' : '#6BCB77' }}
            >
              {selectedUnit.type === UnitType.COMMANDER ? '指挥官' : '侦察兵'}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              视野: {selectedUnit.visionRadius}px · 生命: {selectedUnit.hp}/{selectedUnit.maxHp}
            </div>
          </div>
        )}
      </div>

      <div
        className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4 p-5 rounded-2xl"
        style={{
          width: 280,
          background: 'rgba(21, 21, 40, 0.92)',
          border: '1px solid #2A2A44',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="text-white font-bold text-lg">小队控制</div>

        <div className="grid grid-cols-2 gap-3 justify-items-center">
          {units.map((unit, idx) => (
            <UnitAvatar
              key={unit.id}
              unit={unit}
              index={idx}
              isSelected={unit.id === selectedUnitId}
              onClick={() => selectUnit(unit.id)}
            />
          ))}
        </div>

        <div style={{ height: 1, background: '#2A2A44', margin: '4px 0' }} />

        <div className="text-gray-400 text-sm">
          <div className="mb-2 text-gray-300 font-medium">地形图例</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: '#2D5A3D' }} />
              树木
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: '#8B5E3C' }} />
              高地
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: '#4A4A5A' }} />
              废墟
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: '#1E2A3E' }} />
              开阔地
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: '#2A2A44', margin: '4px 0' }} />

        <div className="text-gray-500 text-xs space-y-1">
          <div>WASD / 方向键: 移动</div>
          <div>数字键 1-4: 切换角色</div>
          <div>点击地面: 自动移动</div>
        </div>

        <button
          onClick={triggerRetreat}
          className="w-full mx-auto py-3 rounded-full text-white font-bold text-base transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            width: 220,
            height: 48,
            background: 'linear-gradient(135deg, #FF6B6B, #FF4757)',
            boxShadow: '0 4px 20px rgba(255, 107, 107, 0.3)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          全员撤退
        </button>
      </div>

      <GameEndOverlay phase={phase} onReset={resetGame} />

      <style>{`
        @media (max-width: 768px) {
          .left-panel {
            width: 200px !important;
          }
          .left-panel button {
            height: 56px !important;
          }
        }
      `}</style>
    </>
  );
}
