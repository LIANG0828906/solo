import { useEffect, useState, useRef } from 'react';
import { useFeedbackStore } from './store/feedbackStore';
import { format } from 'date-fns';
import { EmotionType } from './db';

function App() {
  const {
    feedbacks,
    emotionStats,
    init,
    submitFeedback,
    setEmotion,
    clearAll,
    exportData,
    isLoaded,
  } = useFeedbackStore();

  const [content, setContent] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [statsFlash, setStatsFlash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (isLoaded) {
      setStatsFlash(true);
      const timer = setTimeout(() => setStatsFlash(false), 200);
      return () => clearTimeout(timer);
    }
  }, [emotionStats, isLoaded]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await submitFeedback(content.trim());
    setContent('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleEmotionClick = (id: string, emotion: EmotionType) => {
    setEmotion(id, emotion);
  };

  const handleClearClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmClear = async () => {
    setShowConfirm(false);
    setIsClearing(true);
    await clearAll();
    setTimeout(() => setIsClearing(false), 400);
  };

  const handleCancelClear = () => {
    setShowConfirm(false);
  };

  const total = emotionStats.happy + emotionStats.neutral + emotionStats.sad;
  const getPercent = (count: number) =>
    total === 0 ? 0 : Math.round((count / total) * 100);

  if (!isLoaded) {
    return (
      <div className="app loading">
        <div className="loading-text">加载中...</div>
      </div>
    );
  }

  return (
    <div className={`app ${isClearing ? 'clearing' : ''}`}>
      <div className="header">
        <h1 className="title">匿名反馈</h1>
        <p className="subtitle">说说你的真实想法，完全匿名</p>
      </div>

      <div className="stats-panel">
        <div className="stats-title">情绪统计</div>
        <div className="stats-row">
          <div className="stats-emoji" style={{ color: '#4ECDC4' }}>
            😊
          </div>
          <div className="stats-info">
            <div className="stats-bar-bg">
              <div
                className={`stats-bar ${statsFlash ? 'flash' : ''}`}
                style={{
                  width: `${getPercent(emotionStats.happy)}%`,
                  backgroundColor: '#4ECDC4',
                }}
              />
            </div>
            <span className={`stats-count ${statsFlash ? 'flash-num' : ''}`}>
              {emotionStats.happy} ({getPercent(emotionStats.happy)}%)
            </span>
          </div>
        </div>
        <div className="stats-row">
          <div className="stats-emoji" style={{ color: '#FFD166' }}>
            😐
          </div>
          <div className="stats-info">
            <div className="stats-bar-bg">
              <div
                className={`stats-bar ${statsFlash ? 'flash' : ''}`}
                style={{
                  width: `${getPercent(emotionStats.neutral)}%`,
                  backgroundColor: '#FFD166',
                }}
              />
            </div>
            <span className={`stats-count ${statsFlash ? 'flash-num' : ''}`}>
              {emotionStats.neutral} ({getPercent(emotionStats.neutral)}%)
            </span>
          </div>
        </div>
        <div className="stats-row">
          <div className="stats-emoji" style={{ color: '#FF6584' }}>
            😢
          </div>
          <div className="stats-info">
            <div className="stats-bar-bg">
              <div
                className={`stats-bar ${statsFlash ? 'flash' : ''}`}
                style={{
                  width: `${getPercent(emotionStats.sad)}%`,
                  backgroundColor: '#FF6584',
                }}
              />
            </div>
            <span className={`stats-count ${statsFlash ? 'flash-num' : ''}`}>
              {emotionStats.sad} ({getPercent(emotionStats.sad)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="submit-card">
        <textarea
          ref={textareaRef}
          className="feedback-input"
          placeholder="说说你的真实想法..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
        />
        <button className="submit-btn" onClick={handleSubmit}>
          匿名提交
        </button>
      </div>

      <div className="feedback-stream">
        {feedbacks.length === 0 ? (
          <div className="empty-state">暂无反馈，来说点什么吧～</div>
        ) : (
          feedbacks.map((feedback, index) => (
            <div
              key={feedback.id}
              className="feedback-card"
              style={{
                borderLeftColor: feedback.borderColor,
                animationDelay: `${index * 0.05}s`,
              }}
            >
              <div className="feedback-content">{feedback.content}</div>
              <div className="feedback-footer">
                <span className="feedback-time">
                  {format(feedback.createdAt, 'MM-dd HH:mm')}
                </span>
                <div className="emotion-selector">
                  <button
                    className={`emotion-dot happy ${
                      feedback.emotion === 'happy' ? 'active' : ''
                    }`}
                    onClick={() => handleEmotionClick(feedback.id, 'happy')}
                    disabled={!!feedback.emotion}
                    title="开心"
                  >
                    😊
                  </button>
                  <button
                    className={`emotion-dot neutral ${
                      feedback.emotion === 'neutral' ? 'active' : ''
                    }`}
                    onClick={() => handleEmotionClick(feedback.id, 'neutral')}
                    disabled={!!feedback.emotion}
                    title="一般"
                  >
                    😐
                  </button>
                  <button
                    className={`emotion-dot sad ${
                      feedback.emotion === 'sad' ? 'active' : ''
                    }`}
                    onClick={() => handleEmotionClick(feedback.id, 'sad')}
                    disabled={!!feedback.emotion}
                    title="难过"
                  >
                    😢
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="action-buttons">
        <button className="clear-btn" onClick={handleClearClick}>
          清空所有
        </button>
        <button className="export-btn" onClick={exportData}>
          导出为JSON
        </button>
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={handleCancelClear}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">确认清空</div>
            <div className="modal-content">
              确定要清空所有反馈数据吗？此操作不可撤销。
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={handleCancelClear}>
                取消
              </button>
              <button className="modal-btn confirm" onClick={handleConfirmClear}>
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
