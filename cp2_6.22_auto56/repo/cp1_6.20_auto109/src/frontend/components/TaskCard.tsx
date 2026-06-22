import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, TeamMember, priorityColors, priorityLabels } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  assignee: TeamMember | undefined;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index, assignee }) => {
  const isOverdue =
    task.status !== 'done' && new Date(task.dueDate) < new Date();
  const priorityColor = priorityColors[task.priority];
  const initial = assignee ? assignee.name.charAt(0) : '?';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatCompletedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `完成于 ${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''} fade-in-up`}
          style={{
            ...provided.draggableProps.style,
            animationDelay: `${index * 50}ms`,
          }}
        >
          <div
            className="priority-bar"
            style={{ background: priorityColor }}
          />
          {task.status === 'done' && (
            <div className="completed-badge">✓</div>
          )}
          <div className="task-title">{task.title}</div>
          <div className="task-desc">{task.description}</div>
          <div className="task-footer">
            <div className="task-assignee">
              <div
                className="avatar"
                style={{ background: assignee?.avatarColor || '#ccc' }}
              >
                {initial}
              </div>
              <div>
                <div className="assignee-name">
                  {assignee?.name || '未分配'}
                </div>
                <div
                  className="priority-tag"
                  style={{ background: priorityColor }}
                >
                  {priorityLabels[task.priority]}
                </div>
              </div>
            </div>
            <div className={`due-date ${isOverdue ? 'overdue' : ''}`}>
              📅 {formatDate(task.dueDate)}
            </div>
          </div>
          {task.completedAt && (
            <div className="completed-time" style={{ paddingLeft: 8 }}>
              {formatCompletedDate(task.completedAt)}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
