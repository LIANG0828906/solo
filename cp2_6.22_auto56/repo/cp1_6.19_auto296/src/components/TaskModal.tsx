import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TimeLog } from '../types';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  timeLogs: TimeLog[];
  hasMoreLogs: boolean;
  onLoadMoreLogs: () => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
  isTimerRunning: boolean;
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TaskModal: React.FC<TaskModalProps> = ({
  task,
  onClose,
  timeLogs,
  hasMoreLogs,
  onLoadMoreLogs,
  onStartTimer,
  onStopTimer,
  isTimerRunning,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  useEffect(() => {
    if (!task) {
      setElapsedTime(0);
    }
  }, [task]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50 && hasMoreLogs) {
      onLoadMoreLogs();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscape = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
        onClick={handleBackdropClick}
        onKeyDown={handleEscape}
        tabIndex={0}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            background: '#2D2D44',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#E0E0E0',
                  marginBottom: '8px',
                }}
              >
                {task.title}
              </h2>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '13px', color: '#9B9BC7' }}>
                  截止日期：
                  <span style={{ color: '#E0E0E0' }}>
                    {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#9B9BC7' }}>
                  剩余工时：
                  <span style={{ color: '#7C3AED', fontWeight: 600 }}>
                    {task.remainingHours}h
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#9B9BC7' }}>
                  预估工时：
                  <span style={{ color: '#E0E0E0' }}>{task.estimatedHours}h</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9B9BC7',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = '#E0E0E0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#9B9BC7';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            {task.description && (
              <div style={{ marginBottom: '24px' }}>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#9B9BC7',
                    margin: 0,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  任务描述
                </h4>
                <p
                  style={{
                    margin: 0,
                    color: '#E0E0E0',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {task.description}
                </p>
              </div>
            )}

            {task.attachmentUrl && (
              <div style={{ marginBottom: '24px' }}>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#9B9BC7',
                    margin: 0,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  附件
                </h4>
                <a
                  href={task.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#7C3AED',
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                  查看附件
                </a>
              </div>
            )}

            <div
              style={{
                marginBottom: '24px',
                background: '#1E1E2E',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <h4
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#9B9BC7',
                  margin: 0,
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                计时
              </h4>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    fontSize: '42px',
                    fontWeight: 700,
                    color: isTimerRunning ? '#10B981' : '#E0E0E0',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                  }}
                >
                  {formatDuration(elapsedTime)}
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={isTimerRunning ? onStopTimer : onStartTimer}
                  style={{
                    padding: '12px 28px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    background: isTimerRunning ? '#DC2626' : '#7C3AED',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.2s',
                  }}
                >
                  {isTimerRunning ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                      结束计时
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      开始计时
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            <div>
              <h4
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#9B9BC7',
                  margin: 0,
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                工时记录
              </h4>
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                  maxHeight: '240px',
                  overflowY: 'auto',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                {timeLogs.length === 0 ? (
                  <div
                    style={{
                      padding: '32px 16px',
                      textAlign: 'center',
                      color: '#5A5A80',
                      fontSize: '13px',
                    }}
                  >
                    暂无工时记录
                  </div>
                ) : (
                  <div>
                    {timeLogs.map((log, index) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '14px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom:
                            index < timeLogs.length - 1
                              ? '1px solid rgba(255, 255, 255, 0.04)'
                              : 'none',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', color: '#E0E0E0', marginBottom: '4px' }}>
                            {formatDate(log.startTime)}
                          </div>
                          {log.endTime && (
                            <div style={{ fontSize: '12px', color: '#5A5A80' }}>
                              至 {formatDate(log.endTime)}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#7C3AED',
                            background: 'rgba(124, 58, 237, 0.1)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                          }}
                        >
                          {(log.duration / 3600).toFixed(2)}h
                        </div>
                      </div>
                    ))}
                    {hasMoreLogs && (
                      <div
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#7C3AED',
                          fontSize: '12px',
                        }}
                      >
                        加载更多...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskModal;
