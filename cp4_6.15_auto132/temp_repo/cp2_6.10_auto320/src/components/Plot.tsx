import React from 'react';
import { Flower } from './Flower';
import type { GardenFlower } from '@/types';

interface PlotProps {
  flower: GardenFlower | null;
  index: number;
}

export const Plot: React.FC<PlotProps> = ({ flower, index }) => {
  return (
    <div
      className={`relative rounded-2xl transition-all duration-500 ${
        flower ? 'bg-gradient-to-b from-amber-800/30 to-amber-900/40' : 'bg-gradient-to-b from-amber-700/20 to-amber-800/30'
      }`}
      style={{
        aspectRatio: '1',
        boxShadow: flower
          ? 'inset 0 4px 8px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15)'
          : 'inset 0 4px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div
        className="absolute inset-3 rounded-xl opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(139, 69, 19, 0.3) 0%, transparent 40%),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(139, 69, 19, 0.1) 2px,
              rgba(139, 69, 19, 0.1) 4px
            )
          `,
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        {flower ? (
          <Flower flower={flower} />
        ) : (
          <div className="text-center">
            <div className="text-4xl opacity-20 mb-1">🌱</div>
            <p className="text-xs text-amber-900/40 font-medium">空地 {index + 1}</p>
          </div>
        )}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-6 rounded-b-2xl"
        style={{
          background: 'linear-gradient(to top, rgba(120, 53, 15, 0.4), transparent)',
        }}
      />
    </div>
  );
};
