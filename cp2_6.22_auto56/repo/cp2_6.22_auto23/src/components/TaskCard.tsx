import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, PRIORITY_COLORS } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging ? '0 6px 12px rgba(0,0,0,0.15)' : undefined,
          }}
          onClick={onClick}
        >
          <div className="task-card-title">{task.title}</div>
          <div className="task-card-meta">
            <div className="task-priority">
              <span
              className="priority-dot"
              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
              />
              {task.priority === 'high' ? '高优先级' : task.priority === 'medium' ? '中优先级' : '低优先级'}
            </div>
          </div>
          <div className="task-card-footer">
            <div className="task-assignee">
              <span>👤</span>
              {task.assignee}
            </div>
            <span className="task-story-points">{task.storyPoints} SP</span>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
