import React from 'react';
import { useIncubationStore } from '../store/incubationStore';
import { Apple, Swords } from 'lucide-react';

const TrainingPanel: React.FC = () => {
  const evolutionStage = useIncubationStore((state) => state.evolutionStage);
  const level = useIncubationStore((state) => state.level);
  const levelProgress = useIncubationStore((state) => state.levelProgress);
  const feedingCount = useIncubationStore((state) => state.feedingCount);
  const trainingCount = useIncubationStore((state) => state.trainingCount);
  const isEvolving = useIncubationStore((state) => state.isEvolving);
  const feedCreature = useIncubationStore((state) => state.feedCreature);
  const trainCreature = useIncubationStore((state) => state.trainCreature);

  if (evolutionStage === 'egg') {
    return null;
  }

  const isDisabled = isEvolving;

  return (
    <div className="space-y-4">
      <h3
        className="text-lg font-bold tracking-wide"
        style={{
          fontFamily: "'Cinzel Decorative', serif",
          color: '#b0b0d0',
        }}
      >
        灵兽培养
      </h3>

      <div className="p-4 rounded-xl border border-[#2d2d44] bg-[#0d0d1a]/50">
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-sm"
            style={{ fontFamily: "'Lato', sans-serif", color: '#6b7280' }}
          >
            等级
          </span>
          <span
            className="text-xl font-bold"
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              color: '#ffd700',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            }}
          >
            Lv.{level}
          </span>
        </div>
        <div className="relative h-2 bg-[#2d2d44] rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${levelProgress}%`,
              background: 'linear-gradient(to right, #6c63ff, #8b83ff)',
              boxShadow: '0 0 10px rgba(108, 99, 255, 0.5)',
            }}
          />
        </div>
        <div
          className="text-xs mt-1 text-right"
          style={{ fontFamily: "'Lato', sans-serif", color: '#6b7280' }}
        >
          {Math.round(levelProgress)}% 经验进度
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={feedCreature}
          disabled={isDisabled}
          className={`
            p-4 rounded-xl border-2 border-[#22c55e]/30 bg-[#22c55e]/10
            hover:bg-[#22c55e]/20 hover:border-[#22c55e]/50 hover:-translate-y-0.5
            transition-all duration-200 active:scale-95
            flex flex-col items-center gap-2
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Apple className="w-8 h-8 text-green-400" />
          <div
            className="text-sm font-medium"
            style={{ fontFamily: "'Lato', sans-serif", color: '#86efac' }}
          >
            喂食灵果
          </div>
          <div
            className="text-xs"
            style={{ fontFamily: "'Lato', sans-serif", color: '#6b7280' }}
          >
            x{feedingCount}
          </div>
        </button>

        <button
          onClick={trainCreature}
          disabled={isDisabled}
          className={`
            p-4 rounded-xl border-2 border-[#ef4444]/30 bg-[#ef4444]/10
            hover:bg-[#ef4444]/20 hover:border-[#ef4444]/50 hover:-translate-y-0.5
            transition-all duration-200 active:scale-95
            flex flex-col items-center gap-2
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Swords className="w-8 h-8 text-red-400" />
          <div
            className="text-sm font-medium"
            style={{ fontFamily: "'Lato', sans-serif", color: '#fca5a5' }}
          >
            战斗训练
          </div>
          <div
            className="text-xs"
            style={{ fontFamily: "'Lato', sans-serif", color: '#6b7280' }}
          >
            x{trainingCount}
          </div>
        </button>
      </div>
    </div>
  );
};

export default TrainingPanel;
