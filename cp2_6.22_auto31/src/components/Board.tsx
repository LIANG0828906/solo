import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Task } from '../types';
import LaneColumn from './LaneColumn';
import './components.css';

interface BoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskMove: (taskId: string, status: Task['status'], order: number) => void;
}

const lanes = [
  { status: 'todo' as const, title: '待办' },
  { status: 'in-progress' as const, title: '进行中' },
  { status: 'done' as const, title: '已完成' },
];

export default function Board({ tasks, onTaskClick, onTaskMove }: BoardProps) {
  const getTasksByStatus = (status: Task['status']) => {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, source, destination } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as Task['status'];
    const destStatus = destination.droppableId as Task['status'];
    const destIndex = destination.index;

    const sourceTasks = getTasksByStatus(sourceStatus);
    const destTasks = getTasksByStatus(destStatus);

    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (sourceStatus === destStatus) {
      sourceTasks.splice(destIndex, 0, movedTask);
      sourceTasks.forEach((task, idx) => {
        if (task.id !== movedTask.id || idx !== source.index) {
          task.order = idx;
        }
      });
    } else {
      destTasks.splice(destIndex, 0, movedTask);
      destTasks.forEach((task, idx) => {
        task.order = idx;
      });
    }

    const newOrder = destIndex;

    onTaskMove(draggableId, destStatus, newOrder);
  };

  return (
    <div className="board-container">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board-columns">
          {lanes.map((lane) => (
            <LaneColumn
              key={lane.status}
              title={lane.title}
              status={lane.status}
              tasks={getTasksByStatus(lane.status)}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
