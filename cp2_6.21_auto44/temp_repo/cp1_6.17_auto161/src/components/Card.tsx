import React, { useState } from 'react';
import { BrewingRecord, FlavorRating } from '../modules/brewing/BrewingService';
import FlavorRadar from './FlavorRadar';
import { likeRecord, addComment } from '../modules/brewing/BrewingController';
import { useAppStore } from '../store/useAppStore';

interface CardProps {
  record: BrewingRecord;
  compact?: boolean;
  onLikeChange?: () => void;
}

const ROAST_COLOR = {
  浅: '#F5DEB3',
  中: '#CD853F',
  深: '#6B4423',
};

const ROAST_TEXT = {
  浅: '#4A3728',
  中: '#fff',
  深: '#fff',
};

const Card: React.FC<CardProps> = ({ record, compact = false }) => {
  const { likeRecord: storeLike, addCommentToRecord } = useAppStore();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const recordId = record.id || '';

  const handleLike = async () => {
    try {
      const result = await likeRecord(recordId);
      storeLike(recordId, result.likes, result.likedByMe);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const result = await addComment(recordId, commentText.trim());
      addCommentToRecord(recordId, result);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const dateStr = record.createdAt ? record.createdAt.split('T')[0] : '';

  return (
    <div className={`brew-card ${compact ? 'compact' : ''}`}>
      <div className="card-header">
        <span className="origin-tag">{record.origin}</span>
        <span
          className="roast-tag"
          style={{
            background: ROAST_COLOR[record.roastLevel as keyof typeof ROAST_COLOR] || '#D5B48C',
            color: ROAST_TEXT[record.roastLevel as keyof typeof ROAST_TEXT] || '#4A3728',
          }}
        >
          {record.roastLevel}焙
        </span>
      </div>

      <div className="card-bean-name" title={record.beanName}>
        {record.beanName}
      </div>

      {!compact && record.flavor && (
        <div className="card-radar-wrap">
          <FlavorRadar
            flavor={record.flavor as FlavorRating}
            onChange={() => {}}
            size={240}
            interactive={false}
            showLabels={false}
          />
        </div>
      )}

      <div className="card-meta">
        <div className="meta-grid">
          <div className="meta-item">
            <span className="meta-label">研磨</span>
            <span className="meta-value">{record.grindSize}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">水温</span>
            <span className="meta-value">{record.waterTemp}°C</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">粉水比</span>
            <span className="meta-value">{record.ratio}</span>
          </div>
        </div>
      </div>

      <div className="card-extraction">
        <span className="extraction-label">萃取率</span>
        <span className="extraction-num">{record.extractionRate.toFixed(2)}%</span>
      </div>

      {!compact && (
        <>
          <div className="card-actions">
            <button
              type="button"
              className={`action-btn like-btn ${record.likedByMe ? 'liked' : ''}`}
              onClick={handleLike}
            >
              <svg viewBox="0 0 24 24" className="heart-icon" fill={record.likedByMe ? '#E74C3C' : 'none'} stroke={record.likedByMe ? '#E74C3C' : '#BDC3C7'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="action-count">{record.likes || 0}</span>
            </button>

            <button
              type="button"
              className={`action-btn comment-btn ${showComments ? 'active' : ''}`}
              onClick={() => setShowComments(!showComments)}
            >
              <svg viewBox="0 0 24 24" className="bubble-icon" fill="none" stroke="#BDC3C7" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="action-count">{record.comments?.length || 0}</span>
            </button>
          </div>

          {showComments && (
            <div className="comments-section">
              <div className="comments-list">
                {record.comments && record.comments.length > 0 ? (
                  record.comments.map(c => (
                    <div key={c.id} className="comment-item">
                      <span className="comment-user">{c.user}</span>
                      <span className="comment-text">{c.text}</span>
                    </div>
                  ))
                ) : (
                  <div className="comments-empty">暂无评论</div>
                )}
              </div>
              <div className="comment-input-row">
                <input
                  type="text"
                  className="comment-input"
                  placeholder="写下你的评论..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  type="button"
                  className="comment-submit"
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || submitting}
                >
                  发送
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {dateStr && (
        <div className="card-date">{dateStr}</div>
      )}
    </div>
  );
};

export default Card;
