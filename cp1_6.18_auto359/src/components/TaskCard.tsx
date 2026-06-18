import { memo, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, User, Trash2 } from 'lucide-react';
import { EmotionPicker } from './EmotionPicker';
import { CommentList } from './CommentList';
import { useStore } from '@/store';
import { formatDueDate } from '@/utils/date';
import { STATUS_MAP, EMOTION_MAP } from '@/types';
import type { Task, EmotionType } from '@/types';

interface TaskCardProps {
  task: Task;
  index: number;
}

export const TaskCard = memo(function TaskCard({ task, index }: TaskCardProps) {
  const { updateTaskEmotion, deleteTask } = useStore();
  const [showDelete, setShowDelete] = useState(false);

  const handleEmotionChange = (emotion: EmotionType) => {
    updateTaskEmotion(task.id, emotion);
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个任务吗？')) {
      deleteTask(task.id);
    }
  };

  const statusConfig = STATUS_MAP[task.status];
  const emotionConfig = task.emotion ? EMOTION_MAP[task.emotion] : null;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="task-card"
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(3deg)`
              : provided.draggableProps.style?.transform,
            opacity: snapshot.isDragging ? 0.9 : 1,
            zIndex: snapshot.isDragging ? 1000 : 'auto',
          }}
          onMouseEnter={() => setShowDelete(true)}
          onMouseLeave={() => setShowDelete(false)}
        >
          <div className={`status-bar status-${task.status}`} />
          
          <div className="task-card-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.4, flex: 1 }}>
                {task.title}
              </h4>
              {showDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    padding: '4px',
                    borderRadius: '4px',
                    color: 'var(--color-text-secondary)',
                    transition: 'color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {task.description && (
              <p style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {task.description}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
              {task.assignee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                  <User size={12} />
                  <span>{task.assignee}</span>
                </div>
              )}
              {task.dueDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                  <Calendar size={12} />
                  <span>{formatDueDate(task.dueDate)}</span>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginTop: '4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  状态：
                </span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: statusConfig.color + '20',
                  color: statusConfig.color,
                  fontWeight: 500,
                }}>
                  {statusConfig.label}
                </span>
              </div>
              {emotionConfig && (
                <span style={{ fontSize: '16px' }} title={emotionConfig.label}>
                  {emotionConfig.emoji}
                </span>
              )}
            </div>

            <EmotionPicker value={task.emotion} onChange={handleEmotionChange} />

            <CommentList taskId={task.id} />
          </div>
        </div>
      )}
    </Draggable>
  );
});
