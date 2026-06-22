import React, { useState, useEffect } from 'react';
import type { GameState, Card } from '../types';
import CardComponent from './Card';

interface GameBoardProps {
  gameState: GameState;
  selectedHandCard: Card | null;
  selectedBoardMinion: Card | null;
  onSelectHandCard: (card: Card) => void;
  onPlayCard: (card: Card) => void;
  onSelectBoardMinion: (card: Card) => void;
  onAttack: (attacker: Card, targetId: string, targetType: 'minion' | 'hero') => void;
  onEndTurn: () => void;
  isAITurn: boolean;
  errorMessage: string | null;
  attackingMinionId: string | null;
  attackTargetId: string | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  selectedHandCard,
  selectedBoardMinion,
  onSelectHandCard,
  onPlayCard,
  onSelectBoardMinion,
  onAttack,
  onEndTurn,
  isAITurn,
  errorMessage,
  attackingMinionId,
  attackTargetId,
}) => {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (errorMessage) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const { player, ai, turn, currentPlayer } = gameState;

  const getHealthGradient = (health: number, maxHealth: number) => {
    const pct = Math.max(0, Math.min(1, health / maxHealth));
    if (pct > 0.6) return 'linear-gradient(90deg, #22c55e, #16a34a)';
    if (pct > 0.3) return 'linear-gradient(90deg, #eab308, #ca8a04)';
    return 'linear-gradient(90deg, #ef4444, #b91c1c)';
  };

  const renderHero = (
    data: typeof player,
    isEnemy: boolean,
    onClick?: () => void,
    targetable?: boolean
  ) => {
    const healthPct = Math.max(0, (data.health / data.maxHealth) * 100);

    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          cursor: targetable ? 'crosshair' : 'default',
          padding: 12,
          borderRadius: 16,
          background: targetable
            ? 'rgba(255, 80, 80, 0.15)'
            : 'rgba(255,255,255,0.03)',
          border: targetable ? '2px dashed rgba(255, 80, 80, 0.6)' : '2px solid transparent',
          transition: 'all 300ms',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: isEnemy
              ? 'linear-gradient(135deg, #662244, #441133)'
              : 'linear-gradient(135deg, #224466, #113355)',
            border: `4px solid ${isEnemy ? '#ff6b9d' : '#6bb3ff'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 42,
            boxShadow: targetable
              ? '0 0 20px rgba(255, 80, 80, 0.6)'
              : `0 4px 16px rgba(${isEnemy ? '255, 107, 157' : '107, 179, 255'}, 0.3)`,
            animation: targetable ? 'pulse 1s infinite' : 'none',
          }}
        >
          {isEnemy ? '👺' : '🧙'}
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: isEnemy ? '#ff9db5' : '#9dd5ff',
              marginBottom: 6,
            }}
          >
            {isEnemy ? 'AI 对手' : '玩家'}
          </div>

          <div
            style={{
              height: 18,
              background: 'rgba(0,0,0,0.5)',
              borderRadius: 9,
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${healthPct}%`,
                background: getHealthGradient(data.health, data.maxHealth),
                transition: 'width 500ms ease-out',
                borderRadius: 9,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}
            >
              ❤️ {data.health} / {data.maxHealth}
            </div>
          </div>

          <div
            style={{
              marginTop: 8,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                padding: '4px 10px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 'bold',
              }}
            >
              💎 {data.mana}/{data.maxMana}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#888',
              }}
            >
              📚 牌库: {data.deck.length}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#aaa',
              }}
            >
              ✋ 手牌: {data.hand.length}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHand = (
    cards: Card[],
    isEnemy: boolean,
    mana: number
  ) => {
    const count = cards.length;
    const baseOffset = count > 1 ? -((count - 1) * 18) : 0;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: isEnemy ? 'flex-start' : 'flex-end',
          minHeight: isEnemy ? 100 : 200,
          padding: '10px 0',
          position: 'relative',
        }}
      >
        {cards.map((card, index) => {
          const offset = baseOffset + index * 36;
          const rotation = isEnemy
            ? (index - (count - 1) / 2) * -3
            : (index - (count - 1) / 2) * 3;
          const canPlay = !isEnemy && card.cost <= mana && currentPlayer === 'player';
          const isSelected =
            !isEnemy && selectedHandCard?.instanceId === card.instanceId;

          return (
            <div
              key={card.instanceId}
              style={{
                position: 'relative',
                marginLeft: index === 0 ? 0 : -60,
                transform: `translateX(${offset}px) rotate(${rotation}deg)`,
                zIndex: isSelected ? 50 : index,
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {isEnemy ? (
                <div
                  style={{
                    width: 90,
                    height: 126,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #3a1a2f, #2a0a1f)',
                    border: '2px solid rgba(255, 107, 157, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  }}
                >
                  🔒
                </div>
              ) : (
                <CardComponent
                  card={card}
                  onClick={() => {
                    if (!canPlay) {
                      if (card.cost > mana) {
                        onSelectHandCard({ ...card, __disabled: true } as any);
                      }
                      return;
                    }
                    onSelectHandCard(card);
                  }}
                  selected={isSelected}
                  disabled={!canPlay}
                />
              )}
            </div>
          );
        })}
        {cards.length === 0 && (
          <div style={{ color: '#555', fontSize: 14, padding: 40 }}>
            {isEnemy ? '对手无手牌' : '手牌为空'}
          </div>
        )}
      </div>
    );
  };

  const renderBoard = (
    cards: Card[],
    isEnemy: boolean,
    onBoardClick?: () => void
  ) => {
    const hasTaunt = isEnemy && cards.some((c) => c.effect === 'taunt');
    const playerTaunt = !isEnemy && ai.board.some((c) => c.effect === 'taunt');

    return (
      <div
        onClick={onBoardClick}
        style={{
          minHeight: 150,
          background: isEnemy
            ? 'linear-gradient(180deg, rgba(102, 34, 68, 0.2), rgba(102, 34, 68, 0.05))'
            : 'linear-gradient(0deg, rgba(34, 68, 102, 0.2), rgba(34, 68, 102, 0.05))',
          borderRadius: 16,
          border: `2px ${
            selectedHandCard && !isEnemy && currentPlayer === 'player'
              ? 'dashed rgba(255, 215, 0, 0.5)'
              : 'solid rgba(255,255,255,0.06)'
          }`,
          padding: 16,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          cursor:
            selectedHandCard && !isEnemy && currentPlayer === 'player'
              ? 'pointer'
              : 'default',
          transition: 'all 300ms',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {cards.length === 0 && (
          <div style={{ color: '#444', fontSize: 13, pointerEvents: 'none' }}>
            {isEnemy ? '敌方战场' : '己方战场'}
          </div>
        )}

        {cards.map((card) => {
          const canAttack =
            !isEnemy &&
            currentPlayer === 'player' &&
            card.canAttack &&
            !card.hasAttacked;
          const isSelected =
            selectedBoardMinion?.instanceId === card.instanceId;
          const isAttacking = attackingMinionId === card.instanceId;
          const isTarget = attackTargetId === card.instanceId;
          const targetable = !!(
            isEnemy &&
            selectedBoardMinion &&
            (!hasTaunt || card.effect === 'taunt')
          );

          return (
            <div
              key={card.instanceId}
              style={{
                position: 'relative',
                transition: 'all 300ms',
                animation: isTarget ? 'shake 300ms ease-in-out, flash 300ms' : 'none',
              }}
            >
              <CardComponent
                card={card}
                onClick={() => {
                  if (isEnemy && targetable && selectedBoardMinion) {
                    onAttack(selectedBoardMinion, card.instanceId!, 'minion');
                  } else if (!isEnemy && canAttack) {
                    onSelectBoardMinion(card);
                  }
                }}
                selected={isSelected}
                isOnBoard
                isEnemy={isEnemy}
                canAttackNow={canAttack}
                attacking={isAttacking}
                targetable={targetable}
                size="small"
              />
              {card.effect === 'taunt' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: -6,
                    border: '3px solid rgba(139, 90, 43, 0.8)',
                    borderRadius: 16,
                    pointerEvents: 'none',
                    boxShadow: 'inset 0 0 10px rgba(139, 90, 43, 0.3)',
                  }}
                />
              )}
            </div>
          );
        })}

        {hasTaunt && (
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(139, 90, 43, 0.9)',
              padding: '2px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 'bold',
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
          >
            🛡️ 嘲讽
          </div>
        )}

        {selectedBoardMinion && isEnemy && !hasTaunt && (
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(102, 34, 68, 0.9)',
              padding: '4px 12px',
              borderRadius: 10,
              fontSize: 12,
              color: '#aaa',
              pointerEvents: 'none',
            }}
          >
            点击英雄头像直接攻击
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
        padding: 16,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ fontSize: 14, color: '#aaa' }}>
          回合: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{turn}</span>
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 'bold',
            padding: '6px 20px',
            borderRadius: 20,
            background:
              currentPlayer === 'player'
                ? 'linear-gradient(135deg, #22c55e, #15803d)'
                : 'linear-gradient(135deg, #dc2626, #991b1b)',
            boxShadow:
              currentPlayer === 'player'
                ? '0 0 20px rgba(34, 197, 94, 0.4)'
                : '0 0 20px rgba(220, 38, 38, 0.4)',
          }}
        >
          {currentPlayer === 'player' ? '🎮 你的回合' : '🤖 AI 回合'}
        </div>
        <button
          onClick={onEndTurn}
          disabled={currentPlayer !== 'player' || isAITurn}
          style={{
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 'bold',
            borderRadius: 12,
            border: 'none',
            cursor:
              currentPlayer !== 'player' || isAITurn
                ? 'not-allowed'
                : 'pointer',
            background:
              currentPlayer !== 'player' || isAITurn
                ? 'linear-gradient(135deg, #555, #333)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: currentPlayer !== 'player' || isAITurn ? 0.6 : 1,
            transition: 'all 200ms',
            boxShadow:
              currentPlayer === 'player' && !isAITurn
                ? '0 4px 15px rgba(245, 158, 11, 0.4)'
                : 'none',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              animation:
                currentPlayer === 'player' && !isAITurn
                  ? 'none'
                  : 'spin 1s linear infinite',
            }}
          >
            ⏳
          </span>
          结束回合
        </button>
      </div>

      {showError && errorMessage && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(220, 38, 38, 0.95)',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: 12,
            fontWeight: 'bold',
            zIndex: 9999,
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            animation: 'fadeInScale 300ms ease-out',
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {renderHero(
          ai,
          true,
          selectedBoardMinion &&
          !ai.board.some((c) => c.effect === 'taunt')
            ? () => onAttack(selectedBoardMinion, 'ai-hero', 'hero')
            : undefined,
          !!(
            selectedBoardMinion &&
            !ai.board.some((c) => c.effect === 'taunt')
          )
        )}
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ flexShrink: 0 }}>
        {renderHand(ai.hand, true, ai.mana)}
      </div>

      {renderBoard(ai.board, true)}

      <div
        style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)',
          margin: '4px 0',
        }}
      />

      {renderBoard(
        player.board,
        false,
        selectedHandCard && currentPlayer === 'player'
          ? () => onPlayCard(selectedHandCard)
          : undefined
      )}

      <div style={{ flexShrink: 0 }}>
        {renderHand(player.hand, false, player.mana)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {renderHero(player, false)}
        <div style={{ flex: 1 }} />
      </div>

      <style>{`
        @media (max-width: 900px) {
        }
      `}</style>
    </div>
  );
};

export default GameBoard;
