import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Idea } from '../types';
import { truncate } from '../utils/format';
import styles from './创意卡片组件.module.css';

interface IdeaCardProps {
  idea: Idea;
  index: number;
  searchQuery?: string;
  onClick: () => void;
}

const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="highlight">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, index, searchQuery = '', onClick }) => {
  const voteProgress = idea.totalVoters > 0 ? (idea.votes / idea.totalVoters) * 100 : 0;

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={onClick}
    >
      {idea.status === 'converted' && (
        <div className={styles.cornerBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
          任务已创建
        </div>
      )}

      <h3 className={styles.title}>
        {highlightText(idea.title, searchQuery)}
      </h3>

      <p className={styles.description}>
        {highlightText(truncate(idea.description, 100), searchQuery)}
      </p>

      <div className={styles.tags}>
        {idea.tags.map((tag, i) => (
          <span
            key={i}
            className={styles.tag}
            style={{ backgroundColor: tag.color + '33', color: tag.color, border: `1px solid ${tag.color}55' }}
          >
            {highlightText(tag.name, searchQuery)}
          </span>
        ))}
      </div>

      <div className={styles.metaRow}>
        <div className={styles.author}>
          <img src={idea.authorAvatar} alt={idea.authorName} className={styles.avatar} />
          <span className={styles.authorName}>{idea.authorName}</span>
        </div>
        <div className={styles.likes}>
          <Heart size={14} fill="currentColor" />
          {idea.likes}
        </div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${voteProgress}%` }} />
      </div>

      <div className={styles.voteInfo}>
        <span className={styles.voteCount}>{idea.votes} 票</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MessageCircle size={12} />
          {idea.commentCount}
        </span>
      </div>
    </div>
  );
};

export default IdeaCard;
