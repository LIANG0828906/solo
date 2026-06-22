import React, { useState } from 'react';
import { Comment } from '../types';
import { formatRelativeTime } from '../types';

interface CommentListProps {
  comments: Comment[];
  onAddComment: (content: string, replyTo?: string) => void;
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: (id: string) => void }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReply = () => {
    if (!replyContent.trim()) return;
    onReply(comment.id);
    setReplyContent('');
    setShowReplyInput(false);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <img
          src={comment.avatar}
          alt={comment.username}
          style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#94A3B8', fontSize: '14px' }}>{comment.username}</span>
            <span style={{ color: '#64748B', fontSize: '12px' }}>{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word' }}>
            {comment.content}
          </p>
          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            style={{
              marginTop: '6px',
              padding: '3px 10px',
              borderRadius: '4px',
              border: 'none',
              background: '#334155',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#475569'}
            onMouseLeave={e => e.currentTarget.style.background = '#334155'}
          >
            回复
          </button>

          {showReplyInput && (
            <div style={{ marginTop: '8px' }}>
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="输入回复..."
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '4px',
                  border: '2px solid transparent',
                  background: '#1E293B',
                  color: '#E2E8F0',
                  fontSize: '13px',
                  padding: '8px',
                  outline: 'none',
                  resize: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
                onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
              />
              <button
                onClick={handleSubmitReply}
                style={{
                  marginTop: '4px',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#6366F1',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#4F46E5'}
                onMouseLeave={e => e.currentTarget.style.background = '#6366F1'}
              >
                发送
              </button>
            </div>
          )}

          {comment.replies.length > 0 && (
            <div style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px solid #334155' }}>
              {comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} onReply={onReply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentList({ comments, onAddComment }: CommentListProps) {
  const [newComment, setNewComment] = useState('');

  const totalComments = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0F172A',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #1E293B'
      }}>
        <span style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: 600 }}>
          评论 ({totalComments})
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
        {comments.length === 0 && (
          <p style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
            暂无评论
          </p>
        )}
        {comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={(replyToId) => onAddComment(newComment || ' ', replyToId)}
          />
        ))}
      </div>

      <div style={{ borderTop: '1px solid #1E293B', paddingTop: '12px' }}>
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入评论..."
          style={{
            width: '100%',
            height: '60px',
            borderRadius: '4px',
            border: '2px solid transparent',
            background: '#1E293B',
            color: '#E2E8F0',
            fontSize: '14px',
            padding: '10px',
            outline: 'none',
            resize: 'none',
            transition: 'border-color 0.2s ease',
            fontFamily: 'inherit'
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
          onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
        />
        <button
          onClick={handleSubmit}
          style={{
            marginTop: '8px',
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: 'none',
            background: '#6366F1',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4F46E5'}
          onMouseLeave={e => e.currentTarget.style.background = '#6366F1'}
        >
          发送
        </button>
      </div>
    </div>
  );
}
