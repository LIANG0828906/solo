import {
  DragDropContext,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import useKanbanStore from '../store/useKanbanStore';
import type { Task } from '../../shared/types';

interface Column {
  id: Task['status'];
  title: string;
}

const columns: Column[] = [
  { id: 'todo', title: '待办' },
  { id: 'in-progress', title: '进行中' },
  { id: 'done', title: '已完成' },
];

export default function Board() {
  const { tasks, selectTask, setModalOpen, currentUser } = useKanbanStore();

  const getTasksByStatus = (status: Task['status']) =>
    tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const newStatus = destination.droppableId as Task['status'];
    const newOrder = destination.index;

    const columnTasks = getTasksByStatus(newStatus);
    const reordered = columnTasks.filter((t) => t.id !== draggableId);
    reordered.splice(newOrder, 0, tasks.find((t) => t.id === draggableId)!);

    const updates: { id: string; status: string; order: number }[] = reordered.map(
      (t, i) => ({ id: t.id, status: newStatus, order: i })
    );

    await fetch(`/api/tasks/${draggableId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        order: newOrder,
        user: currentUser?.name ?? 'Unknown',
      }),
    });
  };

  const handleAddTask = async (status: Task['status']) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '新任务',
        description: '',
        priority: 'medium',
        assignee: currentUser?.name ?? '',
        storyPoints: 0,
        status,
        user: currentUser?.name ?? 'Unknown',
      }),
    });
  };

  const handleTaskClick = (task: Task) => {
    selectTask(task);
    setModalOpen(true);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-full">
        {columns.map((col, colIdx) => {
          const columnTasks = getTasksByStatus(col.id);
          return (
            <div
              key={col.id}
              className={`flex-1 flex flex-col min-w-0 ${
                colIdx < columns.length - 1 ? 'border-r border-[#e0e0e0]' : ''
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-[#2c3e50]">
                    {col.title}
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => handleAddTask(col.id)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-[#3498db] transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 px-3 pb-3 overflow-y-auto space-y-2 min-h-[120px] rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-[#eaf2f8]' : ''
                    }`}
                  >
                    {columnTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onClick={() => handleTaskClick(task)}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
