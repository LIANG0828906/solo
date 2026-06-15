import { useState, useEffect } from 'react';
import type { FeedbackRecord, FeedbackType } from '../recipeEngine';
import { updateFeedback } from '../api';

interface FeedbackListProps {
  feedbacks: FeedbackRecord[];
  onFeedbackUpdated?: () => void;
}

const FEEDBACK_META: Record<FeedbackType, { emoji: string; label: string }> = {
  all_eaten: { emoji: '😋', label: '全部吃光' },
  half_left: { emoji: '🍽️', label: '剩一半' },
  quarter_left: { emoji: '🥣', label: '剩四分之一' },
  hardly_eaten: { emoji: '😕', label: '没怎么吃' },
  vomited: { emoji: '😷', label: '呕吐了' },
};

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

export default function FeedbackList({ feedbacks, onFeedbackUpdated }: FeedbackListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (editingId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingId]);

  const handleItemClick = (feedback: FeedbackRecord) => {
    setEditingId(feedback.id);
    setSelectedType(feedback.type);
  };

  const handleSave = async () => {
    if (!editingId || !selectedType) return;

    setIsUpdating(true);
    try {
      await updateFeedback(editingId, selectedType);
      setEditingId(null);
      setSelectedType(null);
      onFeedbackUpdated?.();
    } catch (error) {
      console.error('Failed to update feedback:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setEditingId(null);
    setSelectedType(null);
  };

  const editingFeedback = feedbacks.find((f) => f.id === editingId);

  return (
    <>
      <div className="feedback-list">
        {feedbacks.length === 0 ? (
          <div className="feedback-empty">还没有反馈记录，喂食后可以记录哦～</div>
        ) : (
          feedbacks.map((feedback) => {
            const meta = FEEDBACK_META[feedback.type];
            return (
              <div
                key={feedback.id}
                className="feedback-item"
                onClick={() => handleItemClick(feedback)}
              >
                <span className="feedback-time">{formatTimestamp(feedback.timestamp)}</span>
                <span className="feedback-result">
                  <span>{meta.label}</span>
                  <span className="feedback-emoji" role="img" aria-label={meta.label}>
                    {meta.emoji}
                  </span>
                </span>
              </div>
            );
          })
        )}
      </div>

      {editingId && editingFeedback && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">修改反馈记录</h3>
            <p className="modal-subtitle">{formatTimestamp(editingFeedback.timestamp)}</p>
            <div className="modal-options">
              {(Object.keys(FEEDBACK_META) as FeedbackType[]).map((type) => {
                const meta = FEEDBACK_META[type];
                return (
                  <div
                    key={type}
                    className={`modal-option ${selectedType === type ? 'selected' : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    <span className="modal-option-emoji">{meta.emoji}</span>
                    <span className="modal-option-label">{meta.label}</span>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-primary btn-full" onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? '保存中...' : '保存修改'}
            </button>
            <button className="modal-close" style={{ marginTop: '12px' }} onClick={handleClose}>
              取消
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export { FEEDBACK_META, formatTimestamp };
