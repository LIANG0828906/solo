import React, { useState } from 'react';
import { CommentType, ReplyType } from '../../store/useStore';
import { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

interface CommentProps {
  comment: CommentType;
  socket: Socket;
  onJumpToLine: (lineNumber: number) => void;
}

const Comment: React.FC<CommentProps> = ({ comment, socket, onJumpToLine }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const currentUser = {
    id: comment.userId,
    name: comment.userName,
    color: comment.userName,
  };

  const handleReply = () => {
    if (!replyText.trim()) return;

    const mentionMatch = replyText.match(/@(\w+)/);
    const mention = mentionMatch ? mentionMatch[1] : undefined;

    const reply: ReplyType = {
      id: uuidv4(),
      userId: comment.userId,
      userName: comment.userName,
      userColor: comment.userColor,
      content: replyText.trim(),
      timestamp: Date.now(),
      mention,
    };

    socket.emit('comment-reply', { commentId: comment.id, reply });
    setReplyText('');
    setShowReplyForm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days < 7) return days + 'd ago';
    return date.toLocaleDateString();
  };

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span key={idx} className="mention">
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div
      className={'comment-card ' + (comment.replies.length > 0 ? 'has-replies' : '')}
      onClick={() => onJumpToLine(comment.lineNumber)}
    >
      <div className="comment-header">
        <div
          className="comment-avatar"
          style={{ backgroundColor: comment.userColor }}
        >
          {comment.userName.charAt(0)}
        </div>
        <div className="comment-meta">
          <div className="comment-author">{comment.userName}</div>
          <div className="comment-timestamp">
            {formatTime(comment.timestamp)} · Line {comment.lineNumber + 1}
          </div>
        </div>
        <span className="comment-line-ref">L{comment.lineNumber + 1}</span>
      </div>
      <div className="comment-content">
        {renderContentWithMentions(comment.content)}
      </div>
      <div className="comment-actions">
        <button
          className="reply-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowReplyForm(!showReplyForm);
          }}
        >
          Reply
        </button>
      </div>

      {showReplyForm && (
        <div className="reply-form" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            className="reply-input"
            placeholder="Write a reply... Use @ to mention"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button className="reply-submit" onClick={handleReply}>
            Send
          </button>
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="replies-list">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="reply-card">
              <div className="reply-header">
                <div
                  className="comment-avatar"
                  style={{
                    width: 20,
                    height: 20,
                    fontSize: 9,
                    backgroundColor: reply.userColor,
                  }}
                >
                  {reply.userName.charAt(0)}
                </div>
                <span className="reply-author">{reply.userName}</span>
                <span className="reply-timestamp">
                  {formatTime(reply.timestamp)}
                </span>
              </div>
              <div className="reply-content">
                {renderContentWithMentions(reply.content)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;


