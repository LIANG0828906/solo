import React, { useState } from 'react';
import { EmotionRecord, postComment, postHug, fetchComments, Comment } from '../services/apiService';

interface EmotionCardProps {
  record: EmotionRecord;
}

const EMOTION_META: Record<string, { emoji: string; color: string; label: string }> = {
  happy: { emoji: '😊', color: '#FFD93D', label: '开心' },
  calm: { emoji: '😌', color: '#6BCB77', label: '平静' },
  anxious: { emoji: '😰', color: '#4D96FF', label: '焦虑' },
  irritable: { emoji: '😤', color: '#FF6B6B', label: '烦躁' },
  tired: { emoji: '😫', color: '#9B59B6', label: '疲惫' },
};

const EmotionCard: React.FC<EmotionCardProps> = ({ record }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(record.comments || []);
  const [newComment, setNewComment] = useState('');
  const [hugCount, setHugCount] = useState(record.hugs || 0);
  const [hugAnimating, setHugAnimating] = useState(false);

  const meta = EMOTION_META[record.emotion_type] || EMOTION_META.calm;

  const handleHug = async () => {
    setHugAnimating(true);
    try {
      await postHug(record.id);
      setHugCount((c) => c + 1);
    } catch {}
    setTimeout(() => setHugAnimating(false), 200);
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      const c = await postComment(record.id, newComment.trim());
      setComments((prev) => [...prev, c]);
      setNewComment('');
    } catch {}
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      try {
        const data = await fetchComments(record.id);
        setComments(data);
      } catch {}
    }
    setShowComments(!showComments);
  };

  const timeStr = new Date(record.timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="emotion-card">
      <div className="emotion-card-header">
        <span className="emotion-emoji">{meta.emoji}</span>
        <span className="emotion-label" style={{ color: meta.color }}>{meta.label}</span>
        <span className="emotion-time">{timeStr}</span>
      </div>
      {record.note && <p className="emotion-note">{record.note}</p>}
      <div className="emotion-card-actions">
        <button
          className={`hug-btn ${hugAnimating ? 'hug-animating' : ''}`}
          onClick={handleHug}
        >
          ❤️ {hugCount}
        </button>
        <button className="comment-toggle-btn" onClick={handleToggleComments}>
          💬 {comments.length}
        </button>
      </div>
      {showComments && (
        <div className="emotion-comments">
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <span className="comment-author">{c.anonymous_id.slice(0, 6)}</span>
              {c.is_hug ? <span>给了一个拥抱 ❤️</span> : <span>{c.content}</span>}
            </div>
          ))}
          <div className="comment-input-row">
            <input
              type="text"
              maxLength={140}
              placeholder="匿名评论..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            />
            <button className="send-btn" onClick={handleComment}>发送</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionCard;
