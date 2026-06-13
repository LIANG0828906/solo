import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Spell, ElementType, Player } from '../types';
import { AnimationRenderer } from '../renderer/AnimationRenderer';

interface GameBoardProps {
  gameState: GameState;
  onSpellSelect: (playerId: number, spellId: string) => void;
  onReset: () => void;
  responsive?: boolean;
}

const ELEMENT_NAMES: Record<ElementType, string> = {
  fire: '火',
  ice: '冰',
  thunder: '雷',
  wind: '风',
};

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onSpellSelect, onReset, responsive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<AnimationRenderer | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardFlying, setCardFlying] = useState<{ spell: Spell; side: 'left' | 'right' } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 500 });
  const [cardSize, setCardSize] = useState({ w: 80, h: 120 });
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const updateSize = () => {
      const isSmall = responsive && window.innerWidth < 768;
      const newCanvas = isSmall ? { width: 600, height: 350 } : { width: 900, height: 500 };
      const newCard = isSmall ? { w: 60, h: 90 } : { w: 80, h: 120 };
      setCanvasSize(newCanvas);
      setCardSize(newCard);
      if (rendererRef.current) {
        rendererRef.current.resize(newCanvas.width, newCanvas.height);
      }
    };
    updateSize();
    if (responsive) {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [responsive]);

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new AnimationRenderer(canvasRef.current);
      rendererRef.current.resize(canvasSize.width, canvasSize.height);
    }
    const loop = () => {
      if (rendererRef.current) {
        rendererRef.current.renderIdleFrame();
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.resize(canvasSize.width, canvasSize.height);
    }
  }, [canvasSize]);

  useEffect(() => {
    if (gameState.phase === 'animating' && gameState.selectedSpell && rendererRef.current) {
      const targetSide = gameState.currentPlayer === 0 ? 'right' : 'left';
      setCardFlying({ spell: gameState.selectedSpell, side: targetSide });
      const flyDuration = 250;
      setTimeout(() => {
        setCardFlying(null);
        setSelectedCardId(null);
        const duration = rendererRef.current!.getAnimationDuration(gameState.selectedSpell!.element);
        rendererRef.current!.startSpellAnimation(
          gameState.selectedSpell!.element,
          targetSide,
          duration,
          () => {}
        );
      }, flyDuration);
    }
  }, [gameState.phase, gameState.selectedSpell]);

  const handleCardClick = useCallback((spell: Spell) => {
    if (gameState.gameOver || gameState.phase !== 'selecting') return;
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.status === 'frozen') return;
    const isOwner = currentPlayer.hand.some(s => s.id === spell.id);
    if (!isOwner) return;
    setSelectedCardId(spell.id);
    onSpellSelect(gameState.currentPlayer, spell.id);
  }, [gameState, onSpellSelect]);

  const isCurrentPlayerFrozen = gameState.players[gameState.currentPlayer].status === 'frozen';
  const canInteract = !gameState.gameOver && gameState.phase === 'selecting' && !isCurrentPlayerFrozen;

  const renderHpBar = (player: Player, side: 'left' | 'right') => {
    const percent = (player.hp / player.maxHp) * 100;
    const isLow = percent < 30;
    const barStyle: React.CSSProperties = {
      position: 'absolute',
      top: canvasSize.height * 0.08,
      [side]: 20,
      width: 300,
      height: 30,
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: '0 4px 12px #00000033',
    };
    const fillStyle: React.CSSProperties = {
      width: `${percent}%`,
      height: '100%',
      background: side === 'left'
        ? 'linear-gradient(90deg, #ff4444, #cc0000, #ff6666)'
        : 'linear-gradient(90deg, #4488ff, #0044cc, #6699ff)',
      transition: 'width 0.3s ease',
      animation: isLow ? 'hpBlink 0.5s infinite' : undefined,
    };
    return (
      <div key={player.id} style={barStyle}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 8,
        }} />
        <div style={fillStyle} />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
          padding: side === 'left' ? '0 12px 0 70px' : '0 70px 0 12px',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 14,
          textShadow: '1px 1px 2px #000',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ marginRight: side === 'left' ? 'auto' : 8 }}>{player.name}</span>
          <span style={{ marginLeft: side === 'right' ? 'auto' : 8 }}>{player.hp}/{player.maxHp}</span>
        </div>
        <div style={{
          position: 'absolute',
          top: 34,
          [side]: 0,
          display: 'flex',
          gap: 6,
        }}>
          {player.status === 'frozen' && <span title="冰冻">❄️</span>}
          {player.status === 'combo' && <span title="连击">⚡</span>}
        </div>
      </div>
    );
  };

  const renderCard = (spell: Spell, index: number, total: number, isCurrentPlayer: boolean) => {
    const isHovered = hoveredCard === spell.id;
    const isSelected = selectedCardId === spell.id;
    const isDisabled = !canInteract || !isCurrentPlayer || (selectedCardId !== null && !isSelected);
    const totalWidth = total * cardSize.w + (total - 1) * 10;
    const leftOffset = (canvasSize.width - totalWidth) / 2 + index * (cardSize.w + 10);
    const cardStyle: React.CSSProperties = {
      position: 'absolute',
      left: leftOffset,
      bottom: 10,
      width: cardSize.w,
      height: cardSize.h,
      borderRadius: 12,
      background: spell.color,
      boxShadow: isSelected
        ? `0 0 20px 6px ${spell.color}99, 0 4px 12px #00000033`
        : isHovered && !isDisabled
          ? `0 8px 20px #00000033, 0 0 15px ${spell.color}55`
          : '0 4px 12px #00000033',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: 'transform 0.2s ease, box-shadow 0.3s ease, opacity 0.2s ease',
      transform: (isHovered && !isDisabled) ? 'scale(1.05) translateY(-8px)' : 'none',
      opacity: isDisabled && !isSelected ? 0.4 : 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: cardSize.h * 0.08,
      color: '#fff',
      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
      userSelect: 'none',
      animation: isSelected ? 'pulseGlow 0.6s ease-out' : undefined,
    };
    const emojiSize = Math.floor(cardSize.w * 0.45);
    return (
      <div
        key={spell.id}
        style={cardStyle}
        onMouseEnter={() => setHoveredCard(spell.id)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => handleCardClick(spell)}
      >
        <div style={{
          fontSize: cardSize.w * 0.13,
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 1.1,
        }}>
          {spell.name}
        </div>
        <div style={{ fontSize: emojiSize, lineHeight: 1 }}>{spell.emoji}</div>
        <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
          <div style={{ fontSize: cardSize.w * 0.18, fontWeight: 'bold' }}>{spell.damage}</div>
          <div style={{ fontSize: cardSize.w * 0.11, opacity: 0.9 }}>{ELEMENT_NAMES[spell.element]}属性</div>
        </div>
      </div>
    );
  };

  const player1 = gameState.players[0];
  const player2 = gameState.players[1];
  const currentHand = gameState.players[gameState.currentPlayer].hand;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 10px',
      minHeight: '100vh',
    }}>
      <style>{`
        @keyframes hpBlink {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.6); }
        }
        @keyframes pulseGlow {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes cardFly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={{
        textAlign: 'center',
        marginBottom: 16,
      }}>
        <h1 style={{
          fontSize: canvasSize.width < 768 ? 24 : 36,
          background: 'linear-gradient(135deg, #FFD700, #E25822, #00BFFF, #32CD32)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 8,
          fontWeight: 'bold',
          letterSpacing: 2,
        }}>
          ✨ ArcaneForge 奥术锻造 ✨
        </h1>
        <div style={{
          display: 'flex',
          gap: 30,
          justifyContent: 'center',
          fontSize: canvasSize.width < 768 ? 14 : 18,
          color: '#e0e0e0',
        }}>
          <span>回合: <strong style={{ color: '#FFD700' }}>{gameState.round}</strong></span>
          <span>牌组剩余: <strong style={{ color: '#00BFFF' }}>{gameState.deckRemaining}/20</strong></span>
          <span>行动: <strong style={{ color: gameState.currentPlayer === 0 ? '#ff6666' : '#6699ff' }}>
            {gameState.players[gameState.currentPlayer].name}
          </strong></span>
        </div>
      </div>
      <div style={{ position: 'relative', width: canvasSize.width, height: canvasSize.height + 180 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: canvasSize.width, height: canvasSize.height }}>
          <canvas
            ref={canvasRef}
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              borderRadius: 12,
              boxShadow: '0 8px 32px #00000033, 0 0 60px rgba(100, 150, 255, 0.1)',
              display: 'block',
            }}
          />
          {renderHpBar(player1, 'left')}
          {renderHpBar(player2, 'right')}
          <div style={{
            position: 'absolute',
            left: canvasSize.width * 0.15,
            top: canvasSize.height * 0.28,
            transform: 'translateX(-50%)',
            fontSize: canvasSize.width < 768 ? 36 : 60,
            filter: 'drop-shadow(0 4px 8px rgba(255, 100, 100, 0.4))',
            userSelect: 'none',
          }}>
            🧙‍♂️
          </div>
          <div style={{
            position: 'absolute',
            right: canvasSize.width * 0.15,
            top: canvasSize.height * 0.28,
            transform: 'translateX(50%)',
            fontSize: canvasSize.width < 768 ? 36 : 60,
            filter: 'drop-shadow(0 4px 8px rgba(100, 150, 255, 0.4))',
            userSelect: 'none',
          }}>
            🧙‍♀️
          </div>
          {cardFlying && (() => {
            const startX = canvasSize.width / 2;
            const startY = canvasSize.height + cardSize.h / 2 + 10;
            const endX = cardFlying.side === 'left' ? canvasSize.width * 0.25 : canvasSize.width * 0.75;
            const endY = canvasSize.height * 0.35;
            return (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: cardSize.w,
                  height: cardSize.h,
                  borderRadius: 12,
                  background: cardFlying.spell.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: cardSize.w * 0.45,
                  boxShadow: `0 0 25px ${cardFlying.spell.color}99`,
                  zIndex: 100,
                  animation: 'cardFly 0.25s ease-in forwards',
                  transform: `translate(${startX - cardSize.w / 2}px, ${startY - cardSize.h / 2}px)`,
                  '--fx': `${endX - startX}px`,
                  '--fy': `${endY - startY}px`,
                } as React.CSSProperties}
              >
                {cardFlying.spell.emoji}
              </div>
            );
          })()}
          {gameState.gameOver && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
              animation: 'fadeIn 0.4s ease-out',
            }}>
              <div style={{
                fontSize: canvasSize.width < 768 ? 32 : 52,
                fontWeight: 'bold',
                color: '#FFD700',
                textShadow: '0 0 30px rgba(255, 215, 0, 0.6)',
                marginBottom: 24,
                textAlign: 'center',
              }}>
                {gameState.winner === null ? '🤝 平局！' : `🏆 ${gameState.players[gameState.winner].name} 获胜！`}
              </div>
              <button
                onClick={onReset}
                onMouseEnter={(e) => e.currentTarget.style.background = '#66BB6A'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
                style={{
                  padding: '14px 48px',
                  fontSize: canvasSize.width < 768 ? 16 : 22,
                  background: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                  transition: 'all 0.3s ease',
                }}
              >
                🔄 重新开始
              </button>
            </div>
          )}
        </div>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {currentHand.map((spell, i) =>
              renderCard(spell, i, currentHand.length, true)
            )}
          </div>
        </div>
        {isCurrentPlayerFrozen && !gameState.gameOver && (
          <div style={{
            position: 'absolute',
            top: canvasSize.height + 10,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 191, 255, 0.2)',
            border: '2px solid #00BFFF',
            padding: '8px 24px',
            borderRadius: 8,
            color: '#87CEEB',
            fontSize: 16,
            fontWeight: 'bold',
          }}>
            ❄️ {gameState.players[gameState.currentPlayer].name} 被冰冻，跳过回合...
          </div>
        )}
      </div>
      <div style={{
        marginTop: 20,
        width: canvasSize.width,
        maxWidth: '100%',
        maxHeight: 120,
        overflowY: 'auto',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        lineHeight: 1.7,
        color: '#b0b0b0',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {gameState.actionLog.slice(-6).map((log, i) => (
          <div key={i} style={{ opacity: 0.5 + (i / 6) * 0.5 }}>
            ▸ {log}
          </div>
        ))}
      </div>
    </div>
  );
};
