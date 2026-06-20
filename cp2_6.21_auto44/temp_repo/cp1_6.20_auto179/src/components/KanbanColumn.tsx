import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Task } from '../data';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  columnId: string;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  visibleTaskIds: Set<string>;
}

const columnColors: Record<string, string> = {
  todo: '#2c3e50',
  'in-progress': '#3498db',
  done: '#52c41a',
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  columnId,
  title,
  tasks,
  onTaskClick,
  visibleTaskIds,
}) => {
  return (
    <div className="kanban-column">
      <div className="column-header">
        <div
          className="column-indicator"
          style={{ backgroundColor: columnColors[columnId] }}
        />
        <h2 className="column-title">{title}</h2>
        <span className="task-count">{tasks.length}</span>
      </div>
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`column-content ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
                visible={visibleTaskIds.has(task.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
