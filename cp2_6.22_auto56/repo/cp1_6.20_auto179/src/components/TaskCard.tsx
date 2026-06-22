import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Task } from '../data';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
  visible: boolean;
}

const priorityColors: Record<string, string> = {
  high: '#ff4d4f',
  medium: '#faad14',
  low: '#52c41a',
};

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick, visible }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`task-card ${visible ? 'fade-in' : 'fade-out'}`}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} scale(1.05)`
              : provided.draggableProps.style?.transform,
            boxShadow: snapshot.isDragging
              ? '0 12px 24px rgba(0, 0, 0, 0.15)'
              : '0 2px 8px rgba(0, 0, 0, 0.08)',
            transition: snapshot.isDragging ? 'none' : 'all 0.2s ease-in-out',
          }}
        >
          <div className="task-card-header">
            <span
              className="priority-tag"
              style={{
                backgroundColor: priorityColors[task.priority],
                color: '#fff',
              }}
            >
              {priorityLabels[task.priority]}
            </span>
            <span className="due-date">{task.dueDate}</span>
          </div>
          <h3 className="task-title">{task.title}</h3>
          <div className="task-footer">
            <span
              className="assignee-avatar"
              style={{
                backgroundColor: task.assignee.charCodeAt(0) % 2 === 0 ? '#1890ff' : '#52c41a',
              }}
            >
              {task.assignee.charAt(0)}
            </span>
            <span className="assignee-name">{task.assignee}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
