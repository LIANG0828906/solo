import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/store';
import { CATEGORY_COLORS, CATEGORY_LABELS, type Card, type MemoryLevel } from '@/types';
import '@/components/ReviewView.css';

const MEMORY_LEVELS: { level: MemoryLevel; label: string; color: string; icon: string }[] = [
  { level: 'forgot', label: '忘记', color: '#e74c3c', icon: '😵' },
  { level: 'hard', label: '困难', color: '#f39c12', icon: '😰' },
  { level: 'normal', label: '正常', color: '#27ae60', icon: '😊' },
  { level: 'easy', label: '轻松', color: '#3498db', icon: '😎' },
];

export default function ReviewView() {
  const { dueCards, loadDueCards, reviewCard } = useStore();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    loadDueCards();
  }, [loadDueCards]);

  const currentCard: Card | undefined = dueCards[currentIndex];

  const handleFlip = useCallback(() => {
    if (flipped || animating) return;
    setAnimating(true);
    setFlipped(true);
    setTimeout(() => setAnimating(false), 400);
  }, [flipped, animating]);

  const handleMemoryLevel = useCallback(
    async (level: MemoryLevel) => {
      if (!currentCard || animating) return;
      setAnimating(true);

      const btn = document.querySelector(`.memory-btn-${level}`);
      if (btn) {
        btn.classList.add(`btn-animate-${level}`);
      }

      await reviewCard(currentCard.id, level);

      setTimeout(() => {
        setFlipped(false);
        setAnimating(false);
        setReviewedCount((c) => c + 1);

        if (currentIndex + 1 >= dueCards.length) {
          setCompleted(true);
        } else {
          setCurrentIndex((i) => i + 1);
        }
      }, 300);
    },
    [currentCard, animating, reviewCard, currentIndex, dueCards.length]
  );

  if (dueCards.length === 0 && !completed) {
    return (
      <div className="review-view">
        <div className="review-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
            返回
          </button>
          <h2>复习模式</h2>
          <div />
        </div>
        <div className="review-empty">
          <p>🎉</p>
          <p>没有需要复习的卡片</p>
          <button className="back-home-btn" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="review-view">
        <div className="review-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
            返回
          </button>
          <h2>复习完成</h2>
          <div />
        </div>
        <div className="review-complete">
          <p className="complete-emoji">🎉</p>
          <p className="complete-text">本次复习完成！</p>
          <p className="complete-count">已复习 {reviewedCount} 张卡片</p>
          <button className="back-home-btn" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-view">
      <div className="review-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          返回
        </button>
        <h2>
          复习模式 {currentIndex + 1} / {dueCards.length}
        </h2>
        <div />
      </div>

      <div className="review-progress-bar">
        <div
          className="review-progress-fill"
          style={{ width: `${((currentIndex) / dueCards.length) * 100}%` }}
        />
      </div>

      {currentCard && (
        <div className="review-card-container">
          <div className={`flip-card ${flipped ? 'flipped' : ''}`}>
            <div className="flip-card-front">
              <div
                className="card-category-tag"
                style={{ backgroundColor: CATEGORY_COLORS[currentCard.category] }}
              >
                {CATEGORY_LABELS[currentCard.category]}
              </div>
              <h3 className="review-card-title">{currentCard.title}</h3>
              <div
                className="review-card-content"
                dangerouslySetInnerHTML={{ __html: currentCard.content }}
              />
              {!flipped && (
                <button className="flip-btn" onClick={handleFlip}>
                  <ChevronRight size={16} />
                  翻转卡片
                </button>
              )}
            </div>
            <div className="flip-card-back">
              <div className="back-prompt">
                <p>回忆一下这张卡片的内容...</p>
                <p className="back-hint">标题: {currentCard.title}</p>
                <p className="back-hint">
                  分类: {CATEGORY_LABELS[currentCard.category]}
                </p>
              </div>
            </div>
          </div>

          {flipped && (
            <div className="memory-buttons">
              {MEMORY_LEVELS.map(({ level, label, color, icon }) => (
                <button
                  key={level}
                  className={`memory-btn memory-btn-${level}`}
                  style={{ '--btn-color': color } as React.CSSProperties}
                  onClick={() => handleMemoryLevel(level)}
                >
                  <span className="memory-icon">{icon}</span>
                  <span className="memory-label">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
