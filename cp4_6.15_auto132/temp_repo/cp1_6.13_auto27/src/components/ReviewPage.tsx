import React, { useEffect, useState } from 'react';
import type { Deck } from '../types';
import { useReview } from '../hooks/useReview';

interface ReviewPageProps {
  deck: Deck;
  onBack: () => void;
  onUpdateReview: (cardId: string, isCorrect: boolean) => void;
}

interface CountdownDisplayProps {
  days: number;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({ days }) => {
  const [displayDays, setDisplayDays] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const startTime = performance.now();
    const startValue = 0;
    const endValue = days;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOut);
      setDisplayDays(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [days]);

  return <span className="countdown-number">{displayDays}</span>;
};

export const ReviewPage: React.FC<ReviewPageProps> = ({ deck, onBack, onUpdateReview }) => {
  const {
    currentCard,
    isFlipped,
    flipCard,
    handleFeedback,
    progress,
    completedCards,
    totalCards,
    isComplete,
    resetReview,
    lastResult,
  } = useReview(deck, (cardId, isCorrect) => onUpdateReview(cardId, isCorrect));

  if (totalCards === 0) {
    return (
      <div className="review-page">
        <button className="back-btn" onClick={onBack}>
          ← 返回
        </button>
        <div className="review-empty">
          <h2>🎉 太棒了！</h2>
          <p>当前卡片组没有需要复习的卡片</p>
          <button className="btn-primary" onClick={onBack}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="review-page">
        <button className="back-btn" onClick={onBack}>
          ← 返回
        </button>
        <div className="review-complete">
          <h2>🎊 复习完成！</h2>
          <p>你已完成本轮所有卡片的复习</p>
          <p>本次复习：{completedCards} 张卡片</p>
          <div className="complete-actions">
            <button className="btn-primary" onClick={resetReview}>
              再来一轮
            </button>
            <button className="btn-secondary" onClick={onBack}>
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      {lastResult && (
        <div className={`toast ${lastResult.isCorrect ? 'toast-success' : 'toast-error'}`}>
          {lastResult.isCorrect ? '✅ 回答正确！' : '❌ 再想想哦～'}
          <span className="toast-next">
            下次复习：<CountdownDisplay days={lastResult.days} /> 天后
          </span>
        </div>
      )}

      <button className="back-btn" onClick={onBack}>
        ← 返回
      </button>

      <div className="review-header">
        <h2>{deck.name}</h2>
        <p className="review-progress-text">
          {completedCards} / {totalCards}
        </p>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
        <span className="progress-bar-text">{Math.round(progress)}%</span>
      </div>

      <div className="flashcard-container" onClick={flipCard}>
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
          <div className="flashcard-face flashcard-front">
            <span className="card-label">问题</span>
            <div className="card-text">{currentCard?.front}</div>
            <span className="flip-hint">点击翻转 →</span>
          </div>
          <div className="flashcard-face flashcard-back">
            <span className="card-label">答案</span>
            <div className="card-text">{currentCard?.back}</div>
            <span className="flip-hint">← 点击翻转</span>
          </div>
        </div>
      </div>

      <div className="review-actions">
        <button
          className="btn-wrong"
          onClick={e => {
            e.stopPropagation();
            handleFeedback(false);
          }}
          disabled={!isFlipped}
        >
          ❌ 错误
        </button>
        <button
          className="btn-flip"
          onClick={e => {
            e.stopPropagation();
            flipCard();
          }}
        >
          🔄 翻转
        </button>
        <button
          className="btn-correct"
          onClick={e => {
            e.stopPropagation();
            handleFeedback(true);
          }}
          disabled={!isFlipped}
        >
          ✅ 正确
        </button>
      </div>
    </div>
  );
};
