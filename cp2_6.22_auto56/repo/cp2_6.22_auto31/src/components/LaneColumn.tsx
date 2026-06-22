import { Droppable } from 'react-beautiful-dnd';
import { Task } from '../types';
import TaskCard from './TaskCard';
import './components.css';

interface LaneColumnProps {
  title: string;
  status: Task['status'];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function LaneColumn({ title, status, tasks, onTaskClick }: LaneColumnProps) {
  return (
    <div className="lane-column">
      <div className="lane-header">
        <span className="lane-title">{title}</span>
        <span className="lane-count">{tasks.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="task-list"
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
