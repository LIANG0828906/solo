import { useState } from 'react';
import { ICreative, TYPE_COLORS } from '../types';
import VoteButton from './VoteButton';

interface CreativeCardProps {
  creative: ICreative;
  onVote: () => void;
  onDelete: () => void;
  currentUserId: string;
  hasVoted: boolean;
}

const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;

  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  const hours = String(target.getHours()).padStart(2, '0');
  const minutes = String(target.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const canDelete = (creative: ICreative, currentUserId: string): boolean => {
  if (creative.createdBy !== currentUserId) return false;
  const now = new Date();
  const createdAt = new Date(creative.createdAt);
  const diffMs = now.getTime() - createdAt.getTime();
  const diffMin = diffMs / (1000 * 60);
  return diffMin < 10;
};

const CreativeCard = ({
  creative,
  onVote,
  onDelete,
  currentUserId,
  hasVoted,
}: CreativeCardProps) => {
  const [hovered, setHovered] = useState(false);
  const showDelete = canDelete(creative, currentUserId);
  const typeColor = TYPE_COLORS[creative.type as keyof typeof TYPE_COLORS] || '#999';

  const handleDeleteClick = () => {
    if (!canDelete(creative, currentUserId)) return;
    if (window.confirm('确定要删除这条创意吗？此操作不可撤销。')) {
      onDelete();
    }
  };

  const cardStyle: React.CSSProperties = {
    width: '280px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.85)',
    boxShadow: hovered
      ? '0 8px 24px rgba(0,0,0,0.12)'
      : '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.25s ease',
    transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
    padding: '0',
    marginBottom: '16px',
    breakInside: 'avoid',
    display: 'inline-flex',
    flexDirection: 'column',
    position: 'relative',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    overflow: 'hidden',
  };

  const typeTagStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0',
    left: '0',
    padding: '5px 12px',
    borderRadius: '0 0 4px 0',
    background: typeColor,
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.5px',
    zIndex: 2,
  };

  const contentAreaStyle: React.CSSProperties = {
    padding: '40px 16px 12px 16px',
  };

  const contentStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#333',
    maxHeight: '200px',
    overflowY: 'auto',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  };

  const bottomRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px 12px 16px',
    borderTop: '1px solid rgba(0,0,0,0.06)',
  };

  const authorMetaStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '12px',
  };

  const authorNameStyle: React.CSSProperties = {
    color: '#555',
    fontWeight: 500,
  };

  const timeStyle: React.CSSProperties = {
    color: '#999',
    fontSize: '11px',
  };

  const deleteButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '6px',
    right: '8px',
    width: '24px',
    height: '24px',
    border: 'none',
    background: 'rgba(0,0,0,0.05)',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '14px',
    lineHeight: 1,
    opacity: hovered ? 1 : 0,
    transition: 'all 0.2s',
    zIndex: 3,
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={typeTagStyle}>{creative.type}</span>

      {showDelete && (
        <button
          onClick={handleDeleteClick}
          style={deleteButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(233, 30, 99, 0.1)';
            e.currentTarget.style.color = '#e91e63';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
            e.currentTarget.style.color = '#999';
          }}
          title="删除创意"
        >
          ×
        </button>
      )}

      <div style={contentAreaStyle}>
        <div style={contentStyle}>{creative.content}</div>
      </div>

      <div style={bottomRowStyle}>
        <div style={authorMetaStyle}>
          <span style={authorNameStyle}>{creative.author}</span>
          <span style={timeStyle}>{formatRelativeTime(creative.createdAt)}</span>
        </div>
        <VoteButton voted={hasVoted} voteCount={creative.votes} onVote={onVote} />
      </div>
    </div>
  );
};

export default CreativeCard;
