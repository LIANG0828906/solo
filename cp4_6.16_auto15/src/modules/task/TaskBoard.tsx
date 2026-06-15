import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Clock, User, Calendar, ListTodo } from 'lucide-react';
import { useTaskStore, type TodoItem, type TodoStatus } from './TaskStore';

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

function findContainer(id: string, grouped: Record<TodoStatus, TodoItem[]>): TodoStatus | null {
  for (const status of Object.keys(grouped) as TodoStatus[]) {
    if (id === status) return status;
    if (grouped[status].some((t) => t.id === id)) return status;
  }
  return null;
}

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
      `}
      style={{
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isDragging
          ? '0 20px 40px rgba(30, 58, 95, 0.18), 0 8px 16px rgba(0, 0, 0, 0.1)'
          : undefined,
        zIndex: isDragging ? 1000 : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
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

interface SortableTaskCardProps {
  todo: TodoItem;
}

function SortableTaskCard({ todo }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    data: {
      type: 'item',
      todo,
      status: todo.status,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCardContent todo={todo} />
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
    data: {
      type: 'column',
      status: column.id,
    },
  });

  return (
    <div
      className={`
        flex flex-col bg-surface-100 rounded-lg p-3 min-h-[450px]
        transition-all duration-200
        ${isOver ? 'bg-primary-50 ring-2 ring-primary-300 shadow-inner' : ''}
      `}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
        <h3 className="text-sm font-semibold text-primary">{column.title}</h3>
        <span className="ml-auto text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full shadow-sm">
          {todos.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex-1 space-y-3 min-h-[200px]">
        <SortableContext
          items={todos.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
          id={`sortable-${column.id}`}
        >
          {todos.map((todo) => (
            <SortableTaskCard key={todo.id} todo={todo} />
          ))}
        </SortableContext>

        {todos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs border-2 border-dashed border-surface-200 rounded-md">
            <Clock size={20} className="mb-2 opacity-40" />
            <span>拖拽任务到此处</span>
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
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
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

  const grouped = useMemo(
    () => ({
      pending: pendingTodos,
      'in-progress': inProgressTodos,
      completed: completedTodos,
    }),
    [pendingTodos, inProgressTodos, completedTodos]
  );

  const activeTodo = activeId ? todos.find((t) => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId, grouped);
    if (!activeContainer) return;

    const overContainer = findContainer(overId, grouped);
    if (!overContainer) return;

    if (activeContainer !== overContainer) {
      // 跨列时不立即更新，在 dragEnd 处理（保持性能）
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId, grouped);
    const overContainer = findContainer(overId, grouped);

    if (!activeContainer || !overContainer) return;

    if (activeContainer !== overContainer) {
      await updateTodoStatus(activeId, overContainer);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
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
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DroppableColumn column={COLUMNS[0]} todos={pendingTodos} />
            <DroppableColumn column={COLUMNS[1]} todos={inProgressTodos} />
            <DroppableColumn column={COLUMNS[2]} todos={completedTodos} />
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 250,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}
          >
            {activeTodo ? (
              <div className="w-full md:w-full pointer-events-none">
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
