import React, { useState, useRef, useEffect } from 'react';
import { useApp } from './context';
import { Task, TaskStatus, STATUS_LABELS, TAG_COLOR_MAP, User } from './types';
import TaskManager from './TaskManager';

const STATUS_CONFIG: Record<TaskStatus, { color: string; dot: string }> = {
  todo: { color: '#94A3B8', dot: '#94A3B8' },
  'in-progress': { color: '#6366F1', dot: '#6366F1' },
  done: { color: '#10B981', dot: '#10B981' },
};

const TaskCard: React.FC<{
  task: Task;
  user?: User;
  onEdit: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}> = ({ task, user, onEdit, onDragStart, onDragEnd, isDragging }) => {
  return (
    <div
      className={`task-card ${task.blockedReason ? 'blocked' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onEdit(task)}
    >
      <h4 className="task-card-title">{task.title}</h4>
      {task.description && <p className="task-card-desc">{task.description}</p>}

      {task.tags.length > 0 && (
        <div className="task-card-tags">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="task-tag"
              style={{ background: TAG_COLOR_MAP[tag.color] }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {task.blockedReason && (
        <div className="blocked-indicator" title={task.blockedReason}>
          ⚠ 阻塞: {task.blockedReason}
        </div>
      )}

      <div className="task-card-footer">
        <div className="task-card-meta">
          {user && <div className="assignee-avatar">{user.avatar}</div>}
          {task.estimatedHours > 0 && (
            <span className="hours-badge">{task.estimatedHours}h</span>
          )}
        </div>
        {!user && !task.estimatedHours ? null : null}
      </div>
    </div>
  );
};

const Board: React.FC = () => {
  const { tasks, currentProject, users, createTask, updateTask, deleteTask } = useApp();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    await updateTask(taskId, { status });
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newTaskTitle.trim()) return;
    await createTask(currentProject.id, {
      title: newTaskTitle.trim(),
      status: newTaskStatus,
      tags: [],
      estimatedHours: 0,
    });
    setNewTaskTitle('');
    setShowNewTaskModal(false);
  };

  const getUser = (id?: string) => users.find((u) => u.id === id);

  const statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  if (!currentProject) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 48 }}>📋</div>
        <div>暂无项目，请先在顶部创建一个新项目</div>
      </div>
    );
  }

  return (
    <div className="board-wrapper">
      <div className="board-columns">
        {statuses.map((status) => {
          const config = STATUS_CONFIG[status];
          const statusTasks = getTasksByStatus(status);
          return (
            <div key={status} className="board-column">
              <div className="board-column-header">
                <div className="board-column-title">
                  <span className="dot" style={{ background: config.dot }} />
                  {STATUS_LABELS[status]}
                </div>
                <span className="board-column-count">{statusTasks.length}</span>
              </div>
              <div
                className={`task-list ${dragOverStatus === status ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                {statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    user={getUser(task.assigneeId)}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setShowTaskManager(true);
                    }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedTaskId === task.id}
                  />
                ))}
              </div>
              <button
                className="add-task-btn"
                onClick={() => {
                  setNewTaskStatus(status);
                  setShowNewTaskModal(true);
                }}
              >
                + 添加任务
              </button>
            </div>
          );
        })}
      </div>

      {showNewTaskModal && (
        <div className="modal-overlay" onClick={() => setShowNewTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">新建任务 - {STATUS_LABELS[newTaskStatus]}</h3>
              <button className="modal-close" onClick={() => setShowNewTaskModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label>任务标题 *</label>
                <input
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="请输入任务标题"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowNewTaskModal(false)}>
                  取消
                </button>
                <button type="submit" className="accent">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskManager && editingTask && (
        <TaskManager
          task={editingTask}
          onClose={() => {
            setShowTaskManager(false);
            setEditingTask(null);
          }}
          onDelete={async (id) => {
            await deleteTask(id);
            setShowTaskManager(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

export default Board;
