import React from 'react';
import type { Comment } from '@/types';

interface CommentTagProps {
  comment: Comment;
}

export const CommentTag: React.FC<CommentTagProps> = ({ comment }) => {
  const isPositive = comment.type === 'positive';

  return (
    <div className="tooltip-wrapper ml-2 inline-block align-middle">
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
          isPositive
            ? 'bg-positive/20 text-positive'
            : 'bg-improvement/20 text-improvement'
        }`}
      >
        {isPositive ? '✓' : '!'}
      </span>
      <div className="tooltip-content max-w-xs whitespace-normal">
        {comment.content}
      </div>
    </div>
  );
};
