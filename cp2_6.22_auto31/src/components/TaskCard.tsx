import { Draggable } from 'react-beautiful-dnd';
import { Task } from '../types';
import './components.css';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  const priorityClass = `priority-${task.priority}`;
  const descriptionPreview = task.description?.slice(0, 40);
  const hasMore = task.description && task.description.length > 40;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          onClick={() => onClick(task)}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1,
          }}
        >
          <div className="task-card-header">
            <span className={`priority-dot ${priorityClass}`}></span>
          </div>
          <h4 className="task-title">{task.title}</h4>
          {descriptionPreview && (
            <p className="task-description-preview">
              {descriptionPreview}{hasMore ? '...' : ''}
            </p>
          )}
          <div className="task-card-footer">
            <span className="task-assignee">{task.assignee}</span>
            <span className="story-points">{task.storyPoints}p</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
