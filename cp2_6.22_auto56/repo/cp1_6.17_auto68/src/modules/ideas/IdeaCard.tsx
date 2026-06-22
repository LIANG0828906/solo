import React, { useState, useRef } from 'react';
import type { Idea } from '../../types';
import { useIdeaStore } from './IdeaStore';

interface IdeaCardProps {
  idea: Idea;
  onScrollToMe?: () => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onScrollToMe }) => {
  const { toggleLike, currentUserId } = useIdeaStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const likeCountRef = useRef<HTMLSpanElement>(null);
  
  const isLiked = idea.likedBy.includes(currentUserId);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    await toggleLike(idea.id);
    setTimeout(() => setIsAnimating(false), 200);
  };

  return (
    <div
      id={`idea-${idea.id}`}
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        breakInside: 'avoid'
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
      }}
      onClick={onScrollToMe}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <img
          src={idea.avatar}
          alt={idea.author}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '2px solid #E74C3C',
            objectFit: 'cover',
            marginRight: '10px'
          }}
        />
        <span style={{ fontSize: '13px', color: '#5A6B7C', fontWeight: 500 }}>
          {idea.author}
        </span>
      </div>

      <h3
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#2C3E50',
          margin: '0 0 8px 0',
          lineHeight: '1.4'
        }}
      >
        {idea.title}
      </h3>

      <p
        style={{
          fontSize: '14px',
          color: '#5A6B7C',
          lineHeight: '1.6',
          margin: '0 0 16px 0'
        }}
      >
        {idea.description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button
          onClick={handleLike}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#F8F9FA';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isLiked ? '#E74C3C' : 'none'}
            stroke={isLiked ? '#E74C3C' : '#5A6B7C'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: 'all 0.2s ease',
              transform: isAnimating ? 'scale(1.3)' : 'scale(1)'
            }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span
            ref={likeCountRef}
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: isLiked ? '#E74C3C' : '#5A6B7C',
              transition: 'all 0.2s ease',
              transform: isAnimating ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            {idea.likes}
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#5A6B7C' }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{idea.commentCount}</span>
        </div>
      </div>
    </div>
  );
};
