import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import GameStats from './GameStats';

const EMOJIS = ['🌟', '🔥', '🌿', '💎', '🎯', '🌈', '⚡', '🦋'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  isShaking: boolean;
  isFlying: boolean;
}

const GameBoard: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [flyingOrder, setFlyingOrder] = useState<number[]>([]);

  const timerRef = useRef<number | null>(null);
  const lockRef = useRef(false);
  const totalPairs = 8;

  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const initGame = useCallback(() => {
    const pairs = [...EMOJIS, ...EMOJIS];
    const shuffled = shuffleArray(pairs);
    const newCards: Card[] = shuffled.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
      isShaking: false,
      isFlying: false,
    }));
    setCards(newCards);
    setFlippedCards([]);
    setMatchedCount(0);
    setCombo(0);
    setMaxCombo(0);
    setTime(0);
    setIsPlaying(false);
    setTotalAttempts(0);
    setCorrectAttempts(0);
    setIsGameOver(false);
    setShowVictory(false);
    setFlyingOrder([]);
    lockRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      timerRef.current = window.setInterval(() => {
        setTime((prev) => prev + 0.1);
      }, 100);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isGameOver]);

  const saveGameRecord = useCallback(async () => {
    const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
    try {
      await axios.post('/api/game/record', {
        time: parseFloat(time.toFixed(1)),
        date: new Date().toISOString(),
        totalPairs,
        correctCount: correctAttempts,
        totalAttempts,
        accuracy: parseFloat(accuracy.toFixed(1)),
        maxCombo,
      });
    } catch (err) {
      console.log('保存记录失败（可能服务器未启动）');
    }
  }, [time, correctAttempts, totalAttempts, maxCombo]);

  useEffect(() => {
    if (matchedCount === totalPairs && totalPairs > 0 && isPlaying) {
      setIsGameOver(true);
      setIsPlaying(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      saveGameRecord();

      const matchedIndices = cards
        .map((c, i) => (c.isMatched ? i : -1))
        .filter((i) => i !== -1);
      const shuffledIndices = shuffleArray(matchedIndices);
      shuffledIndices.forEach((idx, order) => {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) => (i === idx ? { ...c, isFlying: true } : c))
          );
          setFlyingOrder((prev) => [...prev, idx]);
        }, order * 100);
      });

      setTimeout(() => {
        setShowVictory(true);
      }, shuffledIndices.length * 100 + 400);
    }
  }, [matchedCount, cards, isPlaying, saveGameRecord]);

  const handleCardClick = (index: number) => {
    if (lockRef.current) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedCards.length >= 2) return;

    if (!isPlaying) {
      setIsPlaying(true);
    }

    const newCards = cards.map((card, i) =>
      i === index ? { ...card, isFlipped: true } : card
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      setTotalAttempts((prev) => prev + 1);
      const [first, second] = newFlipped;

      if (newCards[first].emoji === newCards[second].emoji) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card, i) =>
              i === first || i === second
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatchedCount((prev) => prev + 1);
          setCorrectAttempts((prev) => prev + 1);
          setCombo((prev) => {
            const newCombo = prev + 1;
            setMaxCombo((max) => Math.max(max, newCombo));
            return newCombo;
          });
          setFlippedCards([]);
          lockRef.current = false;
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card, i) =>
              i === first || i === second
                ? { ...card, isShaking: true }
                : card
            )
          );
        }, 300);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((card, i) =>
              i === first || i === second
                ? { ...card, isFlipped: false, isShaking: false }
                : card
            )
          );
          setCombo(0);
          setFlippedCards([]);
          lockRef.current = false;
        }, 900);
      }
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const cardSize = isMobile ? 60 : 100;
  const gap = isMobile ? 10 : 16;

  const getCardAnimation = (card: Card, index: number): React.CSSProperties => {
    let transform = card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)';

    if (card.isFlying) {
      const centerX = 1.5;
      const centerY = 1.5;
      const col = index % 4;
      const row = Math.floor(index / 4);
      const dx = (col - centerX) * (cardSize + gap);
      const dy = (row - centerY) * (cardSize + gap);
      transform = `translate(${dx}px, ${dy}px) scale(0) rotateY(180deg) rotate(360deg)`;
    }

    return {
      transform,
      transition: card.isFlying
        ? 'transform 0.5s ease-in forwards'
        : card.isShaking
        ? 'none'
        : 'transform 0.5s ease, box-shadow 0.3s ease-out',
      animation: card.isShaking ? 'shake 0.3s ease' : undefined,
    };
  };

  const accuracy = totalAttempts > 0 ? ((correctAttempts / totalAttempts) * 100).toFixed(1) : '0.0';

  return (
    <div style={{
      maxWidth: isMobile ? '320px' : '500px',
      width: '100%',
    }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: rotateY(180deg) translateX(0); }
          20% { transform: rotateY(180deg) translateX(-6px); }
          40% { transform: rotateY(180deg) translateX(6px); }
          60% { transform: rotateY(180deg) translateX(-4px); }
          80% { transform: rotateY(180deg) translateX(4px); }
        }
      `}</style>

      <GameStats
        time={time}
        matchedCount={matchedCount}
        totalPairs={totalPairs}
        combo={combo}
      />

      <div style={{
        background: '#1E293B',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(4, ${cardSize}px)`,
          gridTemplateRows: `repeat(4, ${cardSize}px)`,
          gap: `${gap}px`,
          justifyContent: 'center',
          perspective: '1000px',
        }}>
          {cards.map((card, index) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(index)}
              style={{
                width: `${cardSize}px`,
                height: `${cardSize}px`,
                position: 'relative',
                cursor: card.isMatched || card.isFlying ? 'default' : 'pointer',
                ...getCardAnimation(card, index),
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }}
              onMouseEnter={(e) => {
                if (!card.isFlipped && !card.isMatched && !isMobile) {
                  e.currentTarget.style.transform += ' translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 209, 197, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!card.isFlipped && !card.isMatched && !isMobile) {
                  e.currentTarget.style.transform = e.currentTarget.style.transform.replace(' translateY(-3px)', '');
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                background: '#2D3748',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: card.isMatched
                  ? '0 0 0 3px #4FD1C5, 0 0 20px rgba(79, 209, 197, 0.5)'
                  : '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}>
                <div style={{
                  width: '70%',
                  height: '70%',
                  borderRadius: '12px',
                  background: `
                    repeating-linear-gradient(
                      45deg,
                      #374151,
                      #374151 4px,
                      #2D3748 4px,
                      #2D3748 8px
                    )
                  `,
                  opacity: 0.8,
                }} />
              </div>

              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                background: card.isMatched ? '#4FD1C5' : '#4FD1C5',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '28px' : '44px',
                boxShadow: card.isMatched
                  ? '0 0 0 3px #48BB78, 0 0 24px rgba(72, 187, 120, 0.6)'
                  : '0 4px 12px rgba(79, 209, 197, 0.3)',
              }}>
                {card.emoji}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '20px',
        justifyContent: 'center',
      }}>
        <button
          onClick={initGame}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            color: '#E2E8F0',
            background: '#2D3748',
            transition: 'all 0.2s ease',
            flex: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4A5568')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#2D3748')}
        >
          🔄 开始新游戏
        </button>
        <button
          onClick={async () => {
            try {
              await axios.delete('/api/game/reset');
              alert('进度已重置');
            } catch {
              alert('重置失败（服务器可能未启动）');
            }
          }}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            color: '#E2E8F0',
            background: '#2D3748',
            transition: 'all 0.2s ease',
            flex: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4A5568')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#2D3748')}
        >
          🗑️ 重置进度
        </button>
      </div>

      {showVictory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            background: '#1E293B',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: isMobile ? '320px' : '400px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(79, 209, 197, 0.3)',
            border: '1px solid #4FD1C5',
          }}>
            <div style={{ fontSize: isMobile ? '48px' : '64px', marginBottom: '16px' }}>
              🎉
            </div>
            <h2 style={{
              fontSize: isMobile ? '24px' : '28px',
              color: '#4FD1C5',
              marginBottom: '8px',
            }}>
              恭喜通关！
            </h2>
            <p style={{ color: '#94A3B8', marginBottom: '28px' }}>
              记忆力训练完成
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '28px',
            }}>
              <div style={{
                background: '#1A202C',
                padding: '16px',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>用时</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#4FD1C5' }}>
                  {time.toFixed(1)}s
                </div>
              </div>
              <div style={{
                background: '#1A202C',
                padding: '16px',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>准确率</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#48BB78' }}>
                  {accuracy}%
                </div>
              </div>
              <div style={{
                background: '#1A202C',
                padding: '16px',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>尝试次数</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#E2E8F0' }}>
                  {totalAttempts}
                </div>
              </div>
              <div style={{
                background: '#1A202C',
                padding: '16px',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>最高连击</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#F6AD55' }}>
                  {maxCombo}x
                </div>
              </div>
            </div>
            <button
              onClick={initGame}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600,
                color: '#0F172A',
                background: '#4FD1C5',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#38B2AC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#4FD1C5')}
            >
              再来一局 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
