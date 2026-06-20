import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBoardStore } from '../../store/boardStore';
import type { TaskData } from '../../types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../types';

interface CardProps {
  task: TaskData;
  isDragging?: boolean;
  onEdit?: () => void;
}

function Card({ task, isDragging = false, onEdit }: CardProps) {
  const deleteTask = useBoardStore((s) => s.deleteTask);
  const isBlocked = useBoardStore((s) => s.isTaskBlocked);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    disabled: isDragging,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const blocked = isBlocked(task.id);
  const initialChar = task.assignee ? task.assignee.charAt(0) : '?';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确认删除任务"${task.title}"？`)) {
      deleteTask(task.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card card-priority-${task.priority} ${isDragging ? 'dragging' : ''}`}
      {...(!isDragging ? { ...attributes, ...listeners } : {})}
      onClick={onEdit}
    >
      {blocked && <span className="card-blocked">阻塞</span>}

      {!isDragging && (
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="card-action-btn"
            title="编辑"
            onClick={onEdit}
          >
            ✎
          </button>
          <button
            className="card-action-btn delete"
            title="删除"
            onClick={handleDelete}
          >
            ×
          </button>
        </div>
      )}

      <div className="card-title">{task.title}</div>
      <div className="card-meta">
        <div className="card-meta-left">
          {task.assignee && <div className="avatar">{initialChar}</div>}
          <span
            className={`priority-tag priority-${task.priority}`}
            style={{ background: PRIORITY_COLORS[task.priority] }}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>
        <span className="card-hours">{task.estimated_hours}h</span>
      </div>
    </div>
  );
}

export default Card;
