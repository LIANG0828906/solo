import React from 'react';
import type { Player } from '../types';

interface HealthBarProps {
  players: Player[];
}

export const HealthBar: React.FC<HealthBarProps> = React.memo(({ players }) => {
  return (
    <div className="w-full px-4 py-3 glass-card mb-4">
      <div className="flex items-center justify-between gap-4">
        {players.map((player, index) => (
          <div key={player.id} className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold font-display">
                {player.name}
              </span>
              <span className="text-sm font-mono">
                {player.totalHealth} / {player.maxTotalHealth}
              </span>
            </div>
            <div className="health-bar-container">
              <div
                className="health-bar"
                style={{
                  width: `${Math.max(0, (player.totalHealth / player.maxTotalHealth) * 100)}%`,
                  background: index === 0 
                    ? 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%)'
                    : 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

HealthBar.displayName = 'HealthBar';
