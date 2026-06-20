import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Task, Priority } from '../types';
import { taskApi } from '../api';
import { formatDateTime, getPriorityColors, snapTo15Minutes } from '../utils';

interface TaskEditorProps {
  task: Task;
  onClose: () => void;
}

const toInputTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const fromInputTime = (value: string): number => {
  return snapTo15Minutes(new Date(value).getTime());
};

export const TaskEditor: React.FC<TaskEditorProps> = ({ task, onClose }) => {
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);

  const [name, setName] = useState(task.name);
  const [startTime, setStartTime] = useState(toInputTime(task.startTime));
  const [endTime, setEndTime] = useState(toInputTime(task.endTime));
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [completed, setCompleted] = useState(task.completed);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    const newStartTime = fromInputTime(startTime);
    const newEndTime = fromInputTime(endTime);

    if (newEndTime <= newStartTime) {
      alert('结束时间必须晚于开始时间');
      return;
    }

    try {
      const updated = await taskApi.updateTask(task.id, {
        name,
        startTime: newStartTime,
        endTime: newEndTime,
        priority,
        completed,
        updatedAt: Date.now()
      });
      updateTask(updated);
      onClose();
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert('任务时间与其他任务冲突！');
      } else {
        console.error('保存任务失败:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (confirm('确定要删除这个任务吗？')) {
      try {
        await taskApi.deleteTask(task.id);
        deleteTask(task.id);
        onClose();
      } catch (error) {
        console.error('删除任务失败:', error);
      }
    }
  };

  const priorities: { value: Priority; label: string }[] = [
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' }
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, rgba(42, 42, 78, 0.95), rgba(30, 30, 62, 0.95))',
          borderRadius: '16px',
          padding: '28px',
          minWidth: '420px',
          maxWidth: '90vw',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'scaleIn 0.25s ease-out'
        }}
      >
        <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#FFFFFF', fontWeight: 600 }}>
          编辑任务
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
              任务名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 15, 35, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              placeholder="输入任务名称..."
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                开始时间
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  colorScheme: 'dark'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                结束时间
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  colorScheme: 'dark'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
              优先级
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {priorities.map((p) => {
                const colors = getPriorityColors(p.value);
                const isActive = priority === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: isActive ? 'rgba(124, 58, 237, 0.3)' : 'rgba(15, 15, 35, 0.6)',
                      border: isActive ? `2px solid transparent` : '1px solid rgba(255, 255, 255, 0.1)',
                      borderImage: isActive ? colors.border : undefined,
                      borderImageSlice: isActive ? 1 : undefined,
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      transform: isActive ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              id="completed"
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="completed" style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer' }}>
              标记为已完成
            </label>
          </div>

          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
            创建时间：{formatDateTime(task.createdAt)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
          <button
            onClick={handleDelete}
            style={{
              padding: '12px 20px',
              background: 'rgba(255, 69, 0, 0.2)',
              border: '1px solid rgba(255, 69, 0, 0.5)',
              borderRadius: '8px',
              color: '#FF6347',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            删除
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            保存
          </button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
};
