import React from 'react';
import { CommentItem } from '@/types';
import { useStore } from '@/store/useStore';
import { formatRelativeTime } from '@/utils/format';

interface CommentCardProps {
  comment: CommentItem;
}

export function CommentCard({ comment }: CommentCardProps) {
  const theme = useStore((state) => state.theme);
  
  const sentimentColors = {
    positive: '#2ecc71',
    neutral: '#f39c12',
    negative: '#e74c3c',
  };
  
  const barColor = sentimentColors[comment.sentiment];
  
  return (
    <div
      className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
        theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'
      }`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: `linear-gradient(to bottom, ${barColor}, ${barColor}80)` }}
      />
      
      <div className="pl-4 p-4">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs ${
              theme === 'dark' ? 'text-dark-text/60' : 'text-light-text/60'
            }`}
          >
            {formatRelativeTime(comment.createdAt)}
          </span>
          <div className="flex gap-1">
            {comment.tags.map((tag, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-full text-xs ${
                  theme === 'dark'
                    ? 'bg-dark-accent1 text-dark-text'
                    : 'bg-light-accent1/20 text-light-accent1'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <p
          className={`text-sm leading-relaxed ${
            theme === 'dark' ? 'text-dark-text' : 'text-light-text'
          }`}
        >
          {comment.content}
        </p>
        
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs">评分:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((num) => (
              <span
                key={num}
                className={`w-4 h-4 rounded-full ${
                  num <= comment.score
                    ? comment.score <= 2
                      ? 'bg-score-low'
                      : comment.score <= 3
                      ? 'bg-score-mid'
                      : 'bg-score-high'
                    : theme === 'dark'
                    ? 'bg-dark-accent1'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}