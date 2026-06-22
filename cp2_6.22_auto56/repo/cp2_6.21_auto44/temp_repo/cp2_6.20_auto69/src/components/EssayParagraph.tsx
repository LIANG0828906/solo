import React from 'react';
import { CommentTag } from './CommentTag';
import type { Comment } from '@/types';

interface EssayParagraphProps {
  index: number;
  content: string;
  isHighlighted: boolean;
  comments: Comment[];
  onClick: (e: React.MouseEvent) => void;
}

export const EssayParagraph: React.FC<EssayParagraphProps> = ({
  content,
  isHighlighted,
  comments,
  onClick,
}) => {
  return (
    <div
      className={`essay-paragraph ${isHighlighted ? 'highlighted' : ''}`}
      onClick={onClick}
    >
      <p className="font-serif text-base leading-[1.8] text-text-primary text-[18px]">
        {content}
        {comments.map((comment) => (
          <CommentTag key={comment.id} comment={comment} />
        ))}
      </p>
    </div>
  );
};
