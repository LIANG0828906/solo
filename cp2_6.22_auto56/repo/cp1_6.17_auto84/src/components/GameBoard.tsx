import { useEffect, useCallback } from 'react';
import { useBattleStore } from '@/store/useBattleStore';
import '@/styles/game.css';

const CLASS_LABELS: Record<string, string> = {
  warrior: '战士',
  mage: '法师',
  rogue: '盗贼',
};

const EFFECT_LABELS: Record<string, string> = {
  damage: '伤害',
  shield: '护盾',
  heal: '回复',
  draw: '抽牌',
};

function getHpColor(ratio: number): string {
  if (ratio > 0.6) return '#2ECC71';
  if (ratio > 0.3) return '#F1C40F';
  return '#E74C3C';
}

export default function GameBoard() {
  const {
    player, enemy, hand, selectedCardIndex, phase, turn, logs, stats, deckSize,
    playingCardUid, initGame, selectCard, playSelectedCard, endTurn,
  } = useBattleStore();

  useEffect(() => { initGame(); }, [initGame]);

  const handlePlayCard = useCallback(() => {
    playSelectedCard();
  }, [playSelectedCard]);

  const handleEndTurn = useCallback(() => {
    endTurn();
  }, [endTurn]);

  const hpRatio = enemy ? enemy.currentHp / enemy.maxHp : 0;

  return (
    <div className="game-container">
      <div className="game-board">
        <div className="player-info">
          <div className="player-info-row hp-text">
            <span className="icon">❤️</span>
            {player.hp} / {player.maxHp}
          </div>
          <div className="player-info-row energy-text">
            <span className="icon">⚡</span>
            {player.energy} / {player.maxEnergy}
          </div>
          {player.shield > 0 && (
            <div className="shield-text">🛡️ {player.shield}</div>
          )}
        </div>

        <div className="turn-info">
          回合 {turn}
          {phase === 'player_turn' && ' · 你的回合'}
          {phase === 'enemy_turn' && ' · 敌方回合'}
        </div>

        <div className="enemy-area">
          {enemy && (
            <div className="enemy-card">
              <div className="enemy-name">{enemy.name}</div>
              <div className="enemy-attack">⚔️ 攻击力 {enemy.attack}</div>
              <div className="enemy-hp-bar-container">
                <div
                  className="enemy-hp-bar"
                  style={{
                    width: `${hpRatio * 100}%`,
                    background: getHpColor(hpRatio),
                  }}
                />
              </div>
              <div className="enemy-hp-text">{enemy.currentHp} / {enemy.maxHp}</div>
            </div>
          )}
        </div>

        <div className="actions-area">
          <button
            className="btn btn-play"
            onClick={handlePlayCard}
            disabled={selectedCardIndex === null || phase !== 'player_turn'}
          >
            出牌
          </button>
          <button
            className="btn btn-end"
            onClick={handleEndTurn}
            disabled={phase !== 'player_turn'}
          >
            结束回合
          </button>
        </div>

        <div className="log-area">
          {logs.map((log, i) => (
            <div className="log-entry" key={i}>{log}</div>
          ))}
        </div>

        <div className="deck-info">牌库剩余: {deckSize}</div>

        <div className="hand-area">
          {hand.map((card, i) => (
            <div
              key={card.uid}
              className={[
                'card',
                `class-${card.class}`,
                selectedCardIndex === i ? 'selected' : '',
                playingCardUid === card.uid ? 'playing' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => selectCard(selectedCardIndex === i ? null : i)}
            >
              <div className="card-cost">{card.cost}</div>
              <div className="card-name">{card.name}</div>
              <div className={`card-class ${card.class}`}>
                {CLASS_LABELS[card.class]}
              </div>
              <div className="card-value">{card.value}</div>
              <div className="card-effect">{EFFECT_LABELS[card.effectType]}</div>
            </div>
          ))}
        </div>

        {phase === 'victory' && (
          <div className="battle-result-overlay victory">
            <div className="result-title">战斗胜利！</div>
            <div className="stats-panel">
              <div className="stats-row">
                <span className="stats-label">使用卡牌数</span>
                <span className="stats-value">{stats.cardsUsed}</span>
              </div>
              <div className="stats-row">
                <span className="stats-label">回合数</span>
                <span className="stats-value">{turn}</span>
              </div>
              <div className="stats-row">
                <span className="stats-label">总伤害</span>
                <span className="stats-value">{stats.totalDamage}</span>
              </div>
            </div>
            <button className="btn-restart" onClick={() => initGame()}>
              重新开始
            </button>
          </div>
        )}

        {phase === 'defeat' && (
          <div className="battle-result-overlay defeat">
            <div className="result-title">战斗失败</div>
            <button className="btn-restart" onClick={() => initGame()}>
              重新开始
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
