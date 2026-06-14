import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  points: number;
  deadline: string;
  completed: boolean;
  assigneeId: string;
  description?: string;
}

interface TaskCardProps {
  task: Task;
  assignee: Member | undefined;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
}

const categoryColors: Record<string, string> = {
  '家务': 'bg-green-100 text-green-700',
  '学习': 'bg-blue-100 text-blue-700',
  '运动': 'bg-purple-100 text-purple-700',
  '购物': 'bg-pink-100 text-pink-700',
  '其他': 'bg-gray-100 text-gray-700',
};

function isOverdue(deadline: string, completed: boolean): boolean {
  if (completed) return false;
  return new Date(deadline) < new Date();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '明天';
  if (days < 0) return '已过期';
  if (days <= 7) return `${days}天后`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function TaskCard({ task, assignee, onDragStart, onDragEnd, className }: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const overdue = isOverdue(task.deadline, task.completed);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', task.id);
    if (cardRef.current) {
      e.dataTransfer.setDragImage(cardRef.current, 0, 0);
    }
    onDragStart?.(e, task);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  const categoryColor = categoryColors[task.category] || categoryColors['其他'];

  return (
    <Link to={`/tasks/${task.id}`} className="block">
      <div
        ref={cardRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          'relative overflow-hidden rounded-2xl bg-white p-4',
          'shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
          'transition-all duration-300 ease-out',
          'hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1',
          'cursor-grab active:cursor-grabbing',
          'sm:p-5',
          overdue && 'opacity-60 grayscale',
          task.completed && 'bg-green-50',
          isDragging && [
            'scale-105 rotate-2',
            'shadow-[0_20px_40px_rgba(255,140,66,0.3)]',
            'z-50',
          ],
          className
        )}
        style={{
          transform: isDragging ? 'rotate(2deg) scale(1.05)' : undefined,
          transition: isDragging ? 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
        }}
      >
        {task.completed && (
          <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
            <Check className="h-4 w-4" />
          </div>
        )}

        {overdue && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-600">
            <AlertTriangle className="h-3 w-3" />
            已过期
          </div>
        )}

        <div className="mb-3 flex items-start justify-between gap-2">
          <h3
            className={cn(
              'text-base font-semibold text-gray-800 line-clamp-2 sm:text-lg',
              task.completed && 'text-gray-400 line-through'
            )}
          >
            {task.title}
          </h3>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
              categoryColor
            )}
          >
            {task.category}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
            <Star className="h-3 w-3 fill-current" />
            {task.points}分
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div
            className={cn(
              'flex items-center gap-1 text-xs text-gray-500',
              overdue && 'text-red-500 font-medium'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(task.deadline)}</span>
          </div>

          {assignee && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white',
                  'shadow-sm',
                  assignee.color || 'bg-primary-500'
                )}
                style={{ backgroundColor: assignee.color || undefined }}
              >
                {assignee.avatar ? (
                  <img
                    src={assignee.avatar}
                    alt={assignee.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  assignee.name.charAt(0)
                )}
              </div>
              <span className="hidden text-xs text-gray-500 sm:inline">
                {assignee.name}
              </span>
            </div>
          )}
        </div>

        <div
          className={cn(
            'absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary-400 to-primary-500',
            task.completed && 'from-green-400 to-green-500',
            overdue && 'from-red-300 to-red-400'
          )}
        />
      </div>
    </Link>
  );
}
