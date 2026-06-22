import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Memo } from '../App';
import './MemoCard.css';

interface MemoCardProps {
  memo: Memo;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  renderContent: (content: string) => React.ReactNode;
  getPlainText: (content: string) => string;
  isBottom?: boolean;
}

const MemoCard: React.FC<MemoCardProps> = ({ memo, onToggleComplete, onDelete, renderContent, getPlainText, isBottom }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [countdown, setCountdown] = useState<string>('');
  const [isExpiring, setIsExpiring] = useState(false);
  const [hasShaken, setHasShaken] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const now = new Date();
  const dueDate = memo.dueTime ? new Date(memo.dueTime) : null;
  const isExpired = dueDate ? dueDate < now : false;
  const isCompleted = memo.completed;
  const isBottomStyle = isBottom || isCompleted || isExpired;

  useEffect(() => {
    if (!dueDate || isCompleted) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = dueDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown('已过期');
        if (!hasShaken && !isCompleted) {
          setIsExpiring(true);
          setHasShaken(true);
          setTimeout(() => setIsExpiring(false), 1000);
        }
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setCountdown(`${days}天${hours}小时后`);
      } else if (hours > 0) {
        setCountdown(`${hours}小时${minutes}分钟后`);
      } else {
        setCountdown(`${minutes}分钟后`);
      }
      
      if (diff < 1000 * 60 * 30 && diff > 0) {
        setIsExpiring(true);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(timer);
  }, [dueDate, isCompleted, hasShaken]);

  const plainText = getPlainText(memo.content);
  const summary = plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;

  return (
    <div
      className={`memo-card ${isExpanded ? 'expanded' : ''} ${isBottomStyle ? 'bottom-card' : ''} ${isExpiring ? 'expiring' : ''} ${isExpiring && !hasShaken ? 'shake' : ''} fade-in`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="card-header">
        <div className="creator-info">
          <img src={memo.creatorAvatar} alt={memo.creator} className="creator-avatar" />
          <span className="creator-name">{memo.creator}</span>
        </div>
        <button
          className={`complete-btn ${isCompleted ? 'completed' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(memo.id);
          }}
        >
          {isCompleted ? '✓' : ''}
        </button>
      </div>
      
      <h3 className={`card-title ${isCompleted ? 'completed-text' : ''}`}>
        {memo.title}
      </h3>
      
      <div className="card-summary" ref={contentRef}>
        {isExpanded ? renderContent(memo.content) : summary}
      </div>
      
      <div className="card-footer">
        {dueDate && (
          <div className={`countdown ${isExpired ? 'expired' : ''} ${isExpiring ? 'urgent' : ''}`}>
            <span className="countdown-icon">⏰</span>
            <span>{countdown || formatDistanceToNow(dueDate, { addSuffix: true, locale: zhCN })}</span>
          </div>
        )}
        <div className="card-actions">
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(memo.id);
            }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoCard;
