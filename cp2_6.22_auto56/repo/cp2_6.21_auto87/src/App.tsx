import { useEffect, useCallback } from 'react';
import { Arena } from './components/Arena';
import { HandPanel } from './components/HandPanel';
import { HeroPanel } from './components/HeroPanel';
import { LogPanel } from './components/LogPanel';
import { EnergyBar } from './components/EnergyBar';
import { useGameStore } from './stores/gameStore';
import type { Unit, Card as CardType } from './types/game';
import './App.css';

function App() {
  const {
    units,
    playerHand,
    playerEnergy,
    opponentEnergy,
    maxEnergy,
    selectedCard,
    selectedTargetId,
    currentTurn,
    playerSide,
    phase,
    winner,
    turnNumber,
    logs,
    initGame,
    selectCard,
    deselectCard,
    playCard,
    endTurn,
    isMyTurn,
  } = useGameStore();

  useEffect(() => {
    initGame('player');
  }, [initGame]);

  const playerHero = units.find((u) => u.type === 'hero' && u.owner === 'player');
  const opponentHero = units.find((u) => u.type === 'hero' && u.owner === 'opponent');

  const handleCardClick = useCallback((card: CardType) => {
    if (!isMyTurn()) return;

    if (selectedCard?.id === card.id) {
      deselectCard();
    } else {
      if (card.targetType === 'self' || card.targetType === 'all_friendly' || card.targetType === 'all_enemy' || card.targetType === 'random_enemy') {
        playCard(card.id);
      } else {
        selectCard(card.id);
      }
    }
  }, [selectedCard, selectCard, deselectCard, playCard, isMyTurn]);

  const handleUnitClick = useCallback((unit: Unit) => {
    if (!selectedCard || !isMyTurn()) return;

    const isValidTarget = (() => {
      const isEnemy = unit.owner !== playerSide;
      const isFriendly = unit.owner === playerSide;

      switch (selectedCard.type) {
        case 'attack':
          return isEnemy;
        case 'heal':
        case 'shield':
          return isFriendly;
        case 'debuff':
          return isEnemy;
        default:
          return false;
      }
    })();

    if (isValidTarget) {
      playCard(selectedCard.id, unit.id);
    }
  }, [selectedCard, playerSide, playCard, isMyTurn]);

  const handleEndTurn = useCallback(() => {
    if (isMyTurn()) {
      endTurn();
    }
  }, [endTurn, isMyTurn]);

  const handleRestart = useCallback(() => {
    initGame('player');
  }, [initGame]);

  return (
    <div className="game-app">
      <div className="game-header">
        <div className="header-left">
          <HeroPanel
            hero={opponentHero}
            energy={opponentEnergy}
            maxEnergy={maxEnergy}
            isPlayer={false}
            isCurrentTurn={currentTurn === 'opponent'}
          />
        </div>
        <div className="header-center">
          <div className="turn-info">
            <span className="turn-number">第 {turnNumber} 回合</span>
            <span className={`turn-status ${isMyTurn() ? 'my-turn' : 'opponent-turn'}`}>
              {isMyTurn() ? '你的回合' : '对手回合'}
            </span>
          </div>
        </div>
        <div className="header-right">
          <EnergyBar current={opponentEnergy} max={maxEnergy} label="对手能量" />
        </div>
      </div>

      <div className="game-main">
        <div className="game-content">
          <Arena
            units={units}
            selectedCard={selectedCard}
            selectedTargetId={selectedTargetId}
            onUnitClick={handleUnitClick}
            playerSide={playerSide}
          />

          {selectedCard && (
            <div className="selected-card-info">
              <span className="selected-hint">
                {selectedCard.type === 'attack' || selectedCard.type === 'debuff'
                  ? '请选择敌方目标'
                  : '请选择友方目标'}
              </span>
              <button className="cancel-btn" onClick={deselectCard}>
                取消
              </button>
            </div>
          )}
        </div>

        <div className="game-sidebar">
          <LogPanel logs={logs} />
        </div>
      </div>

      <div className="game-footer">
        <div className="footer-left">
          <EnergyBar current={playerEnergy} max={maxEnergy} label="我的能量" />
        </div>
        <div className="footer-center">
          <HandPanel
            cards={playerHand}
            selectedCard={selectedCard}
            currentEnergy={playerEnergy}
            isMyTurn={isMyTurn()}
            onCardClick={handleCardClick}
          />
        </div>
        <div className="footer-right">
          <button
            className={`end-turn-btn ${isMyTurn() ? 'active' : ''}`}
            onClick={handleEndTurn}
            disabled={!isMyTurn() || phase !== 'playing'}
          >
            结束回合
          </button>
        </div>
      </div>

      {phase === 'ended' && winner && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
          <h2 className="game-over-title">
            {winner === playerSide ? '🎉 胜利！' : '💀 失败...'}
          </h2>
          <p className="game-over-text">
            {winner === playerSide ? '恭喜你赢得了这场战斗！' : '很遗憾，你被击败了。'}
          </p>
          <button className="restart-btn" onClick={handleRestart}>
            再来一局
          </button>
        </div>
        </div>
      )}
    </div>
  );
}

export default App;
