import React from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus, STATUS_LABELS } from '../types';
import TaskCard from './TaskCard';

interface BoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskMove: (taskId: string, status: TaskStatus, order: number) => void;
  onAddTask: (status: TaskStatus) => void;
}

const Board: React.FC<BoardProps> = ({ tasks, onTaskClick, onTaskMove, onAddTask }) => {
  const columns: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: STATUS_LABELS['todo'] },
    { id: 'in-progress', title: STATUS_LABELS['in-progress'] },
    { id: 'done', title: STATUS_LABELS['done'] },
  ];

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const newOrder = destination.index;

    onTaskMove(draggableId, newStatus, newOrder);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="board">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div key={column.id} className="swimlane">
              <div className="swimlane-header">
                <div className="swimlane-title">
                  {column.title}
                  <span className="swimlane-count">{columnTasks.length}</span>
                </div>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`swimlane-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {columnTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onClick={() => onTaskClick(task)}
                      />
                    ))}
                    {provided.placeholder}
                    <button
                      className="add-task-btn"
                      onClick={() => onAddTask(column.id)}
                    >
                      + 添加任务
                    </button>
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default Board;
