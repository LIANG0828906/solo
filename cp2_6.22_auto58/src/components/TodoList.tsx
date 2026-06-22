import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus, Priority } from '../types';
import '../styles/TodoList.css';

interface TodoListProps {
  tasks: Task[];
  status: TaskStatus;
  title: string;
}

const priorityLabels: Record<Priority, string> = {
  'high': '高',
  'medium': '中',
  'low': '低',
};

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
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
    zIndex: isDragging ? 10 : undefined,
  };

  const formatHours = (hours: number) => {
    if (hours >= 1) {
      return `${hours}小时`;
    }
    return `${Math.round(hours * 60)}分钟`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card priority-${task.priority} ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="priority-bar" />
      <div className="task-content">
        <h4 className="task-title">{task.title}</h4>
        <div className="task-meta">
          <span className="meta-item">
            <span className="meta-label">预计:</span>
            {formatHours(task.estimatedHours)}
          </span>
          <span className="meta-item">
            <span className="meta-label">专注:</span>
            {task.focusCount}次
          </span>
        </div>
        <div className="task-priority-tag">
          {priorityLabels[task.priority]}优先级
        </div>
      </div>
    </div>
  );
}

function TodoList({ tasks, status, title }: TodoListProps) {
  const columnTasks = tasks
    .filter(t => t.status === status)
    .sort((a, b) => {
      const priorityOrder: Record<Priority, number> = { 'high': 0, 'medium': 1, 'low': 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.order - b.order;
    });

  return (
    <div className="kanban-column" data-status={status}>
      <div className="column-header">
        <h3 className="column-title">{title}</h3>
        <span className="task-count">{columnTasks.length}</span>
      </div>
      <div className="task-list" data-column={status}>
        {columnTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
        {columnTasks.length === 0 && (
          <div className="empty-state">
            暂无任务
          </div>
        )}
      </div>
    </div>
  );
}

export default TodoList;
