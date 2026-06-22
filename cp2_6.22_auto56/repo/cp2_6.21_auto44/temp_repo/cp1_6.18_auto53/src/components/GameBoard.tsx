import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { Card } from './Card';
import type { Player } from '../types';
import { TURN_DURATION } from '../utils/cards';

interface PlayerInfoProps {
  player: Player;
  isOpponent?: boolean;
  isFaded?: boolean;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, isOpponent = false, isFaded = false }) => {
  const healthPercent = (player.health / player.maxHealth) * 100;
  const energyOrbs = Array.from({ length: player.maxEnergy }, (_, i) => i < player.energy);

  return (
    <div className={isOpponent ? 'opponent-info' : 'player-info'} style={{ opacity: isFaded ? 0.3 : 1, transition: 'opacity 0.3s' }}>
      <div className="player-avatar">{player.avatar}</div>
      <div className="player-details">
        <div className="player-name">
          {player.name}
          {player.armor > 0 && <span className="armor-badge">🛡️ {player.armor}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="health-bar-container">
            <div className="health-bar-bg">
              <div className="health-bar-fill" style={{ width: `${healthPercent}%` }} />
            </div>
            <div className="health-text">❤️ {player.health} / {player.maxHealth}</div>
          </div>
          <div className="energy-indicator" title={`能量: ${player.energy}/${player.maxEnergy}`}>
            {energyOrbs.map((filled, i) => (
              <div key={i} className={`energy-orb ${filled ? 'filled' : ''}`} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: '#888' }}>
            📚 {player.deck.length} | 🗑️ {player.graveyard.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export const GameBoard: React.FC = () => {
  const {
    phase,
    turn,
    timeRemaining,
    player,
    opponent,
    battlefield,
    winner,
    transitionCountdown,
    transitionMessage,
    shakingCardId,
    playCard,
    endTurn,
    resetGame,
    decrementTime,
    aiPlayStep,
    cleanupBattlefield,
    decrementTransition,
  } = useGameStore();

  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const handContainerRef = useRef<HTMLDivElement>(null);
  const aiTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase === 'playerTurn' || phase === 'opponentTurn') {
      const timer = setInterval(() => {
        decrementTime();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, decrementTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      cleanupBattlefield();
    }, 500);
    return () => clearInterval(timer);
  }, [cleanupBattlefield]);

  useEffect(() => {
    if (phase === 'transitioning') {
      const timer = setTimeout(() => {
        decrementTransition();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, transitionCountdown, decrementTransition]);

  useEffect(() => {
    if (phase === 'opponentTurn') {
      aiTimerRef.current = window.setTimeout(() => {
        const played = aiPlayStep();
        if (played) {
          aiTimerRef.current = window.setTimeout(() => {
            aiPlayStep();
          }, 1500);
        }
      }, 1500);
    }
    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
      }
    };
  }, [phase, aiPlayStep]);

  const updateScrollIndicators = useCallback(() => {
    const el = handContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  }, []);

  useEffect(() => {
    updateScrollIndicators();
  }, [player.hand.length, updateScrollIndicators]);

  const handleScrollClick = (direction: 'left' | 'right') => {
    const el = handContainerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggingCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragEnd = () => {
    setDraggingCardId(null);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      playCard(cardId, true);
    }
    setDraggingCardId(null);
  };

  const handleCardClick = (cardId: string) => {
    playCard(cardId, true);
  };

  const isPlayerTurn = phase === 'playerTurn';
  const timerPercent = (timeRemaining / TURN_DURATION) * 100;
  const isUrgent = timeRemaining <= 5;
  const timerColor = isUrgent ? '#FF6B6B' : '#4ECDC4';

  const isFaded = phase === 'transitioning';

  return (
    <div className="game-container">
      <div className="timer-bar">
        <div
          className={`timer-bar-fill ${isUrgent ? 'urgent' : ''}`}
          style={{
            width: `${timerPercent}%`,
            backgroundColor: timerColor,
          }}
        />
      </div>

      <PlayerInfo player={opponent} isOpponent isFaded={isFaded && transitionMessage === '玩家回合'} />

      <div
        className={`battlefield ${isDragOver ? 'drop-target' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {battlefield.length > 0 && (
          <div className="battlefield-cards">
            {battlefield.map((bc) => (
              <div key={`${bc.card.id}-${bc.timestamp}`} className="battlefield-card">
                <Card card={bc.card} isPlayable={false} size="small" />
              </div>
            ))}
          </div>
        )}
        {battlefield.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>
            {isPlayerTurn ? '拖拽或点击卡牌出战' : '对手思考中...'}
          </div>
        )}
      </div>

      <PlayerInfo player={player} isFaded={isFaded && transitionMessage === '对手回合'} />

      <div className="hand-area">
        <div className="turn-info">
          第 <strong>{turn}</strong> 回合 · {isPlayerTurn ? '你的回合' : phase === 'opponentTurn' ? '对手回合' : '...'}
        </div>

        <div
          className={`scroll-indicator left ${canScrollLeft ? 'visible' : ''}`}
          onClick={() => handleScrollClick('left')}
        >
          ‹
        </div>

        <div
          ref={handContainerRef}
          className="hand-cards"
          onScroll={updateScrollIndicators}
        >
          {player.hand.map((card) => (
            <Card
              key={card.id}
              card={card}
              isPlayable={isPlayerTurn && card.cost <= player.energy}
              isDragging={draggingCardId === card.id}
              isShaking={shakingCardId === card.id}
              isFaded={isFaded && transitionMessage === '对手回合'}
              onClick={() => handleCardClick(card.id)}
              onDragStart={(e) => handleDragStart(e, card.id)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>

        <div
          className={`scroll-indicator right ${canScrollRight ? 'visible' : ''}`}
          onClick={() => handleScrollClick('right')}
        >
          ›
        </div>

        <button
          className="end-turn-btn"
          onClick={endTurn}
          disabled={!isPlayerTurn}
        >
          结束回合
        </button>
      </div>

      {phase === 'transitioning' && (
        <div className="transition-overlay">
          <div className="transition-message">{transitionMessage}</div>
          <div className="transition-countdown">{transitionCountdown}</div>
        </div>
      )}

      {phase === 'gameOver' && winner && (
        <div className="victory-overlay">
          <div className="victory-title">🏆 胜利！</div>
          <div className="victory-winner">{winner} 获胜</div>
          <button className="restart-btn" onClick={resetGame}>
            再来一局
          </button>
        </div>
      )}
    </div>
  );
};
