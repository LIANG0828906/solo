import { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext, DeckWithCards } from './App';
import {
  Card,
  Rating,
  calculateNextReview,
  getDueCards,
  formatDate,
} from './utils/spacedRepetition';

interface StudySessionProps {
  deck: DeckWithCards;
  onBack: () => void;
}

type StudyMode = 'browse' | 'smart';

export default function StudySession({ deck, onBack }: StudySessionProps) {
  const { updateCard, updateDeck, addLog } = useAppContext();
  const [mode, setMode] = useState<StudyMode>('browse');
  const [browseIndex, setBrowseIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const smartQueue = useMemo(() => {
    return getDueCards(deck.cards);
  }, [deck.id, mode]);

  const [smartQueueLocal, setSmartQueueLocal] = useState<Card[]>(smartQueue);
  const [smartIndex, setSmartIndex] = useState(0);

  useEffect(() => {
    setSmartQueueLocal(smartQueue);
    setSmartIndex(0);
    setFlipped(false);
    setBrowseIndex(0);
  }, [smartQueue.length, mode]);

  const currentCard: Card | null = useMemo(() => {
    if (mode === 'browse') {
      return deck.cards[browseIndex] || null;
    } else {
      return smartQueueLocal[smartIndex] || null;
    }
  }, [mode, browseIndex, smartIndex, smartQueueLocal, deck.cards]);

  const totalCards = mode === 'browse' ? deck.cards.length : smartQueueLocal.length;
  const currentIndex = mode === 'browse' ? browseIndex : smartIndex;

  const goNext = () => {
    setFlipped(false);
    setTimeout(() => {
      if (mode === 'browse') {
        setBrowseIndex((i) => Math.min(i + 1, deck.cards.length - 1));
      } else {
        setSmartIndex((i) => Math.min(i + 1, smartQueueLocal.length - 1));
      }
    }, 150);
  };

  const goPrev = () => {
    setFlipped(false);
    setTimeout(() => {
      if (mode === 'browse') {
        setBrowseIndex((i) => Math.max(i - 1, 0));
      } else {
        setSmartIndex((i) => Math.max(i - 1, 0));
      }
    }, 150);
  };

  const handleRate = (rating: Rating) => {
    if (!currentCard) return;

    const updated = calculateNextReview(currentCard, rating);
    updateCard(deck.id, updated);
    addLog(rating !== 'hard');

    updateDeck(deck.id, {
      lastReviewedAt: formatDate(new Date()),
      reviewCount: deck.reviewCount + 1,
    });

    const nextIndex = smartIndex + 1;

    if (rating === 'hard') {
      setSmartQueueLocal((q) => {
        const next = [...q];
        next.splice(nextIndex, 0, updated);
        return next;
      });
    }

    setFlipped(false);
    setTimeout(() => {
      setSmartIndex(nextIndex);
    }, 150);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  return (
    <div className="study-container">
      <div className="study-header">
        <button className="study-back" onClick={onBack}>
          ← 返回
        </button>
        <div className="study-title">{deck.name}</div>
        <div style={{ width: 60 }} />
      </div>

      {deck.cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">这个卡片集是空的</div>
          <div className="empty-state-desc">请先添加一些卡片再开始学习</div>
          <button className="glass-btn primary" onClick={onBack}>
            返回卡片集
          </button>
        </div>
      ) : mode === 'smart' && smartQueue.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <div className="empty-state-title">太棒了！</div>
          <div className="empty-state-desc">
            今天的智能复习任务已全部完成！可以切换到自由浏览模式继续学习。
          </div>
          <button
            className="glass-btn primary"
            onClick={() => setMode('browse')}
          >
            切换到自由浏览
          </button>
        </div>
      ) : (
        <>
          <div className="study-mode-selector">
            <button
              className={`mode-tab ${mode === 'browse' ? 'active' : ''}`}
              onClick={() => setMode('browse')}
            >
              📖 自由浏览
            </button>
            <button
              className={`mode-tab ${mode === 'smart' ? 'active' : ''}`}
              onClick={() => setMode('smart')}
            >
              🧠 智能测试
            </button>
          </div>

          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-info">
            <span>进度</span>
            <span>
              {Math.min(currentIndex + 1, totalCards)} / {totalCards}
            </span>
          </div>

          {currentCard && (
            <div
              className="flashcard-wrapper"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className={`flashcard ${flipped ? 'flipped' : ''}`}
                onClick={() => setFlipped(!flipped)}
              >
                <div className="flashcard-face flashcard-front">
                  <div className="flashcard-content">{currentCard.front}</div>
                  {mode === 'smart' && !flipped && (
                    <div className="flashcard-hint">点击卡片查看答案</div>
                  )}
                </div>
                <div className="flashcard-face flashcard-back">
                  <div className="flashcard-content">{currentCard.back}</div>
                </div>
              </div>
            </div>
          )}

          {mode === 'browse' ? (
            <div className="study-controls">
              <button
                className="nav-btn"
                onClick={goPrev}
                disabled={currentIndex === 0}
              >
                ←
              </button>
              <button
                className="glass-btn"
                onClick={() => setFlipped(!flipped)}
              >
                {flipped ? '显示正面' : '显示背面'}
              </button>
              <button
                className="nav-btn"
                onClick={goNext}
                disabled={currentIndex >= totalCards - 1}
              >
                →
              </button>
            </div>
          ) : (
            <div className="study-controls">
              {flipped ? (
                <div className="rating-buttons">
                  <button className="rating-btn hard" onClick={() => handleRate('hard')}>
                    😰 困难
                  </button>
                  <button className="rating-btn normal" onClick={() => handleRate('normal')}>
                    🙂 一般
                  </button>
                  <button className="rating-btn easy" onClick={() => handleRate('easy')}>
                    😊 容易
                  </button>
                </div>
              ) : (
                <button
                  className="glass-btn primary"
                  onClick={() => setFlipped(true)}
                  style={{ padding: '14px 40px', fontSize: 16 }}
                >
                  🔄 翻转卡片
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
