import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { Task, TeamMember } from '@/types';
import styles from './TaskDetailModal.module.css';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task: Task | null;
  teamMembers: TeamMember[];
}

export function TaskDetailModal({ isOpen, onClose, onSave, task, teamMembers }: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState<string | null>(null);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [estimate, setEstimate] = useState(0);
  const [status, setStatus] = useState<Task['status']>('todo');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setAssignee(task.assignee);
      setPriority(task.priority);
      setEstimate(task.estimate);
      setStatus(task.status);
    } else {
      setTitle('');
      setDescription('');
      setAssignee(null);
      setPriority('medium');
      setEstimate(0);
      setStatus('todo');
    }
  }, [task, isOpen]);

  const handleSave = () => {
    onSave({
      title,
      description,
      assignee,
      priority,
      estimate,
      status,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? '编辑任务' : '新建任务'}>
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>标题</label>
          <input
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入任务标题"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>描述</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入任务描述"
            rows={3}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>负责人</label>
            <select
              className={styles.select}
              value={assignee || ''}
              onChange={(e) => setAssignee(e.target.value || null)}
            >
              <option value="">未分配</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>优先级</label>
            <select
              className={styles.select}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task['priority'])}
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>预估工时</label>
            <input
              type="number"
              className={styles.input}
              value={estimate}
              onChange={(e) => setEstimate(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>状态</label>
            <select
              className={styles.select}
              value={status}
              onChange={(e) => setStatus(e.target.value as Task['status'])}
            >
              <option value="todo">待办</option>
              <option value="in-progress">进行中</option>
              <option value="done">已完成</option>
            </select>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            取消
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default TaskDetailModal;
