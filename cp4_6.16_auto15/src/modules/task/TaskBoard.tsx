import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { ArrowLeft, Clock, User, Calendar, ListTodo } from 'lucide-react';
import { useTaskStore, type TodoItem, type TodoStatus } from './TaskStore';
import { CSS } from '@dnd-kit/utilities';

interface Column {
  id: TodoStatus;
  title: string;
  color: string;
}

const COLUMNS: Column[] = [
  { id: 'pending', title: '待处理', color: 'bg-gray-400' },
  { id: 'in-progress', title: '进行中', color: 'bg-blue-500' },
  { id: 'completed', title: '已完成', color: 'bg-green-500' },
];

interface TaskCardContentProps {
  todo: TodoItem;
  isDragging?: boolean;
}

function TaskCardContent({ todo, isDragging = false }: TaskCardContentProps) {
  const { isDueSoon, isOverdue } = useTaskStore();
  const dueSoon = isDueSoon(todo.dueDate, 3);
  const overdue = isOverdue(todo.dueDate);

  return (
    <div
      className={`
        relative p-4 bg-white rounded-card border border-surface-200 shadow-sm
        transition-all duration-200 select-none
        ${isDragging ? 'shadow-2xl cursor-grabbing' : 'cursor-grab hover:shadow-md hover:border-primary-200'}
      `}
      style={{
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        zIndex: isDragging ? 100 : undefined,
      }}
    >
      {(dueSoon || overdue) && (
        <div
          className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${
            overdue ? 'bg-danger animate-pulse' : 'bg-danger'
          }`}
          title={overdue ? '已逾期' : '即将到期（3天内）'}
        />
      )}

      <h4 className="text-sm font-medium text-gray-800 pr-4 mb-3 line-clamp-2 leading-relaxed">
        {todo.title}
      </h4>

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <User size={12} className="text-primary" />
          <span>{todo.assignee || '未分配'}</span>
        </div>
        <div
          className={`flex items-center gap-1 ${
            overdue ? 'text-danger font-medium' : dueSoon ? 'text-danger' : ''
          }`}
        >
          <Calendar size={12} />
          <span>{todo.dueDate}</span>
        </div>
      </div>
    </div>
  );
}

interface DraggableTaskCardProps {
  todo: TodoItem;
}

function DraggableTaskCard({ todo }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: todo.id,
    data: { todo },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCardContent todo={todo} isDragging={isDragging} />
    </div>
  );
}

interface DroppableColumnProps {
  column: Column;
  todos: TodoItem[];
}

function DroppableColumn({ column, todos }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { status: column.id },
  });

  return (
    <div
      className={`
        flex flex-col bg-surface-100 rounded-lg p-3 min-h-[400px]
        transition-all duration-200
        ${isOver ? 'bg-primary-50 ring-2 ring-primary-200' : ''}
      `}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
        <h3 className="text-sm font-semibold text-primary">{column.title}</h3>
        <span className="ml-auto text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
          {todos.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex-1 space-y-3 min-h-[200px]">
        {todos.map((todo) => (
          <DraggableTaskCard key={todo.id} todo={todo} />
        ))}

        {todos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-xs">
            <Clock size={24} className="mb-2 opacity-50" />
            <span>暂无任务</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaskBoard() {
  const navigate = useNavigate();
  const { todos, updateTodoStatus } = useTaskStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const pendingTodos = useMemo(
    () => todos.filter((t) => t.status === 'pending'),
    [todos]
  );
  const inProgressTodos = useMemo(
    () => todos.filter((t) => t.status === 'in-progress'),
    [todos]
  );
  const completedTodos = useMemo(
    () => todos.filter((t) => t.status === 'completed'),
    [todos]
  );

  const activeTodo = activeId ? todos.find((t) => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const isStatusColumn = COLUMNS.some((col) => col.id === overId);

    if (isStatusColumn) {
      const newStatus = overId as TodoStatus;
      const activeTodo = todos.find((t) => t.id === activeId);

      if (activeTodo && activeTodo.status !== newStatus) {
        await updateTodoStatus(activeId, newStatus);
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-primary text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">返回</span>
          </button>
          <h1 className="text-lg font-medium flex items-center gap-2">
            <ListTodo size={20} />
            待办事项看板
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DroppableColumn column={COLUMNS[0]} todos={pendingTodos} />
            <DroppableColumn column={COLUMNS[1]} todos={inProgressTodos} />
            <DroppableColumn column={COLUMNS[2]} todos={completedTodos} />
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTodo ? (
              <div className="w-full md:w-[calc((100%-2rem)/3)]">
                <TaskCardContent todo={activeTodo} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {todos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ListTodo size={48} className="mb-3 opacity-30" />
            <p className="text-sm">暂无待办事项</p>
            <p className="text-xs mt-1">从会议纪要中解析或手动创建任务</p>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-400">
          共 {todos.length} 个任务 · 待处理 {pendingTodos.length} · 进行中 {inProgressTodos.length} · 已完成 {completedTodos.length}
        </div>
      </main>
    </div>
  );
}
