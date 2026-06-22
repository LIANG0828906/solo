import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useRecipeStore } from '@/store';
import type { Comment } from '@/types';

interface CommentRatingPanelProps {
  recipeId: string;
  stepId: string;
  comments: Comment[];
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;

  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

const CommentRatingPanel: React.FC<CommentRatingPanelProps> = ({ recipeId, stepId, comments }) => {
  const [nickname, setNickname] = useState('匿名厨师');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const addComment = useRecipeStore((s) => s.addComment);

  const handleSubmit = () => {
    if (!text.trim()) return;
    addComment(recipeId, stepId, { nickname: nickname.trim() || '匿名厨师', text: text.trim(), rating });
    setText('');
    setRating(0);
  };

  const showSubmit = textareaFocused || text.length > 0;

  return (
    <div className="comment-rating-panel">
      {comments.length === 0 ? (
        <div className="comment-empty">暂无评论，来抢沙发吧~</div>
      ) : (
        <div className="comment-list">
          {comments.map((c) => (
            <div className="comment-item" key={c.id}>
              <div
                className="comment-item__avatar"
                style={{ backgroundColor: c.avatar }}
              >
                {c.nickname.charAt(0)}
              </div>
              <div>
                <div className="comment-item__nickname">{c.nickname}</div>
                <div className="comment-item__rating">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      fill={s <= c.rating ? '#ffb300' : 'none'}
                      color={s <= c.rating ? '#ffb300' : '#bdbdbd'}
                    />
                  ))}
                </div>
                <div className="comment-item__text">{c.text}</div>
                <div className="comment-item__time">{formatRelativeTime(c.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="comment-input">
        <input
          className="comment-input__nickname"
          placeholder="你的昵称"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <div className="comment-input__rating">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className="comment-input__star"
              size={24}
              data-active={s <= rating ? 'true' : 'false'}
              fill={s <= rating ? '#ffb300' : 'none'}
              color={s <= rating ? '#ffb300' : '#bdbdbd'}
              onClick={() => setRating(s)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
        <textarea
          className="comment-input__textarea"
          placeholder="分享你的想法..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setTextareaFocused(true)}
          onBlur={() => setTextareaFocused(false)}
        />
        {showSubmit && (
          <button className="comment-input__submit" onClick={handleSubmit}>
            发表
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentRatingPanel;
