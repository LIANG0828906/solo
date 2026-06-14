import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Link } from 'react-router-dom';
import { Check, Clock, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import MemberAvatar from './MemberAvatar';
import type { Task, Member, Category } from '@/types';

interface TaskCardProps {
  task: Task;
  assignee: Member | undefined;
  category: Category | undefined;
  onComplete?: (taskId: string) => void;
  className?: string;
}

function isOverdue(deadline: string, status: string): boolean {
  if (status !== 'pending') return false;
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

function getCountdown(deadline: string): string {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();

  if (diff <= 0) return '已过期';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes}分`;
  return `${minutes}分钟`;
}

export default function TaskCard({
  task,
  assignee,
  category,
  onComplete,
  className,
}: TaskCardProps) {
  const [countdown, setCountdown] = useState(getCountdown(task.deadline));
  const [isCompleting, setIsCompleting] = useState(false);
  const [showPetals, setShowPetals] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: task.status === 'completed',
  });

  useEffect(() => {
    if (task.status !== 'pending') return;

    const timer = setInterval(() => {
      setCountdown(getCountdown(task.deadline));
    }, 60000);

    return () => clearInterval(timer);
  }, [task.deadline, task.status]);

  const overdue = isOverdue(task.deadline, task.status);

  const handleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (task.status === 'completed' || isCompleting) return;

    setIsCompleting(true);
    setShowPetals(true);

    try {
      await onComplete?.(task.id);
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setTimeout(() => {
        setIsCompleting(false);
        setShowPetals(false);
      }, 2000);
    }
  };

  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) ${
          isDragging ? 'scale(1.05) rotate(2deg)' : ''
        }`,
        transition: isDragging
          ? 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          : 'transform 0.3s ease',
        zIndex: isDragging ? 50 : 'auto',
      }
    : undefined;

  const categoryColor = category?.color || '#9CA3AF';

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white p-4',
        'shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
        'transition-all duration-300 ease-out',
        'hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1',
        'cursor-grab active:cursor-grabbing',
        'sm:p-5',
        'w-full',
        overdue && 'opacity-60 grayscale',
        task.status === 'completed' && 'bg-green-50',
        isDragging && [
          'shadow-[0_20px_40px_rgba(255,140,66,0.3)]',
          'opacity-90',
        ],
        className
      )}
    >
      {showPetals && <PetalEffect />}

      {isCompleting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg
              className="h-20 w-20 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                className="animate-draw-check"
                d="M5 12l5 5L20 7"
                strokeDasharray="24"
                strokeDashoffset="24"
                style={{ animation: 'drawCheck 0.5s ease forwards' }}
              />
            </svg>
          </div>
        </div>
      )}

      {task.status === 'completed' && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-md z-10">
          <Check className="h-4 w-4" />
        </div>
      )}

      {overdue && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-600 z-10">
          <AlertTriangle className="h-3 w-3" />
          已过期
        </div>
      )}

      <div className="mb-3 flex items-start justify-between gap-2">
        <h3
          className={cn(
            'text-base font-semibold text-gray-800 line-clamp-2 sm:text-lg pr-8',
            task.status === 'completed' && 'text-gray-400 line-through'
          )}
        >
          {task.title}
        </h3>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: categoryColor }}
        >
          {category?.name || '其他'}
        </span>

        <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
          <Star className="h-3 w-3 fill-current" />
          {task.points}分
        </span>

        <span className="inline-flex items-center rounded-full bg-warmGray-100 px-2.5 py-1 text-xs font-medium text-warmGray-600">
          {task.cycle === 'daily' ? '每日' : '每周'}
        </span>
      </div>

      {task.status === 'pending' && (
        <div className="mb-3 text-xs text-gray-500">
          <span className="font-medium text-primary-600">倒计时：</span>
          {countdown}
        </div>
      )}

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

        <div className="flex items-center gap-2">
          {assignee && (
            <div className="flex items-center gap-2">
              <MemberAvatar name={assignee.name} avatar={assignee.avatar} size="sm" />
              <span className="hidden text-xs text-gray-500 sm:inline">
                {assignee.name}
              </span>
            </div>
          )}

          {task.status === 'pending' && !assignee && (
            <span className="text-xs text-gray-400">待分配</span>
          )}
        </div>
      </div>

      {task.status === 'pending' && (
        <button
          onClick={handleComplete}
          className={cn(
            'mt-4 w-full py-2 rounded-xl font-medium text-sm',
            'bg-gradient-to-r from-green-500 to-green-400 text-white',
            'shadow-md shadow-green-200',
            'transition-all duration-200',
            'hover:shadow-lg hover:shadow-green-300',
            'active:scale-95',
            'overflow-hidden relative',
            'group'
          )}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Check className="h-4 w-4" />
            完成任务
          </span>
          <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      )}

      <div
        className={cn(
          'absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary-400 to-primary-500',
          task.status === 'completed' && 'from-green-400 to-green-500',
          overdue && 'from-red-300 to-red-400'
        )}
      />
    </div>
  );
}

function PetalEffect() {
  const petals = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1,
    size: 6 + Math.random() * 8,
    color: ['#FF8C42', '#FFD199', '#FFA333', '#FFB86C', '#FFE4B5'][Math.floor(Math.random() * 5)],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute rounded-full"
          style={{
            left: `${petal.left}%`,
            top: '-20px',
            width: `${petal.size}px`,
            height: `${petal.size}px`,
            backgroundColor: petal.color,
            animation: `petalFall ${petal.duration}s ease-in ${petal.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes petalFall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(300px) rotate(360deg) scale(0.5);
            opacity: 0;
          }
        }
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
