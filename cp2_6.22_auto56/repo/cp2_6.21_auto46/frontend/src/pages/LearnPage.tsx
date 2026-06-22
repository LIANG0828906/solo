import { useEffect, useState } from 'react';
import { useWordStore } from '../stores/wordStore';
import FlashCard from '../components/FlashCard';
import { useNavigate } from 'react-router-dom';
import './LearnPage.css';

function LearnPage() {
  const {
    words,
    currentIndex,
    isLoading,
    fetchWords,
    markWord,
    setCurrentIndex,
    goToNextWord,
    hasMoreWords,
  } = useWordStore();

  const navigate = useNavigate();
  const [studiedCount, setStudiedCount] = useState(0);

  useEffect(() => {
    fetchWords(1, '', 'priority');
    setCurrentIndex(0);
    setStudiedCount(0);
  }, []);

  const handleSwipe = (wordId: number, isMastered: boolean) => {
    markWord(wordId, isMastered);
    setStudiedCount((prev) => prev + 1);
  };

  const handleNext = () => {
    if (hasMoreWords()) {
      goToNextWord();
    }
  };

  const handleGoLibrary = () => {
    navigate('/library');
  };

  if (isLoading && words.length === 0) {
    return (
      <div className="learn-page">
        <div className="learn-loading">
          <div className="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="learn-page">
        <div className="learn-empty card">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-text">你的词库还是空的</div>
          <button className="btn btn-primary" onClick={handleGoLibrary}>
            去添加词汇
          </button>
        </div>
      </div>
    );
  }

  const allDone = currentIndex >= words.length && words.length > 0;

  return (
    <div className="learn-page">
      <div className="learn-header">
        <h1 className="page-title">闪卡学习</h1>
        <div className="learn-stats">
          <span className="stat-badge">今日已学 {studiedCount} 个</span>
        </div>
      </div>

      {allDone ? (
        <div className="learn-complete card">
          <div className="complete-icon">🎉</div>
          <h2 className="complete-title">太棒了！</h2>
          <p className="complete-text">
            你已经完成了本轮 <strong>{words.length}</strong> 个词汇的学习
          </p>
          <div className="complete-actions">
            <button className="btn btn-secondary" onClick={handleGoLibrary}>
              返回词库
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setCurrentIndex(0);
                setStudiedCount(0);
              }}
            >
              再来一轮
            </button>
          </div>
        </div>
      ) : (
        <FlashCard
          words={words}
          currentIndex={currentIndex}
          onSwipe={handleSwipe}
          onNext={handleNext}
        />
      )}

      <div className="learn-tips card">
        <h3 className="tips-title">💡 学习小贴士</h3>
        <ul className="tips-list">
          <li>向右滑动卡片标记"已掌握"</li>
          <li>向左滑动卡片标记"需复习"</li>
          <li>点击卡片可以翻转查看例句</li>
          <li>系统会根据你的标记自动调整复习优先级</li>
        </ul>
      </div>
    </div>
  );
}

export default LearnPage;
