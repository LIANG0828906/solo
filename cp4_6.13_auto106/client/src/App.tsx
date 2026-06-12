import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Task, TaskStatus, NewTaskData, TaskPriority } from './types';
import KanbanBoard from './KanbanBoard';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState<NewTaskData>({
    title: '',
    assignee: '',
    priority: 'medium',
  });
  const [animateCountKey, setAnimateCountKey] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data: Task[]) => {
        setTasks(data);
      })
      .catch((err) => console.error('获取任务失败:', err));

    const socket = io();
    socketRef.current = socket;

    socket.on('task:created', (task: Task) => {
      setTasks((prev) => [...prev, task]);
    });

    socket.on('task:moved', ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    });

    socket.on('task:deleted', ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    });

    socket.on('online:count', (count: number) => {
      setOnlineCount(count);
      setAnimateCountKey((k) => k + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (showModal) {
      const t = requestAnimationFrame(() => setModalVisible(true));
      return () => cancelAnimationFrame(t);
    }
  }, [showModal]);

  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => setShowModal(false), 150);
  }, []);

  const handleCreateTask = useCallback(() => {
    if (!newTask.title.trim() || !newTask.assignee.trim()) {
      return;
    }
    socketRef.current?.emit('task:create', newTask);
    setNewTask({ title: '', assignee: '', priority: 'medium' });
    closeModal();
  }, [newTask, closeModal]);

  const handleDeleteTask = useCallback((taskId: string) => {
    socketRef.current?.emit('task:delete', { taskId });
  }, []);

  const handleMoveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    socketRef.current?.emit('task:move', { taskId, newStatus });
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1e1e2e',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <header
        style={{
          width: '100%',
          maxWidth: '1400px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
            }}
          >
            团队任务看板
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(34, 197, 94, 0.15)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'pulseDot 2s infinite',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                color: '#86efac',
                fontWeight: 500,
              }}
            >
              在线:
            </span>
            <span
              key={animateCountKey}
              className="bounce-count animate"
              style={{
                fontSize: '14px',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              {onlineCount}
            </span>
          </div>
        </div>

        <button
          onClick={openModal}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(102, 126, 234, 0.4)';
          }}
        >
          + 新建任务
        </button>
      </header>

      <KanbanBoard
        tasks={tasks}
        onDeleteTask={handleDeleteTask}
        onMoveTask={handleMoveTask}
      />

      {showModal && (
        <>
          <div
            onClick={closeModal}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 100,
              animation: 'overlayFade 0.15s ease-out',
              opacity: modalVisible ? 1 : 0,
              transition: 'opacity 0.15s ease',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transformOrigin: 'center center',
              transform: `translate(-50%, -50%) scale(${modalVisible ? 1 : 0.92})`,
              opacity: modalVisible ? 1 : 0,
              background: '#2a2a3e',
              borderRadius: '16px',
              padding: '32px',
              width: '90%',
              maxWidth: '440px',
              zIndex: 101,
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '24px',
              }}
            >
              新建任务
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#9ca3af',
                    marginBottom: '8px',
                    fontWeight: 500,
                  }}
                >
                  任务标题
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTask();
                  }}
                  placeholder="输入任务标题..."
                  style={{
                    width: '100%',
                    background: '#1e1e2e',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#9ca3af',
                    marginBottom: '8px',
                    fontWeight: 500,
                  }}
                >
                  负责人
                </label>
                <input
                  type="text"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTask();
                  }}
                  placeholder="输入负责人姓名..."
                  style={{
                    width: '100%',
                    background: '#1e1e2e',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#9ca3af',
                    marginBottom: '8px',
                    fontWeight: 500,
                  }}
                >
                  优先级
                </label>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => {
                    const config = {
                      high: { label: '高', bg: '#ef4444', activeBg: 'rgba(239, 68, 68, 0.2)' },
                      medium: { label: '中', bg: '#f59e0b', activeBg: 'rgba(245, 158, 11, 0.2)' },
                      low: { label: '低', bg: '#22c55e', activeBg: 'rgba(34, 197, 94, 0.2)' },
                    }[p];
                    const isActive = newTask.priority === p;

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewTask({ ...newTask, priority: p })}
                        style={{
                          flex: 1,
                          background: isActive ? config.activeBg : '#1e1e2e',
                          border: isActive
                            ? `2px solid ${config.bg}`
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '10px',
                          color: isActive ? config.bg : '#9ca3af',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#9ca3af',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleCreateTask}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
