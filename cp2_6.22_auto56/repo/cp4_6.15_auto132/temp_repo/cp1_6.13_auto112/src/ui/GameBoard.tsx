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

const ELEMENT_NAMES_EN: Record<ElementType, string> = {
  fire: 'Fire',
  ice: 'Ice',
  thunder: 'Thunder',
  wind: 'Wind',
};

interface FlyingCardState {
  spell: Spell;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onSpellSelect, onReset, responsive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<AnimationRenderer | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [flyingCard, setFlyingCard] = useState<FlyingCardState | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 500 });
  const [cardSize, setCardSize] = useState({ w: 80, h: 120 });
  const boardRef = useRef<HTMLDivElement>(null);
  const flyingAnimRef = useRef<number>(0);
  const frozenSkipTimerRef = useRef<number | null>(null);

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
    let running = true;
    const loop = () => {
      if (!running) return;
      if (rendererRef.current) {
        rendererRef.current.renderIdleFrame();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => {
      running = false;
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.resize(canvasSize.width, canvasSize.height);
    }
  }, [canvasSize]);

  const getCardPosition = (index: number, total: number): { x: number; y: number } => {
    const totalWidth = total * cardSize.w + (total - 1) * 10;
    const startX = (canvasSize.width - totalWidth) / 2;
    return {
      x: startX + index * (cardSize.w + 10),
      y: canvasSize.height + 180 - cardSize.h - 10,
    };
  };

  const playFlyingAnimation = useCallback((spell: Spell, targetSide: 'left' | 'right', cardIndex: number, totalCards: number) => {
    const fromPos = getCardPosition(cardIndex, totalCards);
    const toX = targetSide === 'left' ? canvasSize.width * 0.25 - cardSize.w / 2 : canvasSize.width * 0.75 - cardSize.w / 2;
    const toY = canvasSize.height * 0.35 - cardSize.h / 2;
    const startX = fromPos.x;
    const startY = fromPos.y;
    const startTime = performance.now();
    const duration = 280;
    setFlyingCard({
      spell,
      fromX: startX,
      fromY: startY,
      toX,
      toY,
      progress: 0,
    });
    const animate = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - t, 3);
      setFlyingCard((prev) => {
        if (!prev) return prev;
        const cx = startX + (toX - startX) * easeOut;
        const cy = startY + (toY - startY) * easeOut - Math.sin(t * Math.PI) * 50;
        return { ...prev, progress: t, fromX: cx, fromY: cy };
      });
      if (t < 1) {
        flyingAnimRef.current = requestAnimationFrame(animate);
      } else {
        const animDuration = rendererRef.current!.getAnimationDuration(spell.element);
        rendererRef.current!.startSpellAnimation(spell.element, targetSide, animDuration, () => {});
        setTimeout(() => {
          setFlyingCard(null);
          setSelectedCardId(null);
        }, 80);
      }
    };
    flyingAnimRef.current = requestAnimationFrame(animate);
  }, [canvasSize, cardSize]);

  useEffect(() => {
    if (gameState.phase === 'animating' && gameState.selectedSpell && rendererRef.current && !flyingCard) {
      const targetSide = gameState.currentPlayer === 0 ? 'right' : 'left';
      const currentHand = gameState.players[gameState.currentPlayer].hand;
      const spellIndex = currentHand.findIndex(s => s.id === gameState.selectedSpell!.id);
      if (spellIndex !== -1) {
        playFlyingAnimation(gameState.selectedSpell, targetSide, spellIndex, currentHand.length);
      }
    }
  }, [gameState.phase, gameState.selectedSpell, flyingCard]);

  useEffect(() => {
    return () => {
      if (frozenSkipTimerRef.current) {
        clearTimeout(frozenSkipTimerRef.current);
      }
    };
  }, []);

  const handleCardClick = useCallback((spell: Spell) => {
    if (gameState.gameOver || gameState.phase !== 'selecting') return;
    if (flyingCard) return;
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.status === 'frozen') return;
    const isOwner = currentPlayer.hand.some(s => s.id === spell.id);
    if (!isOwner) return;
    setSelectedCardId(spell.id);
    onSpellSelect(gameState.currentPlayer, spell.id);
  }, [gameState, onSpellSelect, flyingCard]);

  const isCurrentPlayerFrozen = gameState.players[gameState.currentPlayer].status === 'frozen';
  const canInteract = !gameState.gameOver && gameState.phase === 'selecting' && !isCurrentPlayerFrozen && !flyingCard;

  const renderHpBar = (player: Player, side: 'left' | 'right') => {
    const percent = (player.hp / player.maxHp) * 100;
    const isLow = percent < 30;
    const barStyle: React.CSSProperties = {
      position: 'absolute',
      top: canvasSize.height * 0.08,
      [side]: 20,
      width: Math.min(300, canvasSize.width * 0.3),
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
      transition: 'width 0.4s ease',
      animation: isLow ? 'hpBlink 1s steps(2, end) infinite' : undefined,
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
          fontSize: 18,
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
      background: `linear-gradient(135deg, ${spell.color}, ${spell.color}cc)`,
      boxShadow: isSelected
        ? `0 0 25px 8px ${spell.color}aa, 0 4px 12px #00000033`
        : isHovered && !isDisabled
          ? `0 10px 24px #00000055, 0 0 20px ${spell.color}66`
          : '0 4px 12px #00000033',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease, opacity 0.2s ease',
      transform: isSelected
        ? 'scale(1.08) translateY(-12px)'
        : (isHovered && !isDisabled)
          ? 'scale(1.05) translateY(-8px)'
          : 'scale(1) translateY(0)',
      opacity: isDisabled && !isSelected ? 0.35 : 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: cardSize.h * 0.08,
      color: '#fff',
      textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
      userSelect: 'none',
      border: `2px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.25)'}`,
    };
    const emojiSize = Math.floor(cardSize.w * 0.45);
    return (
      <div
        key={spell.id}
        style={cardStyle}
        onMouseEnter={() => !isDisabled && setHoveredCard(spell.id)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => handleCardClick(spell)}
      >
        <div style={{
          fontSize: cardSize.w * 0.14,
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 1.1,
          letterSpacing: 0.5,
        }}>
          {spell.name}
        </div>
        <div style={{
          fontSize: emojiSize,
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
        }}>
          {spell.emoji}
        </div>
        <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
          <div style={{ fontSize: cardSize.w * 0.2, fontWeight: 'bold' }}>{spell.damage}</div>
          <div style={{ fontSize: cardSize.w * 0.11, opacity: 0.95 }}>{ELEMENT_NAMES[spell.element]}属性</div>
        </div>
      </div>
    );
  };

  const player1 = gameState.players[0];
  const player2 = gameState.players[1];
  const currentHand = gameState.players[gameState.currentPlayer].hand;

  const flyingStyle: React.CSSProperties | null = flyingCard ? {
    position: 'absolute',
    left: flyingCard.fromX,
    top: flyingCard.fromY,
    width: cardSize.w,
    height: cardSize.h,
    borderRadius: 12,
    background: `linear-gradient(135deg, ${flyingCard.spell.color}, ${flyingCard.spell.color}dd)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: cardSize.w * 0.5,
    boxShadow: `0 0 40px 12px ${flyingCard.spell.color}aa, 0 10px 30px rgba(0,0,0,0.5)`,
    zIndex: 500,
    border: `2px solid rgba(255,255,255,0.7)`,
    transform: `scale(${1 + flyingCard.progress * 0.3}) rotate(${(flyingCard.progress) * 360}deg)`,
    opacity: 1 - flyingCard.progress * 0.2,
    pointerEvents: 'none',
    transition: 'none',
  } : null;

  return (
    <div ref={boardRef} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 10px',
      minHeight: '100vh',
    }}>
      <style>{`
        @keyframes hpBlink {
          0%, 49% {
            filter: brightness(1.8);
            box-shadow: inset 0 0 16px rgba(255,255,255,0.3);
          }
          50%, 100% {
            filter: brightness(0.7);
            box-shadow: inset 0 0 0 rgba(255,255,255,0);
          }
        }
        @keyframes pulseGlow {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(255,255,255,0); }
          50% { transform: scale(1.12); box-shadow: 0 0 30px rgba(255,255,255,0.5); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(255,255,255,0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        textAlign: 'center',
        marginBottom: 16,
        animation: 'fadeIn 0.6s ease-out',
      }}>
        <h1 style={{
          fontSize: canvasSize.width < 768 ? 24 : 38,
          background: 'linear-gradient(135deg, #FFD700 0%, #E25822 25%, #C77DFF 50%, #00BFFF 75%, #32CD32 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 10,
          fontWeight: 900,
          letterSpacing: 3,
          filter: 'drop-shadow(0 2px 8px rgba(199,125,255,0.3))',
        }}>
          ✨ ArcaneForge 奥术锻造 ✨
        </h1>
        <div style={{
          display: 'flex',
          gap: canvasSize.width < 768 ? 14 : 32,
          justifyContent: 'center',
          fontSize: canvasSize.width < 768 ? 13 : 17,
          color: '#e0e0e0',
          flexWrap: 'wrap',
        }}>
          <span>回合: <strong style={{ color: '#FFD700', textShadow: '0 0 10px rgba(255,215,0,0.4)' }}>{gameState.round}</strong></span>
          <span>牌组剩余: <strong style={{ color: '#00BFFF', textShadow: '0 0 10px rgba(0,191,255,0.4)' }}>{gameState.deckRemaining}/20</strong></span>
          <span>行动: <strong style={{
            color: gameState.currentPlayer === 0 ? '#ff6b6b' : '#6b9fff',
            textShadow: `0 0 12px ${gameState.currentPlayer === 0 ? 'rgba(255,107,107,0.5)' : 'rgba(107,159,255,0.5)'}`,
          }}>
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
              borderRadius: 14,
              boxShadow: '0 8px 32px #00000055, 0 0 60px rgba(100, 150, 255, 0.12), inset 0 0 60px rgba(0,0,0,0.25)',
              display: 'block',
              border: '1px solid rgba(150,180,255,0.15)',
            }}
          />
          {renderHpBar(player1, 'left')}
          {renderHpBar(player2, 'right')}
          <div style={{
            position: 'absolute',
            left: canvasSize.width * 0.15,
            top: canvasSize.height * 0.3,
            transform: 'translate(-50%, -50%)',
            fontSize: canvasSize.width < 768 ? 36 : 64,
            filter: 'drop-shadow(0 6px 14px rgba(255,100,100,0.5))',
            userSelect: 'none',
            animation: 'fadeIn 1s ease-out',
          }}>
            🧙‍♂️
          </div>
          <div style={{
            position: 'absolute',
            left: canvasSize.width * 0.15,
            top: canvasSize.height * 0.47,
            transform: 'translateX(-50%)',
            fontSize: canvasSize.width < 768 ? 11 : 14,
            color: '#ff9999',
            fontWeight: 600,
            letterSpacing: 1,
            userSelect: 'none',
            opacity: 0.9,
          }}>
            {player1.name}
          </div>
          <div style={{
            position: 'absolute',
            right: canvasSize.width * 0.15,
            top: canvasSize.height * 0.3,
            transform: 'translateX(50%) translateY(-50%)',
            fontSize: canvasSize.width < 768 ? 36 : 64,
            filter: 'drop-shadow(0 6px 14px rgba(100,150,255,0.5))',
            userSelect: 'none',
            animation: 'fadeIn 1s ease-out 0.2s both',
          }}>
            🧙‍♀️
          </div>
          <div style={{
            position: 'absolute',
            right: canvasSize.width * 0.15,
            top: canvasSize.height * 0.47,
            transform: 'translateX(50%)',
            fontSize: canvasSize.width < 768 ? 11 : 14,
            color: '#99bbff',
            fontWeight: 600,
            letterSpacing: 1,
            userSelect: 'none',
            opacity: 0.9,
          }}>
            {player2.name}
          </div>
          <div style={{
            position: 'absolute',
            top: canvasSize.height * 0.3,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: canvasSize.width < 768 ? 16 : 24,
            opacity: 0.3,
            userSelect: 'none',
            letterSpacing: 4,
          }}>
            ⚔️ VS ⚔️
          </div>
          {gameState.gameOver && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.92) 100%)',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
              animation: 'fadeIn 0.5s ease-out',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{
                fontSize: canvasSize.width < 768 ? 36 : 60,
                marginBottom: 8,
                animation: 'fadeIn 0.6s ease-out 0.1s both',
              }}>
                {gameState.winner === null ? '🤝' : '🏆'}
              </div>
              <div style={{
                fontSize: canvasSize.width < 768 ? 26 : 44,
                fontWeight: 'bold',
                color: '#FFD700',
                textShadow: '0 0 40px rgba(255, 215, 0, 0.7), 0 2px 8px rgba(0,0,0,0.8)',
                marginBottom: 28,
                textAlign: 'center',
                letterSpacing: 2,
                animation: 'fadeIn 0.6s ease-out 0.2s both',
              }}>
                {gameState.winner === null ? '平 局' : `${gameState.players[gameState.winner].name} 获胜！`}
              </div>
              <div style={{
                color: '#aaa',
                marginBottom: 24,
                animation: 'fadeIn 0.6s ease-out 0.3s both',
                fontSize: canvasSize.width < 768 ? 13 : 16,
              }}>
                最终血量 — {player1.name}: <span style={{ color: '#ff7777', fontWeight: 'bold' }}>{player1.hp}</span>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                {player2.name}: <span style={{ color: '#77aaff', fontWeight: 'bold' }}>{player2.hp}</span>
              </div>
              <button
                onClick={onReset}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#66BB6A';
                  e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(102, 187, 106, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#4CAF50';
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(76, 175, 80, 0.45)';
                }}
                style={{
                  padding: canvasSize.width < 768 ? '12px 36px' : '16px 56px',
                  fontSize: canvasSize.width < 768 ? 15 : 20,
                  background: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 18px rgba(76, 175, 80, 0.45)',
                  transition: 'all 0.3s cubic-bezier(.34,1.56,.64,1)',
                  letterSpacing: 1,
                  animation: 'fadeIn 0.6s ease-out 0.4s both, slideInUp 0.6s ease-out 0.4s both',
                }}
              >
                🔄 重新开始
              </button>
            </div>
          )}
        </div>
        {flyingCard && flyingStyle && (
          <div style={flyingStyle}>
            {flyingCard.spell.emoji}
          </div>
        )}
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
            top: canvasSize.height + 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(0,191,255,0.22), rgba(0,140,220,0.15))',
            border: '2px solid #00BFFF',
            padding: '10px 28px',
            borderRadius: 10,
            color: '#87CEEB',
            fontSize: canvasSize.width < 768 ? 13 : 16,
            fontWeight: 'bold',
            boxShadow: '0 0 20px rgba(0,191,255,0.3)',
            letterSpacing: 0.5,
            animation: 'fadeIn 0.4s ease-out',
          }}>
            ❄️ {gameState.players[gameState.currentPlayer].name} 被冰冻，自动跳过回合...
          </div>
        )}
      </div>
      <div style={{
        marginTop: 18,
        width: canvasSize.width,
        maxWidth: '100%',
        maxHeight: 130,
        overflowY: 'auto',
        background: 'rgba(255,255,255,0.035)',
        borderRadius: 10,
        padding: 14,
        fontSize: 13,
        lineHeight: 1.8,
        color: '#b0b0b0',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          fontSize: 11,
          letterSpacing: 2,
          color: '#666',
          marginBottom: 6,
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          — 战斗日志 Battle Log —
        </div>
        {gameState.actionLog.slice(-6).map((log, i) => (
          <div
            key={i}
            style={{
              opacity: 0.45 + (i / 6) * 0.55,
              borderLeft: i === 5 ? '2px solid #FFD700' : '2px solid transparent',
              paddingLeft: i === 5 ? 10 : 12,
            }}
          >
            ▸ {log}
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 12,
        width: canvasSize.width,
        maxWidth: '100%',
        fontSize: canvasSize.width < 768 ? 10 : 12,
        color: '#666',
        display: 'flex',
        gap: canvasSize.width < 768 ? 10 : 20,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        <span>🔥 火: 高伤害</span>
        <span>❄️ 冰: 伤害+冻结</span>
        <span>⚡ 雷: 伤害+30%连击</span>
        <span>🌪️ 风: 伤害+吹回手牌</span>
      </div>
    </div>
  );
};
