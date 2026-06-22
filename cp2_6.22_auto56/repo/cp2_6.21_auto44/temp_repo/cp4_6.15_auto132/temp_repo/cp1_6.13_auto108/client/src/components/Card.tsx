import { Draggable } from 'react-beautiful-dnd';
import type { DraggableProvided } from 'react-beautiful-dnd';
import type { Task, TaskStatus } from '../types';
import { PRIORITY_COLORS, TAG_COLORS } from '../types';

interface DraggableProvidedExt extends DraggableProvided {
  placeholder: React.ReactNode;
}

interface CardProps {
  task: Task;
  onClick: (task: Task) => void;
  index: number;
  isFiltered: 'visible' | 'dimmed' | 'hidden';
  isMobile: boolean;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

interface CardInnerProps {
  task: Task;
  onClick: () => void;
  isFiltered: 'visible' | 'dimmed' | 'hidden';
  isMobile: boolean;
  isDragging?: boolean;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

function CardInner({
  task,
  onClick,
  isFiltered,
  isMobile,
  isDragging,
  onStatusChange,
}: CardInnerProps) {
  const isDimmed = isFiltered === 'dimmed';
  const isHidden = isFiltered === 'hidden';

  const classNames = ['card'];
  if (isDragging) classNames.push('card-dragging');
  if (isDimmed) classNames.push('filtered-dimmed');
  if (isHidden) classNames.push('filtered-out');

  const inlineStyle: React.CSSProperties = {
    boxShadow: isDragging
      ? '0 4px 8px rgba(0,0,0,0.2)'
      : '0 1px 3px rgba(0,0,0,0.12)',
    transform: isDragging ? 'scale(1.03)' : undefined,
    transition: 'box-shadow 0.2s ease, transform 0.2s ease, opacity 0.3s ease, filter 0.3s ease',
  };

  return (
    <div
      className={classNames.join(' ')}
      onClick={() => !isDimmed && !isHidden && onClick()}
      style={inlineStyle}
    >
      <div className="card-header">
        <div className="card-title">{task.title}</div>
        <div
          className="card-priority"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        >
          {task.priority}
        </div>
      </div>

      {task.tags.length > 0 && (
        <div className="card-tags">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="card-tag"
              style={{ backgroundColor: TAG_COLORS[tag] }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="card-footer">
        {isMobile ? (
          <select
            className="mobile-card-select"
            value={task.status}
            disabled={isDimmed}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              onStatusChange && onStatusChange(task.id, e.target.value as TaskStatus)
            }
          >
            <option value="todo">待办</option>
            <option value="in-progress">进行中</option>
            <option value="done">已完成</option>
          </select>
        ) : (
          <span>{formatTime(task.createdAt)}</span>
        )}
        <span className="card-comments">💬 {task.comments.length}</span>
      </div>
    </div>
  );
}

export default function Card({
  task,
  onClick,
  index,
  isFiltered,
  isMobile,
  onStatusChange,
}: CardProps) {
  const isDragDisabled = isFiltered !== 'visible';

  if (isMobile) {
    return (
      <CardInner
        task={task}
        onClick={() => onClick(task)}
        isFiltered={isFiltered}
        isMobile={true}
        onStatusChange={onStatusChange}
      />
    );
  }

  if (isDragDisabled) {
    return (
      <CardInner
        task={task}
        onClick={() => onClick(task)}
        isFiltered={isFiltered}
        isMobile={false}
      />
    );
  }

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={false}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <CardInner
            task={task}
            onClick={() => onClick(task)}
            isFiltered={isFiltered}
            isMobile={false}
            isDragging={snapshot.isDragging}
          />
          {(provided as DraggableProvidedExt).placeholder}
        </div>
      )}
    </Draggable>
  );
}
