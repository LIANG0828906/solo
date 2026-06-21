import type { Task, TaskStatus } from '@/types';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

const STATUS_CONFIG: Record<TaskStatus, { title: string; bg: string; border: string }> = {
  todo: { title: '待办', bg: 'bg-red-50', border: 'border-red-500' },
  inProgress: { title: '进行中', bg: 'bg-amber-50', border: 'border-amber-500' },
  done: { title: '已完成', bg: 'bg-emerald-50', border: 'border-emerald-500' },
};

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  boardId: string;
}

export default function BoardColumn({ status, tasks, boardId }: BoardColumnProps) {
  const [showForm, setShowForm] = useState(false);
  const config = STATUS_CONFIG[status];

  return (
    <div className={`flex flex-col min-w-[260px] flex-1 ${config.bg} rounded-lg`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-t-4 ${config.border} rounded-t-lg`}>
        <h3 className="font-semibold text-sm text-slate-700">{config.title}</h3>
        <span className="text-xs text-slate-400 bg-white/60 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 space-y-2 min-h-[100px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-slate-100/50' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <TaskCard
                    task={task}
                    index={index}
                    dragProvided={dragProvided}
                    isDragging={dragSnapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="p-2">
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-1 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-white/40 rounded transition-colors"
        >
          <Plus size={14} />
          添加任务
        </button>
      </div>

      {showForm && (
        <TaskForm boardId={boardId} status={status} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
