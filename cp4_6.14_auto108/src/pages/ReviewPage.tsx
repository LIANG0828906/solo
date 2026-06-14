import { useState, useEffect } from 'react';
import { useCardStore } from '../store/useCardStore';
import type { Card } from '../types';

const ReviewPage = () => {
  const { getDueCards, updateCardReview } = useCardStore();
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    setLoading(true);
    try {
      const dueCards = await getDueCards();
      setCards(dueCards);
      if (dueCards.length === 0) {
        setFinished(true);
      }
    } catch (error) {
      console.error('Failed to load due cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentCard = cards[currentIndex];
  const total = cards.length;

  const handleSubmitAnswer = () => {
    setShowAnswer(true);
  };

  const handleFeedback = async (remembered: boolean) => {
    if (!currentCard) return;

    try {
      await updateCardReview(currentCard.id, remembered);
    } catch (error) {
      console.error('Failed to update review:', error);
    }

    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer('');
      setShowAnswer(false);
    }
  };

  const handleRestart = async () => {
    setCurrentIndex(0);
    setUserAnswer('');
    setShowAnswer(false);
    setFinished(false);
    await loadDueCards();
  };

  if (loading) {
    return (
      <div className="page-transition page-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="page-transition page-container">
        <div className="review-container">
          <div className="review-card" style={{ textAlign: 'center' }}>
            <div className="empty-state">
              <div className="empty-state-title">
                {total === 0 ? '暂无待复习卡片' : '复习完成！'}
              </div>
              <div className="empty-state-text">
                {total === 0
                  ? '稍后再来看看有没有新的卡片需要复习吧'
                  : `今日已完成 ${total} 张卡片的复习，做得好！`}
              </div>
              {total > 0 && (
                <button
                  className="btn-primary"
                  style={{ marginTop: 24 }}
                  onClick={handleRestart}
                >
                  再来一轮
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition page-container">
      <div className="review-container">
        <div className="review-card">
          <div className="review-progress">
            进度: {currentIndex + 1} / {total}
          </div>
          <div className="review-question">{currentCard?.question}</div>

          {!showAnswer ? (
            <>
              <textarea
                className="review-textarea"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="在此输入你的答案..."
              />
              <div style={{ textAlign: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim()}
                  style={{
                    opacity: userAnswer.trim() ? 1 : 0.5,
                    cursor: userAnswer.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  提交答案
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="review-answer-section">
                <div className="answer-label your-answer">你的答案</div>
                <div className="answer-text">{userAnswer || '（未作答）'}</div>
                <div className="answer-label correct">正确答案</div>
                <div className="answer-text">{currentCard?.answer}</div>
              </div>
              <div className="review-actions">
                <button
                  className="btn-forget"
                  onClick={() => handleFeedback(false)}
                >
                  忘记
                </button>
                <button
                  className="btn-remember"
                  onClick={() => handleFeedback(true)}
                >
                  记住
                </button>
                <span className="progress-text">
                  {currentIndex + 1}/{total}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
