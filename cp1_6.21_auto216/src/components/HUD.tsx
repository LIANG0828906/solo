import type { HUDData } from '../core/types';

interface HUDProps {
  data: HUDData;
}

export default function HUD({ data }: HUDProps) {
  const { health, maxHealth, combo, score, comboFlash, specialCooldown, specialMaxCooldown, specialReady } = data;

  const hearts = [];
  for (let i = 0; i < maxHealth; i++) {
    const isAlive = i < health;
    hearts.push(
      <div
        key={i}
        className={`heart ${isAlive ? 'heart-alive' : 'heart-lost'}`}
      />
    );
  }

  const specialPercent = specialMaxCooldown > 0
    ? ((specialMaxCooldown - specialCooldown) / specialMaxCooldown) * 100
    : 100;

  return (
    <div className="hud-overlay">
      <div className="hud-hearts">
        {hearts}
      </div>
      <div className={`hud-combo ${comboFlash ? 'hud-combo-flash' : ''}`}>
        {combo > 0 ? `${combo} COMBO` : ''}
      </div>
      <div className="hud-score">
        {score.toString().padStart(8, '0')}
      </div>
      <div className="hud-special">
        <span className="hud-special-label">SPECIAL</span>
        <div className="hud-special-bar">
          <div
            className={`hud-special-fill ${specialReady ? 'hud-special-fill-ready' : ''}`}
            style={{ width: `${specialPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
