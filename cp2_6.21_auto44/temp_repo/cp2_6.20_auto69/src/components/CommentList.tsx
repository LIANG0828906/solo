import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { Comment } from '@/types';

interface CommentListProps {
  comments: Comment[];
  onEdit: (comment: Comment) => void;
  onDelete: (id: string) => void;
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  onEdit,
  onDelete,
}) => {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-text-secondary text-sm">
        暂无评语，点击左侧段落添加
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {comments.map((comment, index) => (
        <div
          key={comment.id}
          className={`p-3 ${index % 2 === 0 ? 'bg-bg-panel' : 'bg-bg-alt'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-text-secondary">
                  第 {comment.paragraphIndex + 1} 段
                </span>
                <span
                  className={`px-1.5 py-0.5 text-xs rounded ${
                    comment.type === 'positive'
                      ? 'bg-positive/20 text-positive'
                      : 'bg-improvement/20 text-improvement'
                  }`}
                >
                  {comment.type === 'positive' ? '正面' : '待改进'}
                </span>
              </div>
              <p className="text-sm text-text-primary break-words">
                {comment.content}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(comment)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                title="编辑"
              >
                <Edit2 size={14} className="text-text-secondary" />
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="删除"
              >
                <Trash2 size={14} className="text-red-500" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
