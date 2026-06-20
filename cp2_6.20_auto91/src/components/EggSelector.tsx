import React from 'react';
import { useIncubationStore } from '../store/incubationStore';
import { EGG_CONFIGS, RARITY_COLORS, RARITY_LABELS } from '../utils/constants';
import type { CreatureType } from '../types';
import { Flame, Snowflake, Zap, Mountain } from 'lucide-react';

const EggSelector: React.FC = () => {
  const selectedEgg = useIncubationStore((state) => state.selectedEgg);
  const selectEgg = useIncubationStore((state) => state.selectEgg);
  const isIncubating = useIncubationStore((state) => state.isIncubating);
  const evolutionStage = useIncubationStore((state) => state.evolutionStage);

  const getElementIcon = (element: string) => {
    const iconClass = "w-6 h-6";
    switch (element) {
      case 'fire':
        return <Flame className={iconClass} style={{ color: '#ff4500' }} />;
      case 'ice':
        return <Snowflake className={iconClass} style={{ color: '#1e90ff' }} />;
      case 'thunder':
        return <Zap className={iconClass} style={{ color: '#9932cc' }} />;
      case 'earth':
        return <Mountain className={iconClass} style={{ color: '#228b22' }} />;
      default:
        return null;
    }
  };

  const isDisabled = isIncubating || evolutionStage !== 'egg';

  return (
    <div className="space-y-4">
      <h3
        className="text-lg font-bold tracking-wide"
        style={{
          fontFamily: "'Cinzel Decorative', serif",
          color: '#b0b0d0',
        }}
      >
        选择灵兽蛋
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {Object.values(EGG_CONFIGS).map((egg) => (
          <button
            key={egg.id}
            onClick={() => !isDisabled && selectEgg(egg.id as CreatureType)}
            disabled={isDisabled}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-300
              ${selectedEgg === egg.id
                ? 'border-purple-500 bg-purple-500/20 scale-105 shadow-lg shadow-purple-500/30'
                : 'border-[#2d2d44] bg-[#1a1a2e]/50 hover:bg-[#2d2d44]/50 hover:scale-102'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              backdrop-blur-md overflow-hidden group
            `}
            style={{
              minHeight: '120px',
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at center, ${egg.glowColor} 0%, transparent 70%)`,
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-2">
              <div
                className="w-14 h-16 rounded-full relative flex items-center justify-center"
                style={{
                  background: `radial-gradient(ellipse at 30% 30%, ${egg.glowColor}, ${egg.color})`,
                  boxShadow: `0 0 20px ${egg.glowColor}60`,
                }}
              >
                <div
                  className="absolute inset-1 rounded-full opacity-50"
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)`,
                  }}
                />
                {getElementIcon(egg.element)}
              </div>

              <div
                className="text-sm font-bold"
                style={{
                  fontFamily: "'Cinzel Decorative', serif",
                  color: '#e0e0f0',
                }}
              >
                {egg.name}
              </div>

              <div
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${RARITY_COLORS[egg.rarity]}20`,
                  color: RARITY_COLORS[egg.rarity],
                  fontFamily: "'Lato', sans-serif",
                  border: `1px solid ${RARITY_COLORS[egg.rarity]}40`,
                }}
              >
                {RARITY_LABELS[egg.rarity]}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EggSelector;
