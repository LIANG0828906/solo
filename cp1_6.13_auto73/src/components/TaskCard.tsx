import { useDrag } from 'react-dnd';
import dayjs from 'dayjs';
import { Calendar, User } from 'lucide-react';
import type { Task, DragItem } from '../types';

interface TaskCardProps {
  task: Task;
  columnId: string;
  index: number;
  boardId: string;
  onClick: (task: Task, columnId: string) => void;
}

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
};

const priorityLabels = {
  high: '高',
  medium: '中',
  low: '低',
};

const priorityBgColors = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  low: 'bg-green-50 text-green-700 border-green-200',
};

export const TaskCard = ({
  task,
  columnId,
  index,
  boardId,
  onClick,
}: TaskCardProps) => {
  const [{ isDragging }, drag, dragPreview] = useDrag<
    DragItem,
    unknown,
    { isDragging: boolean }
  >(
    () => ({
      type: 'TASK',
      item: {
        type: 'TASK',
        task,
        sourceColumnId: columnId,
        sourceIndex: index,
        boardId,
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      options: {
        dropEffect: 'move',
      },
    }),
    [task, columnId, index, boardId]
  );

  const isOverdue = dayjs(task.dueDate).isBefore(dayjs(), 'day');
  const isDueSoon =
    dayjs(task.dueDate).isAfter(dayjs(), 'day') &&
    dayjs(task.dueDate).diff(dayjs(), 'day') <= 3;

  return (
    <div
      ref={dragPreview}
      onClick={(e) => {
        e.stopPropagation();
        onClick(task, columnId);
      }}
      className={`
        group relative bg-white rounded-lg p-3 mb-2 cursor-pointer
        border border-gray-100
        transition-all duration-150 ease-in-out
        hover:shadow-lg hover:-translate-y-0.5
        animate-task-pop-in
        ${isDragging ? 'opacity-50 shadow-2xl scale-105' : 'shadow-sm'}
      `}
      style={{
        animationFillMode: 'both',
        animationDelay: `${Math.min(index * 30, 200)}ms`,
      }}
    >
      <div
        ref={drag}
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg cursor-grab active:cursor-grabbing"
        style={{ willChange: 'transform' }}
      >
        <div className={`h-full ${priorityColors[task.priority]} rounded-l-lg`} />
      </div>

      <div className="ml-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-bold text-gray-800 text-sm leading-tight flex-1">
            {task.title}
          </h4>
          <span
            className={`
              px-2 py-0.5 text-xs font-medium rounded-full border
              flex-shrink-0 transition-colors duration-150
              ${priorityBgColors[task.priority]}
            `}
          >
            {priorityLabels[task.priority]}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div
            className={`
              flex items-center gap-1 px-1.5 py-1 rounded
              transition-colors duration-150
              ${isOverdue ? 'text-red-600 bg-red-50' : ''}
              ${isDueSoon ? 'text-orange-600 bg-orange-50' : ''}
            `}
          >
            <Calendar size={12} />
            <span className="font-medium">
              {dayjs(task.dueDate).format('MM/DD')}
            </span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-1 rounded bg-gray-50">
            <User size={12} />
            <span className="font-medium">{task.assignee}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
