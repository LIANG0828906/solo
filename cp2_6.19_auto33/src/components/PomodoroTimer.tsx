import { useEffect, useRef } from 'react';
import { useTimerStore } from '../store/timerStore';
import { useBoardStore } from '../store/boardStore';

export default function PomodoroTimer() {
  const { timeLeft, isRunning, completedPomodoros, activeTaskId, start, pause, reset, tick } = useTimerStore();
  const tasks = useBoardStore((state) => state.tasks);
  const intervalRef = useRef<number | null>(null);

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        tick();
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, tick]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      style={{
        backgroundColor: '#2d3e50',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        height: 'fit-content',
      }}
    >
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', textAlign: 'center' }}>
        🍅 番茄钟
      </h2>

      {activeTask && (
        <div
          style={{
            backgroundColor: '#1a2332',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            textAlign: 'center',
          }}
        >
          <span style={{ color: '#94a3b8' }}>当前任务: </span>
          <span style={{ color: '#e4e6eb', fontWeight: 500 }}>{activeTask.title}</span>
        </div>
      )}

      <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 24px' }}>
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#1a2332"
            strokeWidth="8"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '36px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
        {!isRunning ? (
          <button
            onClick={start}
            style={{
              padding: '12px 32px',
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            开始
          </button>
        ) : (
          <button
            onClick={pause}
            style={{
              padding: '12px 32px',
              backgroundColor: '#f59e0b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            暂停
          </button>
        )}
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3d5166',
            border: 'none',
            borderRadius: '8px',
            color: '#e4e6eb',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          重置
        </button>
      </div>

      <div
        style={{
          textAlign: 'center',
          padding: '12px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '8px',
        }}
      >
        <span style={{ fontSize: '14px', color: '#94a3b8' }}>今日已完成: </span>
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#10b981' }}>
          {completedPomodoros} 个番茄
        </span>
      </div>
    </div>
  );
}
