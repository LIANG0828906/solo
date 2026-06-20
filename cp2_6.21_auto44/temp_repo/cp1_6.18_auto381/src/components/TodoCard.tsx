import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import type { Todo, Meeting } from '@/hooks/useMeetingStore';
import { cn } from '@/lib/utils';

interface TodoCardProps {
  todo: Todo;
  meeting?: Meeting;
  className?: string;
  style?: React.CSSProperties;
  onStatusChange?: () => void;
}

const statusConfig = {
  'todo': {
    label: '待办',
    className: 'bg-primary/10 text-primary-dark border-primary/20',
    nextStatus: 'in-progress' as const,
  },
  'in-progress': {
    label: '进行中',
    className: 'bg-secondary/20 text-secondary-dark border-secondary/30',
    nextStatus: 'done' as const,
  },
  'done': {
    label: '已完成',
    className: 'bg-green-100 text-green-700 border-green-200',
    nextStatus: 'todo' as const,
  },
};

export function TodoCard({ todo, meeting, className, style, onStatusChange }: TodoCardProps) {
  const config = statusConfig[todo.status];

  const handleStatusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStatusChange?.();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link
      to={meeting ? `/meeting/${todo.meetingId}` : '#'}
      style={style}
      className={cn(
        'group block bg-background-card rounded-xl p-4 border border-primary/10',
        'transition-all duration-200 hover:shadow-md hover:border-primary/20',
        'animate-scale-in',
        todo.status === 'done' && 'opacity-70',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium mb-2 leading-relaxed',
              todo.status === 'done'
                ? 'text-text-muted line-through'
                : 'text-text'
            )}
          >
            {todo.description}
          </p>

          <button
            onClick={handleStatusClick}
            type="button"
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
              'transition-all duration-200 hover:scale-105 active:scale-95',
              config.className
            )}
          >
            {config.label}
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        {meeting && (
          <div className="flex flex-col items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
              {meeting.title.charAt(0)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-primary/5 flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(todo.updatedAt)}</span>
        </div>

        {meeting && (
          <span className="truncate max-w-[120px] text-text-muted group-hover:text-primary transition-colors">
            {meeting.title}
          </span>
        )}
      </div>
    </Link>
  );
}
