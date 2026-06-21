import React, { useState } from 'react';
import { useFeedbackContext, MoodLevel, EfficiencyLevel, ObstacleType } from '@/context/FeedbackContext';

const MOOD_EMOJIS = ['😫', '😟', '😐', '🙂', '😄'];
const OBSTACLE_OPTIONS: { value: ObstacleType; label: string; color: string }[] = [
  { value: null, label: '无阻碍', color: '#10B981' },
  { value: 'dependency', label: '依赖阻塞', color: '#EF4444' },
  { value: 'technical', label: '技术卡点', color: '#F59E0B' },
  { value: 'resource', label: '资源不足', color: '#8B5CF6' },
];

interface FeedbackPanelProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ isMobileOpen, onClose }) => {
  const { addFeedback } = useFeedbackContext();
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [content, setContent] = useState('');
  const [obstacle, setObstacle] = useState<ObstacleType>(null);
  const [efficiency, setEfficiency] = useState<EfficiencyLevel | null>(null);
  const [bouncingMood, setBouncingMood] = useState<MoodLevel | null>(null);

  const contentNearLimit = content.length >= 190;
  const canSubmit = mood !== null && content.trim().length > 0 && efficiency !== null;

  const handleMoodClick = (level: MoodLevel) => {
    setMood(level);
    setBouncingMood(level);
    setTimeout(() => setBouncingMood(null), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || mood === null || efficiency === null) return;

    await addFeedback({
      userName: '我',
      userGroup: 'frontend',
      mood,
      content: content.trim(),
      obstacle,
      efficiency,
    });

    setMood(null);
    setContent('');
    setObstacle(null);
    setEfficiency(null);
    if (isMobileOpen) onClose();
  };

  const obstacleColor = OBSTACLE_OPTIONS.find((o) => o.value === obstacle)?.color || '#10B981';

  return (
    <>
      {isMobileOpen && (
        <div
          className="mobile-overlay"
          onClick={onClose}
        />
      )}
      <aside className={`feedback-panel ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="panel-header">
          <h2>每日站会记录</h2>
          <button className="mobile-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="panel-form">
          <div className="form-section">
            <label className="form-label">今日心情</label>
            <div className="mood-row">
              {MOOD_EMOJIS.map((emoji, idx) => {
                const level = (idx + 1) as MoodLevel;
                const isSelected = mood === level;
                const isBouncing = bouncingMood === level;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`mood-btn ${isSelected ? 'selected' : ''} ${isBouncing ? 'bounce' : ''}`}
                    onClick={() => handleMoodClick(level)}
                    aria-label={`心情等级 ${level}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">工作内容摘要</label>
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 200))}
              placeholder="简要描述今日工作内容..."
              rows={4}
              maxLength={200}
            />
            <div className={`char-count ${contentNearLimit ? 'warning' : ''}`}>
              {content.length}/200
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">今日阻碍</label>
            <select
              className="form-select"
              value={obstacle === null ? 'none' : obstacle}
              onChange={(e) => {
                const val = e.target.value;
                setObstacle(val === 'none' ? null : (val as Exclude<ObstacleType, null>));
              }}
              style={{ borderLeft: `4px solid ${obstacleColor}` }}
            >
              {OBSTACLE_OPTIONS.map((opt) => (
                <option key={opt.value ?? 'none'} value={opt.value ?? 'none'}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label className="form-label">自我效率评分</label>
            <div className="stars-row">
              {[3, 4, 5].map((star) => {
                const level = star as EfficiencyLevel;
                const isActive = efficiency !== null && star <= efficiency;
                return (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setEfficiency(level)}
                    aria-label={`${star}星`}
                  >
                    ★
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className={`submit-btn ${canSubmit ? '' : 'disabled'}`}
            disabled={!canSubmit}
          >
            提交反馈
          </button>
        </form>
      </aside>
    </>
  );
};

export default FeedbackPanel;
