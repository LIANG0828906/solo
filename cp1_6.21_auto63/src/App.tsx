import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Menu, X } from 'lucide-react';
import { Task, TeamMember, TaskStatus } from './types';
import { fetchAllTasks, fetchTeamMembers, fetchStats, createTask, updateTaskStatus } from './api';
import KanbanColumn from './KanbanColumn';
import TaskDetail from './TaskDetail';
import Sidebar from './Sidebar';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dragStateRef = useRef({
    isDragging: false,
    taskId: '',
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    cardWidth: 260,
    cardHeight: 0,
    originalStatus: '' as TaskStatus,
    targetStatus: '' as TaskStatus | null,
    animationFrame: 0
  });

  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'todo', title: '待办', color: 'var(--column-todo)' },
    { status: 'inProgress', title: '进行中', color: 'var(--column-progress)' },
    { status: 'done', title: '已完成', color: 'var(--column-done)' }
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [tasksData, membersData, statsData] = await Promise.all([
        fetchAllTasks(),
        fetchTeamMembers(),
        fetchStats()
      ]);
      setTasks(tasksData);
      setMembers(membersData);
      setCompletedCount(statsData.completedThisWeek);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title.trim() || !newTaskForm.assigneeId) return;
    if (newTaskForm.title.length > 50) {
      setError('标题不能超过50字');
      return;
    }
    if (newTaskForm.description.length > 200) {
      setError('描述不能超过200字');
      return;
    }

    setIsLoading(true);
    try {
      const newTask = await createTask(newTaskForm);
      setTasks(prev => [...prev, newTask]);
      setIsModalOpen(false);
      setNewTaskForm({ title: '', description: '', assigneeId: '' });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = useCallback((e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    const state = dragStateRef.current;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    state.isDragging = true;
    state.taskId = task.id;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.currentX = e.clientX - rect.left;
    state.currentY = e.clientY - rect.top;
    state.cardWidth = rect.width;
    state.cardHeight = rect.height;
    state.originalStatus = task.status;
    state.targetStatus = null;

    const dragEl = document.createElement('div');
    dragEl.id = 'drag-ghost';
    dragEl.style.cssText = `
      position: fixed;
      width: ${state.cardWidth}px;
      height: ${state.cardHeight}px;
      left: ${e.clientX - state.currentX}px;
      top: ${e.clientY - state.currentY}px;
      background: white;
      border: 2px solid var(--border-gray);
      border-radius: 8px;
      opacity: 0.8;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      border-left: 4px solid ${task.color};
      padding: 16px;
      transition: none;
    `;
    dragEl.innerHTML = `
      <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">${task.title}</div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${task.assignee.avatarColor}; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 600;">${task.assignee.name.charAt(0)}</div>
        <span style="font-size: 12px; color: var(--text-secondary);">${task.assignee.name}</span>
      </div>
    `;
    document.body.appendChild(dragEl);

    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: 'todo' as TaskStatus } : t
    ));

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const state = dragStateRef.current;
    if (!state.isDragging) return;

    cancelAnimationFrame(state.animationFrame);
    state.animationFrame = requestAnimationFrame(() => {
      const dragEl = document.getElementById('drag-ghost');
      if (dragEl) {
        dragEl.style.left = `${e.clientX - state.currentX}px`;
        dragEl.style.top = `${e.clientY - state.currentY}px`;
      }

      const columns = document.querySelectorAll('[data-column]');
      let foundTarget: TaskStatus | null = null;
      columns.forEach(col => {
        const rect = col.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          foundTarget = (col as HTMLElement).dataset.column as TaskStatus;
        }
      });

      if (foundTarget && foundTarget !== state.targetStatus) {
        if (state.targetStatus) {
          const prevCol = document.querySelector(`[data-column="${state.targetStatus}"]`);
          prevCol?.classList.remove('highlight-column');
        }
        state.targetStatus = foundTarget;
        const newCol = document.querySelector(`[data-column="${foundTarget}"]`);
        newCol?.classList.add('highlight-column');
        setTimeout(() => {
          newCol?.classList.remove('highlight-column');
        }, 300);
      }
    });
  }, []);

  const handleDragEnd = useCallback(async (e: MouseEvent) => {
    const state = dragStateRef.current;
    if (!state.isDragging) return;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleDragEnd);

    const dragEl = document.getElementById('drag-ghost');
    if (dragEl) {
      dragEl.remove();
    }

    const columns = document.querySelectorAll('[data-column]');
    let targetStatus: TaskStatus | null = null;
    columns.forEach(col => {
      const rect = col.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        targetStatus = (col as HTMLElement).dataset.column as TaskStatus;
      }
    });

    if (targetStatus && targetStatus !== state.originalStatus) {
      try {
        const targetTasks = tasks.filter(t => t.status === targetStatus && t.id !== state.taskId);
        const updatedTask = await updateTaskStatus(state.taskId, {
          status: targetStatus,
          order: targetTasks.length
        });
        setTasks(prev => prev.map(t => 
          t.id === state.taskId ? updatedTask : t
        ));
        loadData();
      } catch (err) {
        console.error('更新状态失败', err);
        setTasks(prev => prev.map(t => 
          t.id === state.taskId ? { ...t, status: state.originalStatus } : t
        ));
      }
    } else {
      setTasks(prev => prev.map(t => 
        t.id === state.taskId ? { ...t, status: state.originalStatus } : t
      ));
    }

    state.isDragging = false;
    state.taskId = '';
    state.targetStatus = null;
  }, [tasks, loadData]);

  const handleTaskClick = (task: Task) => {
    if (!dragStateRef.current.isDragging) {
      setSelectedTask(task);
    }
  };

  const handleCommentAdded = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleTaskUpdated = useCallback((updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      position: 'relative'
    }}>
      <div style={{ 
        flex: 1, 
        padding: '24px',
        paddingRight: isMobile ? '24px' : '304px',
        maxWidth: isMobile ? '100%' : 'calc(100% - 280px)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            团队协作看板
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '24px',
                  background: 'white',
                  border: '1px solid var(--border-gray)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                width: '160px',
                height: '48px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              <Plus size={18} />
              创建卡片
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                float: 'right',
                background: 'none',
                border: 'none',
                color: '#c62828',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '24px',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'flex-start'
        }}>
          {columns.map(col => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              color={col.color}
              tasks={getTasksByStatus(col.status)}
              onDragStart={handleDragStart}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      </div>

      {!isMobile && (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: '280px',
            backgroundColor: 'var(--bg-white)',
            borderLeft: '1px solid var(--border-gray)',
            zIndex: 10
          }}
        >
          <Sidebar members={members} completedCount={completedCount} />
        </div>
      )}

      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '280px',
              backgroundColor: 'var(--bg-white)',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <Sidebar members={members} completedCount={completedCount} />
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-enter"
            style={{
              width: '480px',
              maxWidth: '90vw',
              backgroundColor: 'var(--bg-white)',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
              创建新任务
            </h2>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  标题 <span style={{ color: '#e53935' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="请输入任务标题（最多50字）"
                  maxLength={50}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-gray)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent-blue)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-gray)'; }}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {newTaskForm.title.length}/50
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  描述
                </label>
                <textarea
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入任务描述（最多200字）"
                  maxLength={200}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-gray)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent-blue)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-gray)'; }}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {newTaskForm.description.length}/200
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  负责人 <span style={{ color: '#e53935' }}>*</span>
                </label>
                <select
                  value={newTaskForm.assigneeId}
                  onChange={(e) => setNewTaskForm(prev => ({ ...prev, assigneeId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-gray)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent-blue)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-gray)'; }}
                >
                  <option value="">请选择负责人</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid var(--border-gray)',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newTaskForm.title.trim() || !newTaskForm.assigneeId}
                  style={{
                    padding: '12px 32px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !newTaskForm.title.trim() || !newTaskForm.assigneeId ? 0.6 : 1,
                    transition: 'opacity 0.2s ease'
                  }}
                >
                  {isLoading ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          members={members}
          onClose={() => setSelectedTask(null)}
          onCommentAdded={handleCommentAdded}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
};

export default App;
