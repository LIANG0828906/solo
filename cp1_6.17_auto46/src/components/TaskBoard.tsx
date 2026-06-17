import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task } from '../types';
import { TaskCard } from './TaskCard';
import { useTaskStore } from '../store/useTaskStore';

const columns = [
  { id: 'todo', title: '待办', color: '#FAAD14', bgColor: '#FFFBE6' },
  { id: 'in-progress', title: '进行中', color: '#52C41A', bgColor: '#F6FFED' },
  { id: 'done', title: '完成', color: '#1890FF', bgColor: '#E6F7FF' },
] as const;

type ColumnId = (typeof columns)[number]['id'];

export const TaskBoard: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const searchKeyword = useTaskStore((state) => state.searchKeyword);
  const updateStatus = useTaskStore((state) => state.updateStatus);

  const filteredTasks = useMemo(() => {
    if (!searchKeyword) return tasks;
    const keyword = searchKeyword.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(keyword) ||
        task.assignee.toLowerCase().includes(keyword)
    );
  }, [tasks, searchKeyword]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<ColumnId, Task[]> = {
      todo: [],
      'in-progress': [],
      done: [],
    };

    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    Object.values(grouped).forEach((columnTasks) => {
      columnTasks.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return grouped;
  }, [filteredTasks]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    updateStatus(draggableId, destination.droppableId as Task['status']);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: 16,
          height: '100%',
          overflowX: 'auto',
        }}
        className="board-container"
      >
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  minWidth: 260,
                  width: 320,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 8,
                  backgroundColor: column.bgColor,
                  padding: 16,
                  transition: 'border-color 0.2s ease',
                  border: snapshot.isDraggingOver
                    ? '2px dashed #1890FF'
                    : '2px solid transparent',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: column.color,
                    }}
                  />
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#262626',
                    }}
                  >
                      {column.title}
                    </h3>
                    <span
                      style={{
                        marginLeft: 'auto',
                        color: '#8C8C8C',
                        fontSize: 13,
                      }}
                    >
                      {tasksByColumn[column.id].length}
                    </span>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      paddingRight: 4,
                    }}
                  >
                    {tasksByColumn[column.id].map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <TaskCard
                            task={task}
                            provided={provided}
                            snapshot={snapshot}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    );
};
