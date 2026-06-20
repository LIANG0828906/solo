import React, { useState } from 'react';
import { differenceInDays, isToday } from 'date-fns';
import type { Card as CardType, Priority } from './types';
import CardDetail from './CardDetail';
import './Card.css';

interface CardProps {
  card: CardType;
  index: number;
  isFiltered: boolean;
  isDragging?: boolean;
  labelColors: string[];
}

const priorityColors: Record<Priority, string> = {
  high: '#FF6B6B',
  medium: '#FFB74D',
  low: '#69F0AE',
};

const Card: React.FC<CardProps> = ({ card, index, isFiltered, isDragging = false, labelColors }) => {
  const [showDetail, setShowDetail] = useState(false);

  const getDaysRemaining = (): number | null => {
    if (!card.dueDate) return null;
    const dueDate = new Date(card.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(dueDate, today);
  };

  const daysRemaining = getDaysRemaining();
  const isUrgent = daysRemaining !== null && daysRemaining < 3 && daysRemaining >= 0;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  const formatDueDate = (): string => {
    if (!card.dueDate) return '';
    const dueDate = new Date(card.dueDate);
    if (isToday(dueDate)) return '今天';
    if (daysRemaining === 1) return '明天';
    if (daysRemaining === -1) return '昨天';
    if (daysRemaining !== null && daysRemaining < 0) return `逾期${Math.abs(daysRemaining)}天`;
    return `剩余${daysRemaining}天`;
  };

  const completedSubtasks = card.subtasks.filter(s => s.completed).length;
  const totalSubtasks = card.subtasks.length;

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging || isFiltered) return;
    e.stopPropagation();
    setShowDetail(true);
  };

  return (
    <React.Fragment>
      <div
        className={`card-item ${isDragging ? 'dragging' : ''} ${isFiltered ? 'filtered' : ''}`}
        style={{
          animationDelay: `${index * 0.05}s`,
        }}
        onClick={handleClick}
      >
        <div className="card-priority-dot" style={{ backgroundColor: priorityColors[card.priority] }} />

        <div className="card-content">
          <h4 className="card-title">{card.title}</h4>

          {labelColors.length > 0 && (
            <div className="card-labels">
              {labelColors.slice(0, 3).map((color, i) => (
                <span
                  key={i}
                  className="card-label-dot"
                  style={{ backgroundColor: color }}
                />
              ))}
              {labelColors.length > 3 && (
                <span className="card-label-more">+{labelColors.length - 3}</span>
              )}
            </div>
          )}

          <div className="card-footer">
            {totalSubtasks > 0 && (
              <div className="card-subtask-progress">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>{completedSubtasks}/{totalSubtasks}</span>
              </div>
            )}

            {card.dueDate && (
              <div className={`card-due-date ${isUrgent ? 'urgent' : ''} ${isOverdue ? 'overdue' : ''}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <span>{formatDueDate()}</span>
              </div>
            )}

            {card.comments.length > 0 && (
              <div className="card-comments-count">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>{card.comments.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDetail && (
        <CardDetail card={card} onClose={() => setShowDetail(false)} />
      )}
    </React.Fragment>
  );
};

export default React.memo(Card);
