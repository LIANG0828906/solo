import React, { useState } from 'react';
import { Heart, MessageSquare, Clock } from 'lucide-react';
import type { Comment } from '../types';
import { formatTime } from '../utils/format';
import styles from './评论时间线.module.css';

interface CommentTimelineProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
  onLikeComment: (commentId: string) => void;
  onReplyComment: (commentId: string, content: string) => void;
  onLikeReply?: (commentId: string) => void;
}

const CommentTimeline: React.FC<CommentTimelineProps> = ({
  comments,
  onAddComment,
  onLikeComment,
  onReplyComment,
}) => {
  const [newComment, setNewComment] = useState('');
  const [shake, setShake] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    onAddComment(newComment.trim());
    setNewComment('');
  };

  const handleReplySubmit = (commentId: string) => {
    if (!replyContent.trim()) return;
    onReplyComment(commentId, replyContent.trim());
    setReplyContent('');
    setReplyingTo(null);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${styles.commentItem} ${isReply ? '' : styles.newComment}`}>
      <img
        src={comment.userAvatar}
        alt={comment.userName}
        className={`${styles.avatar} ${isReply ? styles.smallAvatar : ''}`}
      />
      <div className={styles.commentContent}>
        <div className={styles.commentHeader}>
          <span className={styles.userName}>{comment.userName}</span>
          {comment.replyTo && (
            <span className={styles.replyTo}>回复 {comment.replyTo}</span>
          )}
          <span className={styles.commentTime}>
            <Clock size={12} /> {formatTime(comment.createdAt)}
          </span>
        </div>
        <p className={styles.commentText}>{comment.content}</p>
        <div className={styles.commentActions}>
          <button
            className={`${styles.actionButton} ${comment.likedByMe ? styles.liked : ''}`}
            onClick={() => onLikeComment(comment.id)}
          >
            <Heart size={14} fill={comment.likedByMe ? 'currentColor' : 'none'} />
            {comment.likes}
          </button>
          {!isReply && (
            <button
              className={styles.actionButton}
              onClick={() => {
                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                setReplyContent('');
              }}
            >
              <MessageSquare size={14} />
              回复
            </button>
          )}
        </div>

        {!isReply && replyingTo === comment.id && (
          <div className={styles.replyInputWrapper}>
            <input
              type="text"
              className={styles.replyInput}
              placeholder={`回复 ${comment.userName}...`}
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleReplySubmit(comment.id);
              }}
              autoFocus
            />
            <div className={styles.replyActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setReplyingTo(null)}
              >
                取消
              </button>
              <button
                className={styles.replySubmitButton}
                onClick={() => handleReplySubmit(comment.id)}
                disabled={!replyContent.trim()}
              >
                发送
              </button>
            </div>
          </div>
        )}

        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className={styles.replies}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.commentsSection}>
      <h3 className={styles.title}>
        <MessageSquare size={20} />
        评论 ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h3>

      <div className={`${styles.commentInputWrapper} ${shake ? styles.shake : ''}`}>
        <textarea
          className={styles.commentInput}
          placeholder="说说你的想法..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
        />
        <div className={styles.submitRow}>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
          >
            发表评论
          </button>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className={styles.emptyComments}>
          暂无评论，来抢沙发吧~
        </div>
      ) : (
        <div className={styles.commentsList}>
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
};

export default CommentTimeline;
