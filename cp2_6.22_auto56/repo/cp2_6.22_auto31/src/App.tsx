import { useState, useEffect, useCallback } from 'react';
import { Task, User, ActivityLog as ActivityLogType } from './types';
import socket, { on } from './utils/socket';
import Board from './components/Board';
import SprintPanel from './components/SprintPanel';
import OnlineUsers from './components/OnlineUsers';
import ActivityLog from './components/ActivityLog';
import TaskModal from './components/TaskModal';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogType[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, usersRes, logsRes] = await Promise.all([
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
        fetch('/api/activity').then(r => r.json()),
      ]);
      setTasks(tasksRes);
      setUsers(usersRes);
      setActivityLogs(logsRes);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const offTaskCreated = on<Task>('task:created', (task) => {
      setTasks(prev => [...prev, task]);
    });

    const offTaskUpdated = on<Task>('task:updated', (updatedTask) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    });

    const offTaskMoved = on<Task>('task:moved', (movedTask) => {
      setTasks(prev => prev.map(t => t.id === movedTask.id ? movedTask : t));
    });

    const offTaskDeleted = on<string>('task:deleted', (taskId) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    });

    const offUserJoined = on<User>('user:joined', (user) => {
      setUsers(prev => {
        const exists = prev.some(u => u.id === user.id);
        if (exists) {
          return prev.map(u => u.id === user.id ? { ...u, online: true } : u);
        }
        return [...prev, user];
      });
    });

    const offUserLeft = on<User>('user:left', (user) => {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, online: false } : u));
    });

    const offActivity = on<ActivityLogType>('activity:new', (log) => {
      setActivityLogs(prev => [log, ...prev]);
    });

    return () => {
      offTaskCreated();
      offTaskUpdated();
      offTaskMoved();
      offTaskDeleted();
      offUserJoined();
      offUserLeft();
      offActivity();
    };
  }, []);

  const handleTaskMove = async (taskId: string, status: Task['status'], order: number) => {
    try {
      await fetch(`/api/tasks/${taskId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, order }),
      });
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleTaskSave = async (updatedTask: Task) => {
    try {
      await fetch(`/api/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (data: {
    title: string;
    description: string;
    storyPoints: number;
    priority: Task['priority'];
    assignee: string;
  }) => {
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const newTask = {
      title: data.title,
      description: data.description,
      status: 'todo' as const,
      priority: data.priority,
      assignee: data.assignee,
      storyPoints: data.storyPoints,
      order: todoTasks.length,
    };

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <button
        className="drawer-toggle left-toggle"
        onClick={() => setLeftDrawerOpen(true)}
        aria-label="打开左侧面板"
      >
        <span className="menu-icon">☰</span>
      </button>
      <button
        className="drawer-toggle right-toggle"
        onClick={() => setRightDrawerOpen(true)}
        aria-label="打开右侧面板"
      >
        <span className="menu-icon">☰</span>
      </button>

      {leftDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setLeftDrawerOpen(false)} />
      )}
      {rightDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setRightDrawerOpen(false)} />
      )}

      <aside className={`sidebar left-sidebar ${leftDrawerOpen ? 'open' : ''}`}>
        <button
          className="drawer-close"
          onClick={() => setLeftDrawerOpen(false)}
          aria-label="关闭"
        >
          ×
        </button>
        <div className="sidebar-content">
          <div className="app-logo">
            <span className="logo-icon">📋</span>
            <span className="logo-text">敏捷看板</span>
          </div>
          <SprintPanel />
          <button className="btn-create-task" onClick={handleCreateTask}>
            + 新建任务
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="board-wrapper">
          <Board
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskMove={handleTaskMove}
            onCreateTask={handleCreateTask}
          />
        </div>
      </main>

      <aside className={`sidebar right-sidebar ${rightDrawerOpen ? 'open' : ''}`}>
        <button
          className="drawer-close"
          onClick={() => setRightDrawerOpen(false)}
          aria-label="关闭"
        >
          ×
        </button>
        <div className="sidebar-content">
          <OnlineUsers users={users} />
          <div className="sidebar-section-spacer" />
          <ActivityLog logs={activityLogs} />
        </div>
      </aside>

      {isModalOpen && (
        <TaskModal
          task={modalMode === 'edit' ? selectedTask : null}
          isCreateMode={modalMode === 'create'}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onSave={handleTaskSave}
          onCreate={handleCreateSubmit}
          onDelete={handleTaskDelete}
        />
      )}

      <style>{`
        .app-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: #f0f2f5;
        }

        .sidebar {
          height: 100%;
          overflow-y: auto;
          background: #ffffff;
          position: relative;
          flex-shrink: 0;
        }

        .left-sidebar {
          width: 20%;
          min-width: 260px;
          border-right: 1px solid #e0e0e0;
        }

        .right-sidebar {
          width: 20%;
          min-width: 260px;
          border-left: 1px solid #e0e0e0;
        }

        .sidebar-content {
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sidebar-section-spacer {
          height: 4px;
        }

        .app-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e0e0e0;
          margin-bottom: 4px;
        }

        .logo-icon {
          font-size: 24px;
        }

        .logo-text {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }

        .main-content {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .board-wrapper {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .btn-create-task {
          width: 100%;
          background-color: #3498db;
          color: #fff;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s;
        }

        .btn-create-task:hover {
          background-color: #2980b9;
        }

        .drawer-toggle {
          display: none;
          position: fixed;
          top: 12px;
          width: 40px;
          height: 40px;
          background-color: #2c3e50;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 18px;
          cursor: pointer;
          z-index: 100;
          align-items: center;
          justify-content: center;
        }

        .left-toggle {
          left: 12px;
        }

        .right-toggle {
          right: 12px;
        }

        .menu-icon {
          line-height: 1;
        }

        .drawer-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 150;
        }

        .drawer-close {
          display: none;
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          font-size: 24px;
          color: #7f8c8d;
          cursor: pointer;
          z-index: 10;
        }

        .app-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 16px;
          font-size: 16px;
          color: #7f8c8d;
        }

        .loading-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #e0e0e0;
          border-top-color: #3498db;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .left-sidebar,
          .right-sidebar {
            width: 25%;
            min-width: 220px;
          }
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            width: 280px !important;
            min-width: unset;
            z-index: 200;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
          }

          .left-sidebar {
            left: 0;
          }

          .right-sidebar {
            right: 0;
            left: auto;
            transform: translateX(100%);
            border-left: 1px solid #e0e0e0;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .main-content {
            width: 100%;
            padding: 60px 12px 12px;
          }

          .drawer-toggle {
            display: flex;
          }

          .drawer-overlay {
            display: block;
          }

          .drawer-close {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
