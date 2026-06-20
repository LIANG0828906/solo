import React, { useMemo } from 'react';
import { Calendar, User } from 'lucide-react';
import { Draggable } from 'react-beautiful-dnd';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
  const { members } = useTaskStore();

  const assignee = useMemo(
    () => members.find((m) => m.id === task.assigneeId),
    [members, task.assigneeId]
  );

  const priorityLabel = {
    high: '高',
    medium: '中',
    low: '低',
  }[task.priority];

  const isOverdue = useMemo(() => {
    if (task.status === 'done') return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < now;
  }, [task.dueDate, task.status]);

  const formattedDate = useMemo(() => {
    const date = new Date(task.dueDate);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, [task.dueDate]);

  const getInitials = (name: string) => {
    return name.slice(-2);
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'dragging' : 'fade-in'}`}
          onClick={(e) => {
            if (!snapshot.isDragging) {
              e.stopPropagation();
              onClick();
            }
          }}
          style={{
            ...provided.draggableProps.style,
            transition: snapshot.isDragging
              ? 'none'
              : 'all 0.2s ease, transform 0.2s ease',
          }}
        >
          <h3 className="task-card-title">{task.title}</h3>
          <div className="task-card-meta">
            <div className="task-card-row">
              <span className={`priority-tag priority-${task.priority}`}>
                {priorityLabel}
              </span>
            </div>
            <div className="task-card-row">
              <User size={14} />
              {assignee && (
                <>
                  <div className="assignee-avatar">
                    {getInitials(assignee.name)}
                  </div>
                  <span>{assignee.name}</span>
                </>
              )}
            </div>
            <div className="task-card-row">
              <Calendar size={14} />
              <span className={isOverdue ? 'overdue-date' : ''}>
                {formattedDate}
                {isOverdue && ' (已逾期)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default React.memo(TaskCard);
