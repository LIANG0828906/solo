import React, { useEffect, useRef, useState, memo } from 'react';
import { Coins } from 'lucide-react';
import type { Task } from '../store';

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

interface TaskCardProps {
  task: Task;
  index?: number;
  onClaim?: (id: string) => void;
  onComplete?: (id: string) => void;
  showActions?: boolean;
  role?: 'browser' | 'claimant' | 'publisher';
  showClaim?: boolean;
}

function TaskCardComponent({
  task,
  index = 0,
  onClaim,
  onComplete,
  showActions = true,
  role = 'browser',
  showClaim,
}: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleClaim = () => {
    if (!onClaim || task.status !== 'open') return;
    if (window.confirm(`确定要认领任务"${task.title}"吗？`)) {
      onClaim(task.id);
    }
  };

  const handleComplete = () => {
    if (!onComplete || task.status !== 'claimed') return;
    if (window.confirm('确定已完成此任务吗？')) {
      onComplete(task.id);
    }
  };

  const isDisabled = task.status !== 'open';
  const descriptionText =
    task.description.length > 80
      ? task.description.slice(0, 80) + '...'
      : task.description;

  const displayClaimBtn =
    (showActions || showClaim) &&
    role === 'browser' &&
    (task.status === 'open' || task.status === 'claimed');

  const displayCompleteBtn =
    showActions && role === 'claimant' && task.status === 'claimed';

  return (
    <div
      ref={cardRef}
      className="fade-in-card"
      style={{
        animationDelay: `${index * 0.1}s`,
        width: 320,
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease',
        opacity: isDisabled ? 0.6 : 1,
        filter: isDisabled ? 'grayscale(30%)' : 'none',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#1E293B',
            lineHeight: 1.4,
          }}
        >
          {task.title}
        </div>

        <div
          style={{
            fontSize: 14,
            color: '#64748B',
            lineHeight: 1.5,
            minHeight: 42,
          }}
        >
          {descriptionText}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Coins size={18} style={{ color: '#F97316' }} />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#F97316',
            }}
          >
            {task.reward}
          </span>
          <span style={{ fontSize: 14, color: '#64748B', marginLeft: 4 }}>
            积分
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              color: '#64748B',
              background: '#F1F5F9',
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            {task.category}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: '#64748B',
            paddingTop: 4,
            borderTop: '1px solid #F1F5F9',
            marginTop: 4,
          }}
        >
          <span>{task.publisherName}</span>
          <span>{formatRelativeTime(task.createdAt)}</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 8,
            gap: 8,
          }}
        >
          {displayClaimBtn && task.status === 'open' && (
            <button
              onClick={handleClaim}
              style={{
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#10B981';
              }}
            >
              认领任务
            </button>
          )}

          {displayClaimBtn && task.status === 'claimed' && (
            <span
              style={{
                background: '#9CA3AF',
                color: 'white',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              已认领
            </span>
          )}

          {displayCompleteBtn && (
            <button
              onClick={handleComplete}
              style={{
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#10B981';
              }}
            >
              标记完成
            </button>
          )}

          {task.status === 'completed' && (
            <span
              style={{
                background: '#F59E0B',
                color: 'white',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              待评价
            </span>
          )}

          {task.status === 'reviewed' && (
            <span
              style={{
                background: '#3B82F6',
                color: 'white',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              已评价
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const TaskCard = memo(TaskCardComponent);
export default TaskCard;
