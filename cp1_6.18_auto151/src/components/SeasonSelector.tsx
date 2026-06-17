import React from 'react';
import { Season, useMenuStore } from '@/stores/menuStore';

const SEASONS: { key: Season; label: string; color: string }[] = [
  { key: 'spring', label: '春', color: '#B8D4A5' },
  { key: 'summer', label: '夏', color: '#FFB07C' },
  { key: 'autumn', label: '秋', color: '#D4A574' },
  { key: 'winter', label: '冬', color: '#A8C0D8' },
];

const SeasonSelector: React.FC = () => {
  const currentSeason = useMenuStore(s => s.currentSeason);
  const setCurrentSeason = useMenuStore(s => s.setCurrentSeason);

  return (
    <div className="flex items-center justify-center gap-3 py-3">
      {SEASONS.map(season => {
        const isSelected = currentSeason === season.key;
        return (
          <button
            key={season.key}
            onClick={() => setCurrentSeason(season.key)}
            className={`
              rounded-xl px-4 py-2 font-display text-lg cursor-pointer
              transition-all duration-200
              ${
                isSelected
                  ? 'text-white font-semibold shadow-sm'
                  : 'text-coffee-dark border border-solid'
              }
            `}
            style={
              isSelected
                ? { backgroundColor: season.color }
                : { borderColor: '#D4A574', backgroundColor: 'transparent' }
            }
          >
            {season.label}
          </button>
        );
      })}
    </div>
  );
};

export default SeasonSelector;
