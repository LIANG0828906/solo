import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock } from 'lucide-react';
import type { Task } from '../types';
import { PRIORITY_COLORS } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => onEdit?.(task)}
    >
      <div className="task-card-header">
        <span
          className="task-priority"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        />
        <span className="task-title">{task.title}</span>
        <Clock
          className={`task-clock ${task.actualHours > 0 ? 'recorded' : ''}`}
          size={16}
        />
      </div>
      {task.description && (
        <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
          {task.description}
        </p>
      )}
      <div className="task-footer">
        <span className="task-assignee">{task.assignee || '未分配'}</span>
        <span className="task-estimate">{task.estimateHours}h</span>
      </div>
    </div>
  );
}
