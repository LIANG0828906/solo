import { useState, useEffect } from 'react';
import axios from 'axios';
import { Word } from '../stores/wordStore';
import FlashCard from '../components/FlashCard';
import './ReviewPage.css';

interface ReviewPlanItem {
  word: Word;
  priority: number;
}

function ReviewPage() {
  const [reviewWords, setReviewWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [mode, setMode] = useState<'list' | 'review'>('list');

  const fetchReviewPlan = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/review-plan', {
        params: { limit: 10 },
      });
      const items: ReviewPlanItem[] = response.data;
      setReviewWords(items.map((item) => item.word));
      setCurrentIndex(0);
      setReviewedCount(0);
    } catch (error) {
      console.error('Failed to fetch review plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewPlan();
  }, []);

  const handleSwipe = async (wordId: number, isMastered: boolean) => {
    try {
      await axios.post('/api/learn', { word_id: wordId, is_mastered: isMastered });
      setReviewWords((prev) =>
        prev.map((w) => {
          if (w.id === wordId) {
            const newMasterCount = isMastered ? w.master_count + 1 : w.master_count;
            const newReviewCount = isMastered ? w.review_count : w.review_count + 1;
            const total = newMasterCount + newReviewCount;
            return {
              ...w,
              master_count: newMasterCount,
              review_count: newReviewCount,
              forgetting_index: total > 0 ? newReviewCount / total : 0,
              last_reviewed_at: new Date().toISOString(),
            };
          }
          return w;
        })
      );
      setReviewedCount((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to mark word:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < reviewWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const startReview = () => {
    setMode('review');
    setCurrentIndex(0);
    setReviewedCount(0);
  };

  const goBackToList = () => {
    setMode('list');
    fetchReviewPlan();
  };

  const getPriorityColor = (priority: number) => {
    if (priority > 0.6) return 'high';
    if (priority > 0.3) return 'medium';
    return 'low';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority > 0.6) return '高优先级';
    if (priority > 0.3) return '中优先级';
    return '低优先级';
  };

  const allDone = currentIndex >= reviewWords.length && reviewWords.length > 0;

  if (isLoading && mode === 'list') {
    return (
      <div className="review-page">
        <div className="learn-loading">
          <div className="loading-spinner"></div>
          <span>加载复习计划中...</span>
        </div>
      </div>
    );
  }

  if (mode === 'list') {
    return (
      <div className="review-page">
        <div className="page-header">
          <h1 className="page-title">今日复习计划</h1>
          {reviewWords.length > 0 && (
            <button className="btn btn-primary" onClick={startReview}>
              开始复习
            </button>
          )}
        </div>

        <div className="review-summary card">
          <div className="summary-item">
            <span className="summary-number">{reviewWords.length}</span>
            <span className="summary-label">待复习词汇</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-item">
            <span className="summary-number">5-10</span>
            <span className="summary-label">每日推荐量</span>
          </div>
        </div>

        {reviewWords.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-text">
              暂无需要复习的词汇，去词库添加一些单词吧！
            </div>
          </div>
        ) : (
          <div className="review-list">
            {reviewWords.map((word, index) => (
              <div key={word.id} className="review-item card">
                <div className="review-rank">{index + 1}</div>
                <div className="review-item-content">
                  <div className="review-word-header">
                    <span className="review-word">{word.word}</span>
                    <span
                      className={`priority-tag priority-${getPriorityColor(
                        word.forgetting_index
                      )}`}
                    >
                      {getPriorityLabel(word.forgetting_index)}
                    </span>
                  </div>
                  <div className="review-definition">{word.definition}</div>
                  <div className="review-stats">
                    <span>遗忘指数: {Math.round(word.forgetting_index * 100)}%</span>
                    <span>复习次数: {word.review_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="review-header">
        <button className="back-btn" onClick={goBackToList}>
          ← 返回列表
        </button>
        <h1 className="page-title">复习中</h1>
        <div className="review-progress">
          {currentIndex + (allDone ? 0 : 1)} / {reviewWords.length}
        </div>
      </div>

      {allDone ? (
        <div className="learn-complete card">
          <div className="complete-icon">🏆</div>
          <h2 className="complete-title">复习完成！</h2>
          <p className="complete-text">
            你已完成今天的 <strong>{reviewWords.length}</strong> 个词汇复习
          </p>
          <div className="complete-actions">
            <button className="btn btn-secondary" onClick={goBackToList}>
              返回列表
            </button>
            <button className="btn btn-primary" onClick={startReview}>
              再复习一遍
            </button>
          </div>
        </div>
      ) : (
        <FlashCard
          words={reviewWords}
          currentIndex={currentIndex}
          onSwipe={handleSwipe}
          onNext={handleNext}
        />
      )}
    </div>
  );
}

export default ReviewPage;
