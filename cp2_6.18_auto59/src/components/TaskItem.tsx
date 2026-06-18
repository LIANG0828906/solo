import { useState } from 'react';
import { useDayBriefStore } from '../store';
import type { Task } from '../types';
import { formatEstimatedTime } from '../utils/formatters';
import { Pencil, Trash2, Check } from 'lucide-react';
import styles from '../styles/TaskItem.module.css';

interface TaskItemProps {
  task: Task;
}

const priorityDotClass: Record<string, string> = {
  P0: styles.priorityP0,
  P1: styles.priorityP1,
  P2: styles.priorityP2,
};

const priorityLabelClass: Record<string, string> = {
  P0: styles.priorityLabelP0,
  P1: styles.priorityLabelP1,
  P2: styles.priorityLabelP2,
};

export default function TaskItem({ task }: TaskItemProps) {
  const toggleTaskStatus = useDayBriefStore((s) => s.toggleTaskStatus);
  const updateTask = useDayBriefStore((s) => s.updateTask);
  const removeTask = useDayBriefStore((s) => s.removeTask);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);

  const isCompleted = task.status === 'completed';

  const handleToggle = () => {
    toggleTaskStatus(task.id);
  };

  const handleStartEdit = () => {
    setEditContent(task.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      updateTask(task.id, { content: editContent.trim() });
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className={`${styles.taskCard} ${isCompleted ? styles.taskCardCompleted : ''}`}>
      <div className={styles.dragHandle}>
        <div className={styles.dragHandleDot} />
        <div className={styles.dragHandleDot} />
        <div className={styles.dragHandleDot} />
      </div>

      <div className={`${styles.priorityDot} ${priorityDotClass[task.priority]}`} />

      <div className={styles.checkboxWrapper} onClick={handleToggle}>
        <div className={`${styles.checkbox} ${isCompleted ? styles.checkboxChecked : ''}`}>
          {isCompleted && <Check className={styles.checkboxCheckmark} size={14} />}
        </div>
      </div>

      <div className={styles.taskContent}>
        {isEditing ? (
          <input
            className={styles.editInput}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleEditKeyDown}
            autoFocus
          />
        ) : (
          <div
            className={`${styles.taskText} ${isCompleted ? styles.taskTextCompleted : ''}`}
            onDoubleClick={handleStartEdit}
          >
            {task.content}
          </div>
        )}
        <div className={styles.taskMeta}>
          <span className={`${styles.priorityLabel} ${priorityLabelClass[task.priority]}`}>
            {task.priority}
          </span>
          <span className={styles.timeBadge}>{formatEstimatedTime(task.estimatedMinutes)}</span>
        </div>
      </div>

      <div className={styles.actionButtons}>
        <button
          className={`${styles.actionBtn} ${styles.editBtn}`}
          onClick={handleStartEdit}
          aria-label="编辑"
        >
          <Pencil size={14} />
        </button>
        <button
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={() => removeTask(task.id)}
          aria-label="删除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
