import type { Task, TaskPriority } from '@/types';
import { X } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore';
import type { DraggableProvided } from '@hello-pangea/dnd';

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
};

interface TaskCardProps {
  task: Task;
  index: number;
  dragProvided: DraggableProvided;
  isDragging: boolean;
}

export default function TaskCard({ task, dragProvided, isDragging }: TaskCardProps) {
  const removeTask = useBoardStore((s) => s.removeTask);

  return (
    <div
      ref={dragProvided.innerRef}
      {...dragProvided.draggableProps}
      {...dragProvided.dragHandleProps}
      className={`group relative w-[220px] bg-white rounded-lg p-3 border-b-2 border-slate-200 transition-shadow duration-200 ${
        isDragging
          ? 'opacity-80 shadow-[0_8px_24px_rgba(0,0,0,0.15)]'
          : 'hover:shadow-md'
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeTask(task.id);
        }}
        className="absolute top-2 right-2 p-0.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>

      <h4 className="font-medium text-sm text-slate-800 pr-5 leading-snug">
        {task.title.length > 30 ? task.title.slice(0, 30) + '…' : task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {task.description.length > 100 ? task.description.slice(0, 100) + '…' : task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <span className="text-xs text-slate-400">{task.assignee}</span>
        <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority]}`} />
      </div>
    </div>
  );
}
