import React, { useState } from 'react';
import { useEditorStore } from '../store';
import type { Comment } from '../../types';

const CommentPanel: React.FC = () => {
  const {
    comments,
    searchQuery,
    setSearchQuery,
    resolveComment,
    replyToComment,
    userName,
  } = useEditorStore();

  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [showReply, setShowReply] = useState<Record<string, boolean>>({});

  const filteredComments = comments.filter(
    (c) =>
      c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.replies.some((r) => r.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleResolve = (commentId: string, resolved: boolean) => {
    resolveComment(commentId, resolved);
  };

  const handleReply = (commentId: string) => {
    const text = replyInput[commentId]?.trim();
    if (text) {
      replyToComment(commentId, text, userName);
      setReplyInput({ ...replyInput, [commentId]: '' });
      setShowReply({ ...showReply, [commentId]: false });
    }
  };

  const toggleReply = (commentId: string) => {
    setShowReply({ ...showReply, [commentId]: !showReply[commentId] });
  };

  return (
    <div className="comment-panel">
      <input
        type="text"
        className="comment-search"
        placeholder="搜索批注..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="comment-list">
        {filteredComments.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px 0', fontSize: '13px' }}>
            暂无批注
          </div>
        ) : (
          filteredComments.map((comment: Comment) => (
            <div
              key={comment.id}
              className={`comment-bubble ${comment.resolved ? 'resolved' : ''}`}
              style={{ borderLeftColor: comment.resolved ? '#B0B0B0' : comment.authorColor }}
            >
              <div className="comment-bubble-header">
                <div className="comment-author">
                  <span
                    className="comment-author-dot"
                    style={{ background: comment.authorColor }}
                  />
                  <span className="comment-author-name">{comment.author}</span>
                </div>
                <span className="comment-time">{formatTime(comment.createdAt)}</span>
              </div>
              <div className="comment-text">{comment.text}</div>

              {comment.replies.length > 0 && (
                <div className="comment-replies">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="reply-item">
                      <div className="reply-author">
                        {reply.author} · {formatTime(reply.createdAt)}
                      </div>
                      <div className="reply-text">{reply.text}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="comment-actions">
                <button
                  className="comment-action-btn"
                  onClick={() => toggleReply(comment.id)}
                >
                  回复
                </button>
                <button
                  className="comment-action-btn"
                  onClick={() => handleResolve(comment.id, !comment.resolved)}
                >
                  {comment.resolved ? '重新打开' : '标记已解决'}
                </button>
              </div>

              {showReply[comment.id] && (
                <div className="reply-input-container">
                  <input
                    type="text"
                    className="reply-input"
                    placeholder="输入回复..."
                    value={replyInput[comment.id] || ''}
                    onChange={(e) =>
                      setReplyInput({ ...replyInput, [comment.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleReply(comment.id);
                      }
                    }}
                  />
                  <button
                    className="reply-send-btn"
                    onClick={() => handleReply(comment.id)}
                  >
                    发送
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentPanel;
