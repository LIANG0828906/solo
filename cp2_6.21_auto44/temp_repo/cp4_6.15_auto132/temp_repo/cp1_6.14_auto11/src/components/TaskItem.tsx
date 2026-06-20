import { useState, useRef } from 'react';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  isToday?: boolean;
  onComplete: (taskId: string) => void;
  onPostpone: (taskId: string, days: number) => void;
}

const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
  water: { label: '浇水', icon: '💧', color: '#4a9eff' },
  fertilize: { label: '施肥', icon: '🌿', color: '#f0a040' },
  repot: { label: '换盆', icon: '🪴', color: '#a060d0' },
};

export default function TaskItem({
  task,
  isToday,
  onComplete,
  onPostpone,
}: TaskItemProps) {
  const [showParticles, setShowParticles] = useState(false);
  const checkboxRef = useRef<HTMLDivElement>(null);
  const typeInfo = typeLabels[task.type] || typeLabels.water;

  const handleComplete = () => {
    if (!task.completed) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 800);
    }
    onComplete(task.id);
  };

  const formatDate = (ts: number) => {
    const date = new Date(ts);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div
      className={`task-item fade-in ${task.completed ? 'completed' : ''} ${
        isToday && !task.completed ? 'today-task' : ''
      }`}
      style={{ borderLeft: `3px solid ${typeInfo.color}` }}
    >
      <div
        ref={checkboxRef}
        className={`task-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={handleComplete}
      >
        {showParticles && <ParticleBurst color={typeInfo.color} />}
      </div>
      <div className="task-info">
        <div className="task-title">
          {typeInfo.icon} {typeInfo.label} — {task.plantName}
        </div>
        <div className="task-subtitle">
          到期日期：{formatDate(task.dueDate)}
          {task.completed && task.completedAt
            ? ` · 已完成 ${formatDate(task.completedAt)}`
            : ''}
        </div>
      </div>
      {!task.completed && (
        <div className="task-actions">
          <button
            className="task-btn"
            onClick={(e) => {
              e.stopPropagation();
              onPostpone(task.id, 1);
            }}
          >
            +1天
          </button>
          <button
            className="task-btn"
            onClick={(e) => {
              e.stopPropagation();
              onPostpone(task.id, 3);
            }}
          >
            +3天
          </button>
        </div>
      )}
    </div>
  );
}

function ParticleBurst({ color }: { color: string }) {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const distance = 30 + Math.random() * 20;
    return {
      id: i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      delay: Math.random() * 100,
    };
  });

  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            background: color,
            left: '50%',
            top: '50%',
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
            animation: `particleFade 0.8s ease-out forwards`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </>
  );
}
