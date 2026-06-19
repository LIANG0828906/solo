import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProposalStore } from '../store';
import type { Proposal, VoteType } from '../types';
import './ProposalCard.css';

interface ProposalCardProps {
  proposal: Proposal;
  onDelete?: (id: string) => void;
}

const AnimatedNumber = ({ value, className }: { value: number; className?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    
    setIsAnimating(true);
    const startValue = prevValue.current;
    const endValue = value;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutElastic = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * Math.PI / 2);
      const current = Math.round(startValue + (endValue - startValue) * easeOutElastic);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value]);

  return (
    <span className={`${className || ''} ${isAnimating ? 'animating' : ''}`}>
      {displayValue}
    </span>
  );
};

export const ProposalCard = ({ proposal, onDelete }: ProposalCardProps) => {
  const navigate = useNavigate();
  const { vote, userVotes, togglePin } = useProposalStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const userVote = userVotes[proposal.id] || null;

  const handleVote = (type: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);
    
    const newVote: VoteType = userVote === type ? null : type;
    vote(proposal.id, newVote);
  };

  const handleClick = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const transitionData = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };
      sessionStorage.setItem('cardTransition', JSON.stringify(transitionData));
    }
    navigate(`/proposal/${proposal.id}`);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(proposal.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    setTimeout(() => {
      onDelete?.(proposal.id);
    }, 300);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已通过': return '#1abc9c';
      case '审核中': return '#f39c12';
      case '已关闭': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  return (
    <div
      ref={cardRef}
      className={`proposal-card ${proposal.isPinned ? 'pinned' : ''} ${isRemoving ? 'removing' : ''}`}
      onClick={handleClick}
    >
      {proposal.isPinned && (
        <div className="pin-badge">
          <span className="star-icon">★</span>
          置顶
        </div>
      )}
      
      <div className="card-header">
        <div 
          className="avatar"
          style={{ background: proposal.authorAvatar }}
        >
          {proposal.authorName.charAt(0)}
        </div>
        <div className="author-info">
          <span className="author-name">{proposal.authorName}</span>
          <span className="post-time">{formatDate(proposal.createdAt)}</span>
        </div>
        <span 
          className="category-tag"
          style={{ backgroundColor: getStatusColor(proposal.status) + '20', color: getStatusColor(proposal.status) }}
        >
          {proposal.category}
        </span>
      </div>

      <h3 className="card-title">{proposal.title}</h3>
      <p className="card-summary">{proposal.summary}</p>

      <div className="card-footer">
        <div className="vote-section">
          <button
            className={`vote-btn up-btn ${userVote === 'up' ? 'active' : ''} ${isAnimating && userVote === 'up' ? 'animating' : ''}`}
            onClick={(e) => handleVote('up', e)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            <AnimatedNumber value={proposal.upVotes} className="vote-count" />
          </button>

          <button
            className={`vote-btn down-btn ${userVote === 'down' ? 'active' : ''} ${isAnimating && userVote === 'down' ? 'animating' : ''}`}
            onClick={(e) => handleVote('down', e)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
            </svg>
            <AnimatedNumber value={proposal.downVotes} className="vote-count" />
          </button>
        </div>

        <div className="comment-section">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{proposal.commentCount}</span>
        </div>
      </div>

      <div className="admin-actions">
        <button className="admin-btn pin-btn" onClick={handleTogglePin}>
          {proposal.isPinned ? '取消置顶' : '置顶'}
        </button>
        <button className="admin-btn delete-btn" onClick={handleDelete}>
          删除
        </button>
      </div>
    </div>
  );
};
