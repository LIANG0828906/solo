import { Draggable } from '@hello-pangea/dnd';
import { Calendar, User } from 'lucide-react';
import type { Task, User as UserType } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  users: UserType[];
  onClick: () => void;
}

export default function TaskCard({ task, index, users, onClick }: TaskCardProps) {
  const assignee = users.find((u) => u.id === task.assigneeId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const isOverdue = () => {
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  const priorityLabels = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`task-card bg-white rounded-lg p-4 cursor-pointer shadow-sm border border-gray-100 ${
            snapshot.isDragging ? 'dragging rotate-2 scale-105' : ''
          }`}
          style={{
            ...provided.draggableProps.style,
            transition: snapshot.isDragging
              ? 'none'
              : 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <div className="flex items-start gap-2 mb-3">
            <span
              className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${priorityColors[task.priority]}`}
              title={priorityLabels[task.priority]}
            />
            <h4 className="text-sm font-medium text-gray-800 line-clamp-2 flex-1">
              {task.title}
            </h4>
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {assignee ? (
                <div className="flex items-center gap-1.5">
                  <img
                    src={assignee.avatar}
                    alt={assignee.username}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-xs text-gray-600">{assignee.username}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="text-xs">未分配</span>
                </div>
              )}
            </div>

            <div
              className={`flex items-center gap-1 text-xs ${
                isOverdue() ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
