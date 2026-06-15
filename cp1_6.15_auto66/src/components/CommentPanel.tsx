import '../styles.css';
import React, { useState, useRef } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';

export interface Comment {
  id: string;
  time: number;
  trackId?: string;
  text: string;
  author: 'creator' | 'viewer';
  createdAt: number;
}

export interface CommentPanelProps {
  isOpen: boolean;
  comments: Comment[];
  readOnly: boolean;
  currentTime?: number;
  onClose: () => void;
  onJumpToTime: (time: number) => void;
  onAddComment?: (time: number, text: string) => void;
  onDeleteComment?: (id: string) => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

export const CommentPanel: React.FC<CommentPanelProps> = ({
  isOpen,
  comments,
  readOnly,
  currentTime = 0,
  onClose,
  onJumpToTime,
  onAddComment,
  onDeleteComment,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!inputText.trim() || !onAddComment) return;
    onAddComment(currentTime, inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteComment?.(id);
  };

  const panelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#e0e0e0',
    fontSize: '16px',
    fontWeight: 600,
  };

  const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#a0a0b8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  };

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const emptyStateStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#a0a0b8',
    fontSize: '14px',
  };

  const cardStyle: React.CSSProperties = {
    background: '#16213e',
    borderRadius: '6px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'filter 0.2s ease',
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  };

  const timeBadgeStyle: React.CSSProperties = {
    background: 'rgba(96, 165, 250, 0.2)',
    color: '#60a5fa',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  };

  const authorBadgeStyle: React.CSSProperties = {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
  };

  const creatorBadgeStyle: React.CSSProperties = {
    ...authorBadgeStyle,
    background: 'rgba(74, 222, 128, 0.2)',
    color: '#4ade80',
  };

  const viewerBadgeStyle: React.CSSProperties = {
    ...authorBadgeStyle,
    background: 'rgba(160, 160, 184, 0.2)',
    color: '#a0a0b8',
  };

  const deleteBtnStyle: React.CSSProperties = {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#a0a0b8',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  };

  const textStyle: React.CSSProperties = {
    color: '#e0e0e0',
    fontSize: '14px',
    lineHeight: 1.5,
    marginBottom: '8px',
    wordBreak: 'break-word',
  };

  const dateStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '12px',
  };

  const inputAreaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    height: '48px',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const sendBtnStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  return (
    <div className={`comment-panel ${isOpen ? 'open' : ''}`} style={panelStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>
          <MessageSquare size={18} />
          <span>批注</span>
        </div>
        <button
          style={closeBtnStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#e0e0e0';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#a0a0b8';
            e.currentTarget.style.background = 'none';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {comments.length === 0 ? (
        <div style={emptyStateStyle}>暂无批注</div>
      ) : (
        <div style={listStyle}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={cardStyle}
              onClick={() => onJumpToTime(comment.time)}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <div style={cardHeaderStyle}>
                <span style={timeBadgeStyle}>{formatTime(comment.time)}</span>
                <span style={comment.author === 'creator' ? creatorBadgeStyle : viewerBadgeStyle}>
                  {comment.author === 'creator' ? '创建者' : '查看者'}
                </span>
                {!readOnly && onDeleteComment && (
                  <button
                    style={deleteBtnStyle}
                    onClick={(e) => handleDelete(e, comment.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ef4444';
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#a0a0b8';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div style={textStyle}>{comment.text}</div>
              <div style={dateStyle}>{formatDate(comment.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {readOnly && onAddComment && (
        <div style={inputAreaStyle}>
          <input
            ref={inputRef}
            type="text"
            style={inputStyle}
            placeholder="在当前时间添加批注..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="btn"
            style={sendBtnStyle}
            onClick={handleSubmit}
            disabled={!inputText.trim()}
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentPanel;
