import { useCallback, useRef, useState } from 'react';
import type { Task } from '@/lib/api';
import { getTypeColor, getTypeLabel, formatRelativeTime, generateConfettiPieces } from '@/lib/helpers';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onComplete, onDelete }: TaskListProps) {
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());
  const [confetti, setConfetti] = useState<Array<{
    id: string;
    x: number;
    y: number;
    tx: number;
    ty: number;
    rot: number;
    color: string;
    parentId: string;
  }>>([]);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleComplete = useCallback(
    (id: string) => {
      setCheckingIds((prev) => new Set(prev).add(id));
      const cardEl = cardRefs.current.get(id);
      if (cardEl) {
        const rect = cardEl.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const pieces = generateConfettiPieces(cx, cy).map((p) => ({
          ...p,
          parentId: id,
        }));
        setConfetti((prev) => [...prev, ...pieces]);
        setTimeout(() => {
          setConfetti((prev) => prev.filter((p) => p.parentId !== id));
        }, 1100);
      }
      setTimeout(() => {
        onComplete(id);
        setCheckingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 500);
    },
    [onComplete]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setExitingIds((prev) => new Set(prev).add(id));
      setTimeout(() => {
        onDelete(id);
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 400);
    },
    [onDelete]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        overflowY: 'auto',
        flex: 1,
        padding: '4px 2px',
        willChange: 'transform',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {tasks.map((task) => {
        const isExiting = exitingIds.has(task.id);
        const isChecking = checkingIds.has(task.id);
        const typeColor = getTypeColor(task.type);
        const typeLabel = getTypeLabel(task.type);
        const relativeTime = formatRelativeTime(task.createdAt);

        return (
          <div
            key={task.id}
            ref={(el) => {
              if (el) cardRefs.current.set(task.id, el);
              else cardRefs.current.delete(task.id);
            }}
            className={`${isExiting ? 'task-card-exit' : 'task-card-enter'} ${isChecking ? 'task-card-check' : ''}`}
            style={{
              position: 'relative',
              background: 'rgba(255,255,255,0.22)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              if (!isExiting && !isChecking) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            {confetti.filter((p) => p.parentId === task.id).map((piece) => (
              <div
                key={piece.id}
                className="confetti-piece"
                style={{
                  left: piece.x,
                  top: piece.y,
                  '--tx': `${piece.tx}px`,
                  '--ty': `${piece.ty}px`,
                  '--rot': `${piece.rot}deg`,
                  background: piece.color,
                } as React.CSSProperties}
              />
            ))}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: task.completed ? '#999' : '#2c3e50',
                  textDecoration: task.completed ? 'line-through' : 'none',
                  transition: 'all 0.3s',
                  wordBreak: 'break-word',
                }}
              >
                {task.description}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: typeColor,
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: typeColor,
                      display: 'inline-block',
                    }}
                  />
                  {typeLabel}
                </span>
                <span style={{ fontSize: '12px', color: '#999' }}>{relativeTime}</span>
                {task.completed && task.completedAt && (
                  <span style={{ fontSize: '12px', color: '#27AE60' }}>
                    ✓ {formatRelativeTime(task.completedAt)}完成
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={() => handleComplete(task.id)}
                disabled={task.completed}
                title={task.completed ? '已完成' : '标记完成'}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: task.completed ? '2px solid #27AE60' : '2px solid var(--gray-400)',
                  background: task.completed ? '#27AE60' : 'transparent',
                  cursor: task.completed ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: task.completed ? 'white' : 'var(--gray-500)',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  padding: 0,
                }}
              >
                {task.completed ? '✓' : ''}
              </button>
              <button
                onClick={() => handleDelete(task.id)}
                title="删除任务"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(231,76,60,0.1)',
                  color: '#E74C3C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  transition: 'all 0.15s',
                  padding: 0,
                  transform: 'scale(1)',
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)';
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                🗑
              </button>
            </div>
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '14px',
          }}
        >
          还没有任务，快来添加一个吧 🎯
        </div>
      )}
    </div>
  );
}
