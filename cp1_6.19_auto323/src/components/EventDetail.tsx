import React, { useState, useRef, useEffect } from 'react';
import { useStore, getUserId } from '../store';
import { differenceInSeconds, format as fnsFormat, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = differenceInSeconds(now, date);
  if (diffSec > 180) {
    return fnsFormat(date, 'HH:mm');
  }
  return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
}

const EventDetail: React.FC = () => {
  const selectedEvent = useStore((s) => s.selectedEvent);
  const confirmSignUp = useStore((s) => s.confirmSignUp);
  const like = useStore((s) => s.like);
  const addComment = useStore((s) => s.addComment);
  const selectEvent = useStore((s) => s.selectEvent);

  const [commentText, setCommentText] = useState('');
  const [heartAnim, setHeartAnim] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const hasSignedUpRef = useRef(false);

  const event = selectedEvent;

  useEffect(() => {
    hasSignedUpRef.current = false;
  }, [event?.id]);

  useEffect(() => {
    if (hasSignedUpRef.current) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
      hasSignedUpRef.current = false;
    }
  }, [event?.currentParticipants]);

  if (!event) return null;

  const userId = getUserId();
  const isLiked = event.likedBy?.includes(userId) ?? false;
  const isFull = event.currentParticipants >= event.maxParticipants;
  const isSignedUp = event.signedUpUsers?.includes(userId) ?? false;
  const percentage = Math.min(100, (event.currentParticipants / event.maxParticipants) * 100);

  const ratio = event.currentParticipants / event.maxParticipants;
  const r = Math.round(102 + (229 - 102) * ratio);
  const g = Math.round(187 + (57 - 187) * ratio);
  const b = Math.round(106 + (53 - 106) * ratio);
  const progressColor = `rgb(${r},${g},${b})`;

  const handleSignUp = () => {
    confirmSignUp(event.id, event.title);
    hasSignedUpRef.current = true;
  };

  const handleLike = () => {
    like(event.id);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 300);
  };

  const handleComment = () => {
    const text = commentText.trim();
    if (text) {
      addComment(event.id, text);
      setCommentText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComment();
    }
  };

  const sortedComments = [...event.comments].reverse();

  return (
    <div className="event-detail">
      <button
        className="btn-back"
        onClick={() => selectEvent(null)}
        style={{
          background: 'transparent',
          color: '#8D6E63',
          fontSize: '14px',
          marginBottom: '12px',
          padding: '4px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        ← 返回列表
      </button>

      <h2>{event.title}</h2>
      <div className="detail-meta">📅 {event.date} {event.time}</div>
      <div className="detail-meta">📍 {event.location}</div>
      <div className="detail-description">{event.description}</div>

      <div className="progress-section">
        <div className="progress-label">席位使用率</div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${percentage}%`, background: progressColor }}
          />
        </div>
        <div className="progress-stats">
          <span>剩余 {event.maxParticipants - event.currentParticipants} 席</span>
          <span>{event.currentParticipants}/{event.maxParticipants}</span>
        </div>
      </div>

      <div className="signup-section">
        <button
          className="btn-signup"
          disabled={isFull || isSignedUp}
          onClick={handleSignUp}
        >
          {isSignedUp ? '已报名' : isFull ? '已满员' : '立即报名'}
        </button>
        {isFull && !isSignedUp && <p className="full-warning">席位已满，下次请早</p>}
      </div>

      <div className="like-section">
        <button
          className={`btn-like ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <span className={`heart-icon ${heartAnim ? 'pop' : ''}`}>
            {isLiked ? '❤️' : '🤍'}
          </span>
          <span className="like-count">{event.likes}</span>
        </button>
      </div>

      <div className="comments-section">
        <div className="comments-title">评论区（{event.comments.length}）</div>
        <div className="comment-input-row">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value.slice(0, 100))}
            onKeyDown={handleKeyDown}
            maxLength={100}
            placeholder="发表评论..."
          />
          <button className="btn-send" onClick={handleComment}>
            发送
          </button>
        </div>
        <div className="comments-list">
          {sortedComments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-avatar">
                  {comment.avatar || comment.username?.slice(-2) || '?'}
                </div>
                <span className="comment-username">{comment.username}</span>
                <span className="comment-time">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>
              <div className="comment-content">{comment.content}</div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
