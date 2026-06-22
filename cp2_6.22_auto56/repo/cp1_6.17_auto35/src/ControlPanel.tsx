import React from 'react';
import { useTownStore } from './store';
import { Season } from './types';

const SEASON_LABELS: Record<Season, string> = {
  [Season.SPRING]: '春',
  [Season.SUMMER]: '夏',
  [Season.AUTUMN]: '秋',
  [Season.WINTER]: '冬',
};

export const ControlPanel: React.FC = () => {
  const season = useTownStore((s) => s.season);
  const particleCount = useTownStore((s) => s.particleCount);
  const setSeason = useTownStore((s) => s.setSeason);
  const setParticleCount = useTownStore((s) => s.setParticleCount);

  const seasons = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER];

  return (
    <div className="control-panel">
      <div className="season-buttons">
        {seasons.map((s) => (
          <button
            key={s}
            className={`season-btn ${s} ${season === s ? 'active' : ''}`}
            onClick={() => setSeason(s)}
          >
            {SEASON_LABELS[s]}
          </button>
        ))}
      </div>
      <div className="particle-control">
        <label className="particle-label">粒子密度: {particleCount}</label>
        <input
          type="range"
          min="0"
          max="50"
          value={particleCount}
          onChange={(e) => setParticleCount(parseInt(e.target.value, 10))}
          className="particle-slider"
        />
      </div>
    </div>
  );
};
