import { Draggable } from 'react-beautiful-dnd';
import type { DraggableProvided } from 'react-beautiful-dnd';
import type { Task } from '../types';
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
  onStatusChange?: (taskId: string, status: Task['status']) => void;
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

function MobileStatusSelect({
  currentStatus,
  onChange,
}: {
  currentStatus: Task['status'];
  onChange: (s: Task['status']) => void;
}) {
  return (
    <select
      className="mobile-card-select"
      value={currentStatus}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as Task['status'])}
    >
      <option value="todo">待办</option>
      <option value="in-progress">进行中</option>
      <option value="done">已完成</option>
    </select>
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
  const cardContent = (
    <div
      className={`card ${isFiltered === 'hidden' ? 'filtered-out' : ''} ${
        isFiltered === 'dimmed' ? 'filtered-dimmed' : ''
      }`}
      onClick={() => isFiltered === 'visible' && onClick(task)}
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
          <MobileStatusSelect
            currentStatus={task.status}
            onChange={(s) => onStatusChange && onStatusChange(task.id, s)}
          />
        ) : (
          <span>{formatTime(task.createdAt)}</span>
        )}
        <span className="card-comments">
          💬 {task.comments.length}
        </span>
      </div>
    </div>
  );

  if (isMobile || isFiltered !== 'visible') {
    return cardContent;
  }

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isFiltered !== 'visible'}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={snapshot.isDragging ? 'card dragging' : ''}
        >
          <div
            className={`card ${snapshot.isDragging ? 'dragging' : ''}`}
            onClick={() => onClick(task)}
            style={{
              boxShadow: snapshot.isDragging
                ? '0 4px 8px rgba(0,0,0,0.2)'
                : '0 1px 3px rgba(0,0,0,0.12)',
              transform: snapshot.isDragging ? 'scale(1.02)' : undefined,
              transition: 'all 0.2s ease',
            }}
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
              <span>{formatTime(task.createdAt)}</span>
              <span className="card-comments">💬 {task.comments.length}</span>
            </div>
          </div>
          {(provided as DraggableProvidedExt).placeholder}
        </div>
      )}
    </Draggable>
  );
}
