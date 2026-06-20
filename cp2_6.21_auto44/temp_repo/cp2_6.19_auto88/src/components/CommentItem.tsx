import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { md5 } from '../utils/hash';
import { generateColorFromHash } from '../utils/colorGenerator';
import { socialFeed } from '../module2/socialFeed';
import type { Comment } from '../types';

interface CommentItemProps {
  comment: Comment;
  isOwner: boolean;
  onDelete: (commentId: string) => void;
}

export default function CommentItem({
  comment,
  isOwner,
  onDelete,
}: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const hash = md5(comment.userName);
  const avatarColor = generateColorFromHash(hash);
  const gradient = `linear-gradient(135deg, ${avatarColor}, ${generateColorFromHash(hash.slice(1) + '0')})`;
  const initial = comment.userName.charAt(0).toUpperCase();

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(comment.id);
    }, 200);
  };

  return (
    <div
      className={cn(
        'comment-item',
        isDeleting && 'pointer-events-none'
      )}
      style={{
        animation: isDeleting
          ? 'fadeOutScale 200ms ease-in forwards'
          : undefined,
      }}
    >
      <div
        className="comment-avatar"
        style={{ background: gradient }}
      >
        {initial}
      </div>
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-author">{comment.userName}</span>
          <span className="comment-time">
            {socialFeed.formatTimeAgo(comment.createdAt)}
          </span>
          {isOwner && (
            <button
              type="button"
              onClick={handleDelete}
              className="ml-auto p-1 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
              title="删除评论"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="comment-text">{comment.content}</p>
      </div>
    </div>
  );
}
