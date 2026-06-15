import React, { useCallback } from 'react';
import { Play, Pause, RotateCcw, Target } from 'lucide-react';
import { useApp } from '../state/store';
import { usePomodoro } from '../hooks/usePomodoro';
import type { PomodoroRecord } from '../types';

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const PomodoroTimer: React.FC = () => {
  const { state, dispatch } = useApp();

  const handleComplete = useCallback(
    (record: PomodoroRecord) => {
      dispatch({ type: 'COMPLETE_POMODORO', payload: record });
    },
    [dispatch]
  );

  const { status, progress, minutes, seconds, isFlashing, start, pause, reset } =
    usePomodoro(state.activeTaskId, handleComplete);

  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId);

  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const timeText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const statusLabel =
    status === 'running'
      ? '专注中'
      : status === 'paused'
        ? '已暂停'
        : status === 'completed'
          ? '已完成！'
          : '准备开始';

  const statusColor =
    status === 'running'
      ? 'var(--success-color)'
      : status === 'paused'
        ? 'var(--warning-color)'
        : status === 'completed'
          ? 'var(--success-color)'
          : 'var(--text-muted)';

  return (
    <div
      className={isFlashing ? 'flash-animation' : ''}
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 20,
        padding: 24,
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        border: '1px solid var(--border-color)',
        transition: 'all 0.4s ease',
        flexShrink: 0,
      }}
    >
      <div style={{ position: 'relative', width: 260, height: 260, flexShrink: 0 }}>
        <svg width={260} height={260} viewBox="0 0 260 260" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#27ae60" />
              <stop offset="100%" stopColor="#2ecc71" />
            </linearGradient>
          </defs>
          <circle
            cx={130}
            cy={130}
            r={RADIUS}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth={14}
          />
          <circle
            cx={130}
            cy={130}
            r={RADIUS}
            fill="none"
            stroke="url(#pomodoroGradient)"
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{
              transition: status === 'running' ? 'none' : 'stroke-dashoffset 0.3s ease',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: 2,
            }}
          >
            {timeText}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: statusColor,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {status === 'running' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, animation: 'flash 1s infinite' }} />}
            {statusLabel}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Target size={14} />
            当前任务
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 6,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {activeTask ? activeTask.title : '请选择一个任务开始'}
          </div>
          {activeTask && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 10,
                  fontSize: 12,
                  background: 'rgba(39, 174, 96, 0.1)',
                  color: 'var(--success-color)',
                  fontWeight: 500,
                }}
              >
                🍅 已完成 {activeTask.completedPomodoros}
              </span>
              {activeTask.estimatedPomodoros > 0 && (
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 10,
                    fontSize: 12,
                    background: 'rgba(52, 152, 219, 0.1)',
                    color: 'var(--accent-color)',
                    fontWeight: 500,
                  }}
                >
                  目标 {activeTask.estimatedPomodoros}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={start}
            disabled={!activeTask || status === 'running'}
            style={{
              flex: 1,
              minWidth: 100,
              padding: '12px 20px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              background: status === 'running' ? 'var(--text-muted)' : 'var(--success-color)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: status !== 'running' ? '0 4px 14px rgba(39, 174, 96, 0.35)' : 'none',
            }}
          >
            <Play size={16} fill="currentColor" />
            {status === 'paused' ? '继续' : '开始'}
          </button>

          <button
            onClick={pause}
            disabled={status !== 'running'}
            style={{
              flex: 1,
              minWidth: 100,
              padding: '12px 20px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              background: status === 'running' ? 'var(--warning-color)' : 'var(--bg-tertiary)',
              color: status === 'running' ? '#fff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: status === 'running' ? '0 4px 14px rgba(243, 156, 18, 0.35)' : 'none',
            }}
          >
            <Pause size={16} fill="currentColor" />
            暂停
          </button>

          <button
            onClick={reset}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minWidth: 60,
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div
          style={{
            padding: 12,
            background: 'var(--bg-tertiary)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          💡 点击任务卡片上的 <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>播放按钮</span> 来绑定任务并开始番茄钟。每个番茄周期 <b>25 分钟</b>，专注工作不中断！
        </div>
      </div>
    </div>
  );
};
