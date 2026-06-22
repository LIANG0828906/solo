import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Board from './components/Board';
import { useTaskStore } from './stores/taskStore';
import type { Task, ClientToServerEvents, ServerToClientEvents } from '../../shared/types';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

const App: React.FC = () => {
  const {
    setSocket,
    setTasks,
    addTask,
    updateTask,
    deleteTask,
    setOnlineUsers,
    showNotification,
    clearNotification,
    createTask,
    onlineUsers,
    notification,
    tasks
  } = useTaskStore();

  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const socket: SocketType = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setSocket(socket);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('tasks:initial', (initialTasks: Task[]) => {
      setTasks(initialTasks);
    });

    socket.on('task:created', (task: Task) => {
      addTask(task, true);
    });

    socket.on('task:updated', (task: Task) => {
      updateTask(task, true);
    });

    socket.on('task:deleted', (taskId: string) => {
      deleteTask(taskId, true);
    });

    socket.on('users:count', (count: number) => {
      setOnlineUsers(count);
    });

    socket.on('notification', (message: string) => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      showNotification(message);
      notificationTimerRef.current = setTimeout(() => {
        clearNotification();
      }, 1500);
    });

    return () => {
      socket.disconnect();
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, [setSocket, setTasks, addTask, updateTask, deleteTask, setOnlineUsers, showNotification, clearNotification]);

  const handleAddTask = () => {
    if (!inputValue.trim()) return;
    if (tasks.length >= 50) {
      alert('看板最多同时容纳50张卡片');
      return;
    }
    createTask(inputValue);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#F8F9FA',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {notification && (
        <div
          className="notification-bar"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '12px 28px',
            backgroundColor: '#4D96FF',
            color: '#FFFFFF',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(77,150,255,0.4)'
          }}
        >
          {notification}
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 100,
          padding: '10px 16px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#6BCB77' : '#FF4757',
            animation: isConnected ? 'pulse 2s infinite' : 'none'
          }}
        />
        <span style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}>
          在线 {onlineUsers} 人
        </span>
      </div>

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 24px 120px',
          position: 'relative'
        }}
      >
        <header
          style={{
            textAlign: 'center',
            marginBottom: '40px'
          }}
        >
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6C63FF 0%, #9D7BFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px'
            }}
          >
            任务编织者
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>
            轻松管理您的项目任务 · 实时协同协作
          </p>
        </header>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginBottom: '32px'
          }}
        >
          <Board />
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          padding: '16px 24px 24px',
          background: 'linear-gradient(to top, #F8F9FA 60%, rgba(248,249,250,0))',
          zIndex: 50
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入任务标题，按 Enter 或点击添加按钮创建..."
            style={{
              flex: 1,
              width: '100%',
              padding: '14px 20px',
              borderRadius: '12px',
              border: '2px solid #E0E0E0',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              backgroundColor: '#FFFFFF',
              color: '#333'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6C63FF';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(108,99,255,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E0E0E0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={handleAddTask}
            disabled={!inputValue.trim()}
            style={{
              padding: '14px 32px',
              borderRadius: '8px',
              border: 'none',
              background: inputValue.trim()
                ? 'linear-gradient(135deg, #6C63FF 0%, #9D7BFF 100%)'
                : 'linear-gradient(135deg, #C8C5CC 0%, #D4D1D8 100%)',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              transition: 'filter 0.2s, transform 0.1s',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.filter = 'brightness(1.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
            }}
            onMouseDown={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.transform = 'scale(0.97)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            + 添加任务
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default App;
