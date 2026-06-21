import React, { memo } from 'react';
import { Inspiration, TAG_COLORS } from '../types';

interface InspirationCardProps {
  inspiration: Inspiration;
  onClick: (id: string) => void;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getSummary = (content: string, maxLen = 150): string => {
  if (content.length <= maxLen) return content;
  return content.slice(0, maxLen) + '...';
};

const InspirationCardComponent: React.FC<InspirationCardProps> = ({ inspiration, onClick }) => {
  return (
    <div
      className={`inspiration-card status-${inspiration.status}`}
      onClick={() => onClick(inspiration.id)}
    >
      <div className="card-title">{inspiration.title}</div>
      <div className="card-summary">{getSummary(inspiration.content)}</div>
      <div className="card-meta">
        {inspiration.tags.length > 0 && (
          <div className="card-tags">
            {inspiration.tags.map((tag) => (
              <span
                key={tag}
                className="card-tag"
                style={{
                  backgroundColor: TAG_COLORS[tag]
                    ? `${TAG_COLORS[tag]}25`
                    : 'rgba(99, 102, 241, 0.15)',
                  color: TAG_COLORS[tag] || 'var(--accent-primary)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="card-time">{formatDate(inspiration.createdAt)}</div>
      </div>
    </div>
  );
};

const InspirationCard = memo(InspirationCardComponent);

export default InspirationCard;
