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
  const [showConfirm, setShowConfirm] = useState(false);

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
    setShowConfirm(true);
  };

  const confirmClaim = () => {
    setShowConfirm(false);
    if (onClaim) onClaim(task.id);
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
    <>
      <div
        ref={cardRef}
        className={`fade-in-card task-card ${isDisabled ? 'task-card-disabled' : ''}`}
        style={{
          animationDelay: `${index * 0.1}s`,
          opacity: isVisible ? undefined : 0,
        }}
      >
        <div className="task-card-inner">
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
              <button className="claim-btn" onClick={handleClaim}>
                认领任务
              </button>
            )}

            {displayClaimBtn && task.status === 'claimed' && (
              <span className="status-badge-claimed">已认领</span>
            )}

            {displayCompleteBtn && (
              <button className="claim-btn" onClick={handleComplete}>
                标记完成
              </button>
            )}

            {task.status === 'completed' && (
              <span className="status-badge-completed">待评价</span>
            )}

            {task.status === 'reviewed' && (
              <span className="status-badge-reviewed">已评价</span>
            )}
          </div>
        </div>
      </div>

      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.31)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              minWidth: 320,
              maxWidth: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1E293B', marginBottom: 12 }}>
              确认认领
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>
              确定要认领任务「{task.title}」吗？
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  background: 'white',
                  color: '#64748B',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
              >
                取消
              </button>
              <button
                onClick={confirmClaim}
                className="claim-btn"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const TaskCard = memo(TaskCardComponent);
export default TaskCard;
