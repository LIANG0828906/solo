import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Comment } from '@/types';

interface CommentBubbleProps {
  comment: Comment;
  isAuthor: boolean;
  onDelete: () => void;
}

export default function CommentBubble({
  comment,
  isAuthor,
  onDelete,
}: CommentBubbleProps) {
  const handleDelete = () => {
    if (window.confirm('确定要删除这条评论吗？')) {
      onDelete();
    }
  };

  return (
    <div className="bg-bg-card rounded-xl relative pl-4 py-3 pr-3">
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-accent" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-text-primary">{comment.author}</span>
            <span className="text-text-secondary">
              {format(comment.createdAt, 'yyyy-MM-dd HH:mm')}
            </span>
            {comment.timestamp > 0 && (
              <span className="text-accent text-[10px] bg-accent/10 px-1.5 py-0.5 rounded">
                🎵 {Math.floor(comment.timestamp / 60)}:
                {(comment.timestamp % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-text-primary break-words">
            {comment.content}
          </p>
          {comment.emoji && (
            <div className="mt-1.5 text-base">{comment.emoji}</div>
          )}
        </div>
        {isAuthor && (
          <button
            onClick={handleDelete}
            className={cn(
              'p-1.5 rounded-lg transition-colors flex-shrink-0',
              'text-danger hover:bg-danger/10'
            )}
            title="删除评论"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
