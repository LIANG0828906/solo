import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GanttChart } from './GanttChart';
import { Task, Dependency } from './types';
import { ASSIGNEES, COLORS, getColorForAssignee, formatDate, getStatusLabel, throttle } from './utils';
import { Plus, Calendar, User, X, Trash2, Edit, Menu, GanttChart as GanttIcon } from 'lucide-react';

const ROOM_ID = 'default-room';

interface AppState {
  tasks: Task[];
  dependencies: Dependency[];
  selectedTaskId: string | null;
  filterAssignee: string;
  filterStatus: string;
  isModalOpen: boolean;
  editingTask: Task | null;
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    taskId: string | null;
  };
  isSidebarOpen: boolean;
  isConnected: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

const initialState: AppState = {
  tasks: [],
  dependencies: [],
  selectedTaskId: null,
  filterAssignee: 'all',
  filterStatus: 'all',
  isModalOpen: false,
  editingTask: null,
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    taskId: null
  },
  isSidebarOpen: false,
  isConnected: false,
  syncStatus: 'idle'
};

export default function App() {
  const [state, setState] = useState<AppState>(initialState);
  const socketRef = useRef<Socket | null>(null);
  const modalFormRef = useRef<{
    name: string;
    assignee: string;
    startDate: string;
    endDate: string;
    progress: number;
  }>({
    name: '',
    assignee: ASSIGNEES[0],
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
    progress: 0
  });

  const showSyncStatus = useCallback((status: 'syncing' | 'success' | 'error') => {
    setState(prev => ({ ...prev, syncStatus: status }));
    if (status !== 'syncing') {
      setTimeout(() => {
        setState(prev => ({ ...prev, syncStatus: 'idle' }));
      }, 2000);
    }
  }, []);

  const emitTaskUpdate = useCallback(
    throttle((task: Task) => {
      if (socketRef.current) {
        socketRef.current.emit('task-updated', { roomId: ROOM_ID, task });
        showSyncStatus('syncing');
      }
    }, 100),
    [showSyncStatus]
  );

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      setState(prev => ({ ...prev, isConnected: true }));
      socket.emit('join-room', { roomId: ROOM_ID });
    });

    socket.on('disconnect', () => {
      setState(prev => ({ ...prev, isConnected: false }));
    });

    socket.on('sync-tasks', ({ tasks, dependencies }: { tasks: Task[]; dependencies: Dependency[] }) => {
      setState(prev => ({ ...prev, tasks, dependencies }));
      showSyncStatus('success');
    });

    socket.on('broadcast-task-created', (task: Task) => {
      setState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
      showSyncStatus('success');
    });

    socket.on('broadcast-task-updated', (updatedTask: Task) => {
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t))
      }));
    });

    socket.on('broadcast-task-deleted', ({ id }: { id: string }) => {
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== id),
        selectedTaskId: prev.selectedTaskId === id ? null : prev.selectedTaskId
      }));
    });

    socket.on('broadcast-dependency-created', (dependency: Dependency) => {
      setState(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, dependency]
      }));
    });

    socket.on('broadcast-dependency-deleted', ({ id }: { id: string }) => {
      setState(prev => ({
        ...prev,
        dependencies: prev.dependencies.filter(d => d.id !== id)
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [showSyncStatus]);

  useEffect(() => {
    const handleClickOutside = () => {
      setState(prev => ({
        ...prev,
        contextMenu: { ...prev.contextMenu, visible: false, taskId: null }
      }));
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredTasks = state.tasks.filter(task => {
    if (state.filterAssignee !== 'all' && task.assignee !== state.filterAssignee) return false;
    if (state.filterStatus !== 'all' && task.status !== state.filterStatus) return false;
    return true;
  });

  const handleTaskSelect = (taskId: string) => {
    setState(prev => ({ ...prev, selectedTaskId: taskId }));
  };

  const handleCreateTask = () => {
    setState(prev => ({
      ...prev,
      isModalOpen: true,
      editingTask: null
    }));
    modalFormRef.current = {
      name: '',
      assignee: ASSIGNEES[0],
      startDate: formatDate(new Date()),
      endDate: formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
      progress: 0
    };
  };

  const handleEditTask = (task: Task) => {
    setState(prev => ({
      ...prev,
      isModalOpen: true,
      editingTask: task
    }));
    modalFormRef.current = {
      name: task.name,
      assignee: task.assignee,
      startDate: task.startDate,
      endDate: task.endDate,
      progress: task.progress
    };
  };

  const handleDeleteTask = (taskId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('task-deleted', { roomId: ROOM_ID, id: taskId });
      showSyncStatus('syncing');
    }
    setState(prev => ({
      ...prev,
      contextMenu: { ...prev.contextMenu, visible: false, taskId: null }
    }));
  };

  const handleCloseModal = () => {
    setState(prev => ({ ...prev, isModalOpen: false, editingTask: null }));
  };

  const handleSaveTask = () => {
    const formData = modalFormRef.current;
    if (!formData.name.trim()) return;

    const taskData: Partial<Task> = {
      name: formData.name.trim(),
      assignee: formData.assignee,
      startDate: formData.startDate,
      endDate: formData.endDate,
      progress: formData.progress,
      color: getColorForAssignee(formData.assignee),
      dependencies: []
    };

    if (state.editingTask) {
      const updatedTask = { ...state.editingTask, ...taskData };
      if (socketRef.current) {
        socketRef.current.emit('task-updated', { roomId: ROOM_ID, task: updatedTask });
        showSyncStatus('syncing');
      }
    } else {
      if (socketRef.current) {
        socketRef.current.emit('task-created', { roomId: ROOM_ID, task: taskData });
        showSyncStatus('syncing');
      }
    }

    handleCloseModal();
  };

  const handleTaskDoubleClick = (task: Task) => {
    handleEditTask(task);
  };

  const handleTaskRightClick = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({
      ...prev,
      contextMenu: {
        visible: true,
        x: e.clientX,
        y: e.clientY,
        taskId
      }
    }));
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t))
    }));
    emitTaskUpdate(updatedTask);
  };

  const handleDependencyCreated = (fromTaskId: string, toTaskId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('dependency-created', {
        roomId: ROOM_ID,
        dependency: { fromTaskId, toTaskId }
      });
      showSyncStatus('syncing');
    }
  };

  const handleFilterChange = (type: 'assignee' | 'status', value: string) => {
    if (type === 'assignee') {
      setState(prev => ({ ...prev, filterAssignee: value }));
    } else {
      setState(prev => ({ ...prev, filterStatus: value }));
    }
  };

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }));
  };

  return (
    <>
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="sidebar-title">
          <GanttIcon size={20} />
          <span>团队甘特图</span>
        </div>
        <button className="mobile-menu-btn" onClick={handleCreateTask}>
          <Plus size={20} />
        </button>
      </div>

      <div className="app-container">
        <aside className={`sidebar ${state.isSidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-title">
              <GanttIcon size={20} />
              <span>团队甘特图</span>
            </div>
          </div>

          <div className="sidebar-controls">
            <button className="create-btn" onClick={handleCreateTask}>
              <Plus size={16} />
              <span>新建任务</span>
            </button>

            <select
              className="filter-select"
              value={state.filterAssignee}
              onChange={e => handleFilterChange('assignee', e.target.value)}
            >
              <option value="all">所有负责人</option>
              {ASSIGNEES.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={state.filterStatus}
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              <option value="all">所有状态</option>
              <option value="pending">待开始</option>
              <option value="in-progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="warning">有阻塞</option>
            </select>
          </div>

          <div className="task-list">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">暂无任务</div>
                <div className="empty-state-hint">点击"新建任务"开始创建</div>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`task-item ${state.selectedTaskId === task.id ? 'selected' : ''}`}
                  onClick={() => handleTaskSelect(task.id)}
                  onDoubleClick={() => handleTaskDoubleClick(task)}
                  onContextMenu={e => handleTaskRightClick(e, task.id)}
                >
                  <div className="task-item-header">
                    <span className="task-item-name">{task.name}</span>
                    <span className={`status-badge status-${task.status}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                  <div className="task-item-assignee">
                    <User size={12} />
                    <span>{task.assignee}</span>
                  </div>
                  <div className="task-item-progress">
                    <div className="progress-bar-small">
                      <div
                        className="progress-fill-small"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="progress-text-small">{task.progress}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="gantt-container">
          <GanttChart
            tasks={state.tasks}
            dependencies={state.dependencies}
            selectedTaskId={state.selectedTaskId}
            onTaskSelect={handleTaskSelect}
            onTaskUpdate={handleTaskUpdated}
            onTaskDoubleClick={handleTaskDoubleClick}
            onTaskRightClick={handleTaskRightClick}
            onDependencyCreate={handleDependencyCreated}
          />
        </main>
      </div>

      {state.isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {state.editingTask ? '编辑任务' : '新建任务'}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">任务名称</label>
                <input
                  type="text"
                  className="form-input"
                  defaultValue={modalFormRef.current.name}
                  onChange={e => (modalFormRef.current.name = e.target.value)}
                  placeholder="请输入任务名称"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">负责人</label>
                <select
                  className="form-select"
                  defaultValue={modalFormRef.current.assignee}
                  onChange={e => (modalFormRef.current.assignee = e.target.value)}
                >
                  {ASSIGNEES.map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">开始日期</label>
                  <input
                    type="date"
                    className="form-input"
                    defaultValue={modalFormRef.current.startDate}
                    onChange={e => (modalFormRef.current.startDate = e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">截止日期</label>
                  <input
                    type="date"
                    className="form-input"
                    defaultValue={modalFormRef.current.endDate}
                    onChange={e => (modalFormRef.current.endDate = e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  进度 ({modalFormRef.current.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="zoom-slider"
                  defaultValue={modalFormRef.current.progress}
                  onChange={e => {
                    modalFormRef.current.progress = parseInt(e.target.value, 10);
                    e.target.dispatchEvent(new Event('input'));
                  }}
                  onInput={e => {
                    const target = e.target as HTMLInputElement;
                    target.parentElement!.querySelector(
                      '.form-label'
                    )!.textContent = `进度 (${target.value}%)`;
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSaveTask}>
                {state.editingTask ? '保存修改' : '创建任务'}
              </button>
            </div>
          </div>
        </div>
      )}

      {state.contextMenu.visible && state.contextMenu.taskId && (
        <div
          className="context-menu"
          style={{ left: state.contextMenu.x, top: state.contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <div
            className="context-menu-item"
            onClick={() => {
              const task = state.tasks.find(t => t.id === state.contextMenu.taskId);
              if (task) handleEditTask(task);
            }}
          >
            <Edit size={16} />
            <span>编辑任务</span>
          </div>
          <div className="context-menu-separator" />
          <div
            className="context-menu-item danger"
            onClick={() => handleDeleteTask(state.contextMenu.taskId!)}
          >
            <Trash2 size={16} />
            <span>删除任务</span>
          </div>
        </div>
      )}

      {state.syncStatus !== 'idle' && (
        <div className={`sync-indicator ${state.syncStatus === 'success' ? 'success' : state.syncStatus === 'error' ? 'error' : ''}`}>
          {state.syncStatus === 'syncing' && <span className="syncing">⏳ 正在同步...</span>}
          {state.syncStatus === 'success' && <span>✓ 已同步</span>}
          {state.syncStatus === 'error' && <span>✗ 同步失败</span>}
        </div>
      )}
    </>
  );
}
