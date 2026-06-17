import React, { useMemo, useState } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { Plus, ClipboardList } from 'lucide-react';
import TaskCard from './TaskCard';
import { useTaskStore, useFilteredTasks } from '@/store/taskStore';
import type { TaskStatus, Task } from '@/types';

interface TaskBoardProps {
  onEditTask: (task: Task) => void;
}

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: '待办' },
  { id: 'in-progress', title: '进行中' },
  { id: 'done', title: '已完成' },
];

const TaskBoard: React.FC<TaskBoardProps> = ({ onEditTask }) => {
  const { moveTask, currentProjectId } = useTaskStore();
  const filteredTasks = useFilteredTasks();
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      'todo': [],
      'in-progress': [],
      'done': [],
    };

    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [filteredTasks]);

  const handleDragStart = () => {
  };

  const handleDragUpdate = (update: { destination?: { droppableId: string } | null }) => {
    if (update.destination) {
      setDragOverColumn(update.destination.droppableId as TaskStatus);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    setDragOverColumn(null);

    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as TaskStatus;

    moveTask(draggableId, newStatus);
  };

  if (!currentProjectId) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <ClipboardList size={48} />
        </div>
        <p className="empty-state-text">请先选择或创建一个项目</p>
        <p className="empty-state-hint">在左侧边栏中管理您的项目</p>
      </div>
    );
  }

  const hasTasks = filteredTasks.length > 0;

  return (
    <div className="board-container">
      {!hasTasks && (
        <div className="empty-state" style={{ padding: '40px 0' }}>
          <div className="empty-state-icon">
            <Plus size={48} />
          </div>
          <p className="empty-state-text">暂无任务</p>
          <p className="empty-state-hint">点击上方"添加任务"按钮创建第一个任务</p>
        </div>
      )}

      {hasTasks && (
        <DragDropContext
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
          onDragEnd={handleDragEnd}
        >
          <div className="board">
            {columns.map((column) => (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`board-column ${snapshot.isDraggingOver || dragOverColumn === column.id ? 'drag-over' : ''}`}
                  >
                    <div className="column-header">
                      <h3 className="column-title">{column.title}</h3>
                      <span className="column-count">
                        {tasksByStatus[column.id].length}
                      </span>
                    </div>
                    <div className="task-list">
                      {tasksByStatus[column.id].map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onClick={() => onEditTask(task)}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

export default React.memo(TaskBoard);
