import type { CSSProperties, DragEvent } from 'react';
import { useState } from 'react';
import type { Task } from '@/types';
import { useTaskStore } from '@/store/taskStore';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const users = useTaskStore((state) => state.users);
  const assignee = users.find((u) => u.id === task.assignee);

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const draggingStyle: CSSProperties = isDragging
    ? {
        transform: 'scale(1.05)',
        opacity: 0.7,
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
      }
    : {};

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      style={draggingStyle}
      className={cn(
        'bg-white p-4 rounded-lg cursor-pointer transition-all duration-300',
        'border border-gray-100 hover:shadow-md hover:border-gray-200',
        'select-none'
      )}
    >
      <h4 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2">{task.title}</h4>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
            {assignee?.name?.charAt(0) || '?'}
          </div>
          <span>{assignee?.name || '未分配'}</span>
        </div>
        <span>{task.dueDate}</span>
      </div>
    </div>
  );
}
