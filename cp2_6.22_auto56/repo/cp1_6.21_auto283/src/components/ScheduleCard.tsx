import React, { useRef } from 'react';
import type { Schedule } from '../types';

interface ScheduleCardProps {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onDragStart: (e: React.DragEvent, schedule: Schedule) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  onEdit,
  onDelete,
  onToggleComplete,
  onDragStart,
  onDragEnd,
  isDragging = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(schedule);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定删除这个日程吗？')) {
      onDelete(schedule.id);
    }
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(schedule.id);
  };

  return (
    <div
      ref={cardRef}
      className={`schedule-card priority-${schedule.priority} ${schedule.completed ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, schedule)}
      onDragEnd={onDragEnd}
      onDoubleClick={handleDoubleClick}
    >
      <div className="card-actions">
        <button
          className="card-action-btn check"
          onClick={handleToggleComplete}
          title={schedule.completed ? '标记未完成' : '标记完成'}
        >
          {schedule.completed ? '↩' : '✓'}
        </button>
        <button
          className="card-action-btn delete"
          onClick={handleDelete}
          title="删除"
        >
          ×
        </button>
      </div>
      <div className="card-content">
        <div className="card-title">{schedule.title}</div>
        <div className="card-time">{schedule.startTime} - {schedule.endTime}</div>
        {schedule.notes && (
          <div
            className="card-notes"
            dangerouslySetInnerHTML={{ __html: schedule.notes }}
          />
        )}
      </div>
    </div>
  );
};

export default ScheduleCard;
