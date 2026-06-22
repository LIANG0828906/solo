import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Card, Difficulty } from '../../types';
import { api } from '../../utils/api';
import './ReviewSession.css';

function ReviewSession() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, easy: 0, medium: 0, hard: 0 });

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    try {
      const data = await api.getDueCards();
      setCards(data);
    } catch (error) {
      console.error('加载待复习卡片失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(true);
  };

  const handleDifficultyRating = async (difficulty: Difficulty) => {
    if (!currentCard) return;

    try {
      await api.reviewCard(currentCard.id, difficulty);
      
      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        easy: prev.easy + (difficulty === 'easy' ? 1 : 0),
        medium: prev.medium + (difficulty === 'medium' ? 1 : 0),
        hard: prev.hard + (difficulty === 'hard' ? 1 : 0)
      }));

      if (currentIndex < cards.length - 1) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 300);
      } else {
        setTimeout(() => {
          alert(`复习完成！\n\n共复习 ${sessionStats.reviewed + 1} 张卡片\n容易: ${sessionStats.easy + (difficulty === 'easy' ? 1 : 0)}\n中等: ${sessionStats.medium + (difficulty === 'medium' ? 1 : 0)}\n困难: ${sessionStats.hard + (difficulty === 'hard' ? 1 : 0)}`);
          navigate('/');
        }, 300);
      }
    } catch (error) {
      console.error('更新复习状态失败:', error);
    }
  };

  const handleSkip = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300);
    }
  };

  const handleEndSession = () => {
    if (confirm('确定要结束复习吗？')) {
      navigate('/');
    }
  };

  const currentCard = cards[currentIndex];

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state glass-card">
          <div className="empty-icon">🎉</div>
          <div className="empty-text">
            太棒了！今天没有需要复习的卡片
          </div>
          <button className="review-btn" onClick={() => navigate('/')}>
            返回卡片列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container review-session">
      <div className="review-header">
        <div className="review-progress">
          进度: {currentIndex + 1} / {cards.length}
        </div>
        <div className="review-session-stats">
          已复习: {sessionStats.reviewed}
        </div>
        <button className="end-btn" onClick={handleEndSession}>
          结束复习
        </button>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      <div className="card-container" onClick={!isFlipped ? handleFlip : undefined}>
        <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
          <div className="flip-card-inner">
            <div className="flip-card-front">
              <div className="card-face-label">问题</div>
              <div className="card-content">
                {currentCard?.front}
              </div>
              <div className="card-hint">
                点击卡片查看答案
              </div>
            </div>
            <div className="flip-card-back">
              <div className="card-face-label">答案</div>
              <div className="card-content">
                {currentCard?.back}
              </div>
              <div className="card-tags">
                {currentCard?.tags.map((tag, index) => (
                  <span key={index} className="tag-chip small">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="difficulty-rating">
          <div className="rating-label">你对这个答案的记忆程度如何？</div>
          <div className="rating-buttons">
            <button
              className="rating-btn easy"
              onClick={() => handleDifficultyRating('easy')}
            >
              <span className="rating-emoji">😊</span>
              <span className="rating-text">EASY</span>
              <span className="rating-desc">完全记得</span>
            </button>
            <button
              className="rating-btn medium"
              onClick={() => handleDifficultyRating('medium')}
            >
              <span className="rating-emoji">🤔</span>
              <span className="rating-text">MEDIUM</span>
              <span className="rating-desc">有点模糊</span>
            </button>
            <button
              className="rating-btn hard"
              onClick={() => handleDifficultyRating('hard')}
            >
              <span className="rating-emoji">😰</span>
              <span className="rating-text">HARD</span>
              <span className="rating-desc">完全忘记</span>
            </button>
          </div>
          <button className="skip-btn" onClick={handleSkip}>
            跳过这张
          </button>
        </div>
      )}
    </div>
  );
}

export default ReviewSession;
