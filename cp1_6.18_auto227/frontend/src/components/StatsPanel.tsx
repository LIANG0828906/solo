import React, { useMemo } from 'react';
import { useAppStore } from '../store';
import { Task } from '../types';

export const StatsPanel: React.FC = () => {
  const tasks = useAppStore((state) => state.tasks);
  const now = Date.now();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t: Task) => t.completed).length;
    const overdue = tasks.filter((t: Task) => !t.completed && t.endTime < now).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const inProgress = total - completed;
    const highPriority = tasks.filter((t: Task) => t.priority === 'high' && !t.completed).length;

    return { total, completed, overdue, rate, inProgress, highPriority };
  }, [tasks, now]);

  const cards = [
    {
      label: '任务总数',
      value: stats.total,
      color: '#7C3AED',
      icon: '📋'
    },
    {
      label: '进行中',
      value: stats.inProgress,
      color: '#4ECDC4',
      icon: '⏳'
    },
    {
      label: '已超期',
      value: stats.overdue,
      color: '#FF4500',
      icon: '⚠️'
    },
    {
      label: '高优先级',
      value: stats.highPriority,
      color: '#FF6B6B',
      icon: '🔥'
    },
    {
      label: '完成率',
      value: `${stats.rate}%`,
      color: '#32CD32',
      icon: '✅',
      progress: stats.rate
    }
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        padding: '20px 32px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            flex: '1 1 140px',
            maxWidth: '180px',
            padding: '16px 20px',
            background: 'rgba(42, 42, 78, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 8px 30px rgba(0, 0, 0, 0.3), 0 0 20px ${card.color}22`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>{card.icon}</span>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>{card.label}</span>
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${card.color}, ${card.color}88)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px'
            }}
          >
            {card.value}
          </div>

          {card.progress !== undefined && (
            <div
              style={{
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${card.progress}%`,
                  background: `linear-gradient(90deg, ${card.color}, ${card.color}88)`,
                  borderRadius: '2px',
                  transition: 'width 0.5s ease-out'
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
