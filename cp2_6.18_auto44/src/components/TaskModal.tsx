import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/taskStore';
import type { Task, Priority, TaskStatus } from '@/types';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose }) => {
  const { addTask, updateTask, deleteTask, members, currentProjectId } = useTaskStore();

  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setAssigneeId(task.assigneeId);
      setDueDate(task.dueDate);
      setPriority(task.priority);
      setStatus(task.status);
    } else {
      setTitle('');
      setAssigneeId(members[0]?.id || '');
      const today = new Date();
      today.setDate(today.getDate() + 7);
      setDueDate(today.toISOString().split('T')[0]);
      setPriority('medium');
      setStatus('todo');
    }
  }, [task, isOpen, members]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentProjectId) return;

    if (task) {
      updateTask(task.id, {
        title: title.trim(),
        assigneeId,
        dueDate,
        priority,
        status,
      });
    } else {
      addTask({
        title: title.trim(),
        assigneeId,
        dueDate,
        priority,
        status,
        projectId: currentProjectId,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (task && window.confirm('确定要删除这个任务吗？')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h2 className="modal-title">{task ? '编辑任务' : '新建任务'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">任务标题</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务标题"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">负责人</label>
            <select
              className="form-select"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">截止日期</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">优先级</label>
            <select
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">状态</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="todo">待办</option>
              <option value="in-progress">进行中</option>
              <option value="done">已完成</option>
            </select>
          </div>

          <div className="modal-actions">
            {task && (
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                删除
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {task ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(TaskModal);
