import { useState, useEffect, useRef, useCallback } from 'react';
import { useCardStore } from './store';

export default function ReviewMode() {
  const cards = useCardStore(s => s.cards);
  const reviewLog = useCardStore(s => s.reviewLog);
  const getNextCard = useCardStore(s => s.getNextCard);
  const reviewCard = useCardStore(s => s.reviewCard);
  const getTodayReviewedCount = useCardStore(s => s.getTodayReviewedCount);
  const getStreak = useCardStore(s => s.getStreak);

  const [currentCard, setCurrentCard] = useState<ReturnType<typeof getNextCard>>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [fireworkKey, setFireworkKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevStreakRef = useRef(0);

  const todayReviewed = getTodayReviewedCount();
  const streak = getStreak();
  const totalCards = cards.length;
  const progress = totalCards > 0 ? Math.min(todayReviewed / totalCards, 1) : 0;

  useEffect(() => {
    if (
      (streak === 5 || streak === 10 || streak === 15) &&
      prevStreakRef.current !== streak
    ) {
      setFireworkKey(k => k + 1);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  const drawNext = useCallback(() => {
    const card = getNextCard();
    setCurrentCard(card);
    setShowAnswer(false);
  }, [getNextCard]);

  useEffect(() => {
    drawNext();
  }, []);

  const handleReview = (result: 'remembered' | 'forgot') => {
    if (!currentCard) return;
    reviewCard(currentCard.id, result);
    drawNext();
  };

  useEffect(() => {
    if (fireworkKey === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const particles = Array.from({ length: 20 }, () => ({
      x: cx,
      y: cy,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      size: Math.random() * 4 + 2,
    }));

    const startTime = performance.now();
    let animId: number;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      if (elapsed > 1000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alpha = 1 - elapsed / 1000;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [fireworkKey]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: '#333',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #42A5F5, #7E57C2)',
              borderRadius: '4px',
              transition: 'width 0.3s',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '13px',
            color: '#888',
          }}
        >
          <span>今日已复习 {todayReviewed} / {totalCards} 张</span>
          <span>连续正确 {streak}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      />

      {currentCard ? (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '420px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-16px',
              background: 'rgba(30, 30, 36, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '20px',
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              perspective: '1000px',
              cursor: 'pointer',
              marginBottom: '24px',
            }}
            onClick={() => !showAnswer && setShowAnswer(true)}
          >
            <div
              className={`card-inner${showAnswer ? ' flipped' : ''}`}
              style={{ width: '300px', height: '200px' }}
            >
              <div
                className="card-face"
                style={{
                  background: 'var(--card)',
                  color: 'var(--text)',
                  fontSize: '16px',
                  fontWeight: 500,
                  border: '1px solid #444',
                }}
              >
                <span style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                  点击查看答案
                </span>
                <div style={{ fontSize: '16px' }}>{currentCard.front}</div>
              </div>
              <div
                className="card-face card-face-back"
                style={{
                  background: 'var(--card)',
                  color: 'var(--accent)',
                  fontSize: '16px',
                  border: '1px solid var(--accent)',
                }}
              >
                {currentCard.back}
              </div>
            </div>
          </div>

          {showAnswer && (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <button
                onClick={() => handleReview('remembered')}
                style={{
                  padding: '12px 36px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--accent)',
                  color: '#1E1E24',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'opacity 0.2s',
                }}
              >
                记得
              </button>
              <button
                onClick={() => handleReview('forgot')}
                style={{
                  padding: '12px 36px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#EF5350',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'opacity 0.2s',
                }}
              >
                忘了
              </button>
            </div>
          )}

          {!showAnswer && (
            <p style={{ color: '#555', fontSize: '13px', position: 'relative', zIndex: 1 }}>
              点击卡片查看答案
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 0',
            color: '#666',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>暂无需要复习的卡片</p>
          <p style={{ fontSize: '13px' }}>添加一些卡片，或者稍后再来复习</p>
          <button
            onClick={drawNext}
            style={{
              marginTop: '24px',
              padding: '10px 28px',
              border: '1px solid #444',
              borderRadius: '8px',
              background: 'var(--card)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            重新抽卡
          </button>
        </div>
      )}
    </div>
  );
}
