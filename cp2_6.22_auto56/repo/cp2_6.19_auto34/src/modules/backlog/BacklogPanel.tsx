import React, { useState, useMemo } from 'react';
import { TaskCard } from './TaskCard';
import { Modal } from '@/components/Modal';
import { useAppStore } from '@/store/useAppStore';
import type { Task, PriorityFilter, StatusFilter } from '@/types';
import styles from './backlog.module.css';

interface BacklogPanelProps {
  onTaskClick?: (task: Task) => void;
}

export const BacklogPanel: React.FC<BacklogPanelProps> = ({ onTaskClick }) => {
  const { tasks, teamMembers, addTask, getBacklogTasks } = useAppStore();

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    status: 'todo' as Task['status'],
    assignee: '' as string,
    estimate: 1,
  });

  const backlogTasks = useMemo(() => {
    return getBacklogTasks();
  }, [tasks, getBacklogTasks]);

  const filteredTasks = useMemo(() => {
    return backlogTasks.filter((task) => {
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      if (assigneeFilter !== 'all' && task.assignee !== assigneeFilter) {
        return false;
      }
      return true;
    });
  }, [backlogTasks, priorityFilter, statusFilter, assigneeFilter]);

  const handleTaskClick = (task: Task) => {
    onTaskClick?.(task);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      assignee: '',
      estimate: 1,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    addTask({
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      priority: newTask.priority,
      status: newTask.status,
      assignee: newTask.assignee || null,
      estimate: newTask.estimate,
      sprintId: null,
    });

    handleCloseModal();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: name === 'estimate' ? Number(value) : value,
    }));
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>待办事项</h2>

        <div className={styles.filterSection}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>优先级</label>
            <select
              className={styles.filterSelect}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            >
              <option value="all">全部</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>状态</label>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">全部</option>
              <option value="todo">未开始</option>
              <option value="in-progress">进行中</option>
              <option value="done">已完成</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>负责人</label>
            <select
              className={styles.filterSelect}
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="all">全部</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className={styles.addButton} onClick={handleOpenModal}>
          新建任务
        </button>
      </div>

      <div className={styles.taskList}>
        {filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>暂无任务</div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className={styles.taskItem}>
              <TaskCard
                task={task}
                onDragStart={handleDragStart}
                onClick={handleTaskClick}
              />
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="新建任务">
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>任务标题</label>
            <input
              type="text"
              name="title"
              className={styles.formInput}
              value={newTask.title}
              onChange={handleInputChange}
              placeholder="请输入任务标题"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>任务描述</label>
            <textarea
              name="description"
              className={styles.formTextarea}
              value={newTask.description}
              onChange={handleInputChange}
              placeholder="请输入任务描述"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>优先级</label>
              <select
                name="priority"
                className={styles.formSelect}
                value={newTask.priority}
                onChange={handleInputChange}
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>预估工时</label>
              <input
                type="number"
                name="estimate"
                className={styles.formInput}
                value={newTask.estimate}
                onChange={handleInputChange}
                min={1}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>状态</label>
              <select
                name="status"
                className={styles.formSelect}
                value={newTask.status}
                onChange={handleInputChange}
              >
                <option value="todo">未开始</option>
                <option value="in-progress">进行中</option>
                <option value="done">已完成</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>负责人</label>
              <select
                name="assignee"
                className={styles.formSelect}
                value={newTask.assignee}
                onChange={handleInputChange}
              >
                <option value="">未分配</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCloseModal}
            >
              取消
            </button>
            <button type="submit" className={styles.submitButton}>
              创建
            </button>
          </div>
        </form>
      </Modal>
    </aside>
  );
};

export default BacklogPanel;
