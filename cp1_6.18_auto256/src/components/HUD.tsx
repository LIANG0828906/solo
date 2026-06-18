import { useGameStore } from '../gameStore';
import './HUD.css';

export function HUD() {
  const { floor, player } = useGameStore();
  const itemCount = player.inventory.length;

  return (
    <div className="hud-container">
      <div className="hud-item floor">
        <span className="hud-label">层数</span>
        <span className="hud-value">{floor}</span>
      </div>
      <div className="hud-item items">
        <span className="hud-label">物品</span>
        <span className="hud-value">{itemCount}</span>
      </div>
      <div className="hud-item player-info">
        <div className="mini-hp">
          <span className="mini-label">❤️</span>
          <div className="mini-bar-bg">
            <div
              className="mini-bar-fill mini-hp-fill"
              style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
            />
          </div>
          <span className="mini-text">{player.hp}</span>
        </div>
        <div className="mini-energy">
          <span className="mini-label">⚡</span>
          <div className="mini-bar-bg">
            <div
              className="mini-bar-fill mini-energy-fill"
              style={{ width: `${(player.energy / player.maxEnergy) * 100}%` }}
            />
          </div>
          <span className="mini-text">{player.energy}</span>
        </div>
        {player.attackBuffTurns > 0 && (
          <div className="buff-indicator">⚔️+5 ({player.attackBuffTurns})</div>
        )}
      </div>
    </div>
  );
}
