import { useEffect, useState } from 'react';
import type { BattleResult, BattleDragon } from '../../shared/types';
import './BattleResultModal.css';

interface BattleResultModalProps {
  isOpen: boolean;
  result: BattleResult | null;
  playerTeam: BattleDragon[];
  enemyTeam: BattleDragon[];
  onClose: () => void;
  onRestart: () => void;
}

export default function BattleResultModal({
  isOpen,
  result,
  playerTeam,
  enemyTeam,
  onClose,
  onRestart,
}: BattleResultModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen || !result) return null;

  const isVictory = result.winner === 'player';
  const totalPlayerDamage = Object.entries(result.statistics.totalDamageDealt)
    .filter(([key]) => key.startsWith('player_'))
    .reduce((sum, [, value]) => sum + value, 0);
  const totalEnemyDamage = Object.entries(result.statistics.totalDamageDealt)
    .filter(([key]) => key.startsWith('enemy_'))
    .reduce((sum, [, value]) => sum + value, 0);

  const playerDamageData = playerTeam.map((dragon) => ({
    name: dragon.name,
    damage: result.statistics.totalDamageDealt[`player_${dragon.id}`] || 0,
    taken: result.statistics.totalDamageTaken[`player_${dragon.id}`] || 0,
    isAlive: dragon.isAlive,
  }));

  const maxDamage = Math.max(...playerDamageData.map((d) => d.damage), 1);

  return (
    <div className={`modal-overlay ${isVisible ? 'visible' : ''}`} onClick={onClose}>
      <div
        className={`result-modal ${isVisible ? 'visible' : ''} ${isVictory ? 'victory' : 'defeat'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="result-title">
            {isVictory ? '胜利！' : '失败...'}
          </h2>
          <p className="result-subtitle">
            战斗在第 {result.statistics.turnsCount} 回合结束
          </p>
        </div>

        <div className="modal-content">
          <div className="stats-overview">
            <div className="stat-card player">
              <div className="stat-label">我方伤害</div>
              <div className="stat-value">{totalPlayerDamage}</div>
              <div className="stat-bar">
                <div
                  className="stat-fill"
                  style={{ width: `${Math.min(100, (totalPlayerDamage / (totalPlayerDamage + totalEnemyDamage)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="stat-card enemy">
              <div className="stat-label">敌方伤害</div>
              <div className="stat-value">{totalEnemyDamage}</div>
              <div className="stat-bar">
                <div
                  className="stat-fill"
                  style={{ width: `${Math.min(100, (totalEnemyDamage / (totalPlayerDamage + totalEnemyDamage)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="damage-chart">
            <h3>我方伤害分布</h3>
            <div className="chart-bars">
              {playerDamageData.map((dragon, i) => (
                <div key={i} className="chart-item">
                  <div className="chart-label">
                    <span className={`dragon-status ${dragon.isAlive ? 'alive' : 'dead'}`}>
                      {dragon.name}
                    </span>
                    <span className="chart-value">{dragon.damage}</span>
                  </div>
                  <div className="chart-bar-bg">
                    <div
                      className="chart-bar-fill"
                      style={{ width: `${(dragon.damage / maxDamage) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="survival-status">
            <h3>存活情况</h3>
            <div className="survival-grid">
              <div className="survival-team">
                <span className="team-label">我方</span>
                <div className="survival-count">
                  {playerTeam.filter((d) => d.isAlive).length} / {playerTeam.length}
                </div>
              </div>
              <div className="survival-team">
                <span className="team-label">敌方</span>
                <div className="survival-count">
                  {enemyTeam.filter((d) => d.isAlive).length} / {enemyTeam.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            关闭
          </button>
          <button className="btn-primary" onClick={onRestart}>
            再来一次
          </button>
        </div>
      </div>
    </div>
  );
}
