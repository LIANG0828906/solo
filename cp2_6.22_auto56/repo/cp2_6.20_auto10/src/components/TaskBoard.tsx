import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, Flag, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Task, TaskStatus } from '@/types';

interface TaskBoardProps {
  onBack?: () => void;
}

const columns: { id: TaskStatus; title: string; color: string; accent: string }[] = [
  { id: 'todo', title: '待办', color: 'bg-dark-300', accent: '#a8a7c0' },
  { id: 'in-progress', title: '进行中', color: 'bg-primary-500', accent: '#6c63ff' },
  { id: 'done', title: '已完成', color: 'bg-green-500', accent: '#4ade80' },
];

const priorityConfig = {
  high: { label: '高', color: 'priority-high' },
  medium: { label: '中', color: 'priority-medium' },
  low: { label: '低', color: 'priority-low' },
};

export default function TaskBoard({ onBack }: TaskBoardProps) {
  const { tasks, updateTaskStatus } = useAppStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    'todo': todoTasks,
    'in-progress': inProgressTasks,
    'done': doneTasks,
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveId(String(event.active.id));
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask) return;

    let targetStatus: TaskStatus | null = null;

    const overColumn = columns.find((col) => col.id === over.id);
    if (overColumn) {
      targetStatus = overColumn.id;
    } else {
      const overTaskId = String(over.id);
      const overTask = tasks.find((t) => t.id === overTaskId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus && draggedTask.status !== targetStatus) {
      updateTaskStatus(activeId, targetStatus);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 transition-all hover:scale-105">
              <ArrowLeft size={20} className="text-dark-300" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-dark-50">任务看板</h2>
            <p className="text-sm text-dark-400 mt-1">
              共 {tasks.length} 个任务 · 待办 {todoTasks.length} · 进行中 {inProgressTasks.length} · 已完成 {doneTasks.length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {columns.map((column) => (
              <DroppableKanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                accent={column.accent}
                tasks={tasksByStatus[column.id]}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

interface DroppableKanbanColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  accent: string;
  tasks: Task[];
}

function DroppableKanbanColumn({ id, title, color, accent, tasks }: DroppableKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'column', status: id } });

  return (
    <div
      ref={setNodeRef}
      data-column-id={id}
      className={`kanban-column ${isOver ? 'drag-over' : ''}`}
      style={isOver ? { borderColor: accent } : undefined}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h3 className="font-semibold text-dark-100">{title}</h3>
        <span className="text-xs text-dark-400 bg-white/5 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 min-h-[100px]">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-dark-500 text-sm border-2 border-dashed border-white/5 rounded-xl">
              拖拽任务到此处
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

function TaskCard({ task, isDragging }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { type: 'task', status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      {...attributes}
      {...listeners}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-medium text-dark-100 text-sm leading-snug flex-1">
          {task.title}
        </h4>
        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${priority.color}`}>
          <Flag size={10} className="inline mr-1" />
          {priority.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-dark-400">
        <span className="flex items-center gap-1">
          <User size={12} />
          {task.responsible}
        </span>
        {task.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {task.dueDate}
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-white/5">
        <span className="text-xs text-dark-500 truncate block">
          来自：{task.meetingTitle}
        </span>
      </div>
    </div>
  );
}
