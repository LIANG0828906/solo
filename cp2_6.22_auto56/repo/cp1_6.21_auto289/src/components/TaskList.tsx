import { useState } from 'react';
import { Pencil, Trash2, Clock, User } from 'lucide-react';
import { formatDuration, formatDateTime } from '@/utils/timeUtils';
import type { Task } from '../../shared/types';

interface TaskListProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  title?: string;
}

export default function TaskList({ tasks, onEdit, onDelete, title = '最近任务' }: TaskListProps) {
  const [rippleId, setRippleId] = useState<string | null>(null);

  const handleEditClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  };

  const handleDeleteClick = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这条任务记录吗？')) {
      onDelete?.(taskId);
    }
  };

  const handleRipple = (taskId: string) => {
    setRippleId(taskId);
    setTimeout(() => setRippleId(null), 600);
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden animate-fade-in">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>

      {tasks.length === 0 ? (
        <div className="p-12 text-center">
          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">暂无任务记录</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {tasks.map((task, index) => (
            <div 
              key={task.id}
              className="px-6 py-4 hover:bg-gray-50/50 transition-colors animate-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 truncate">{task.name}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    {task.clientName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {task.clientName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(task.startTime)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  <span className="font-mono font-semibold text-primary-600 text-lg min-w-[80px] text-right">
                    {formatDuration(task.duration)}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        handleRipple(task.id + '-edit');
                        handleEditClick(task, e);
                      }}
                      className="relative w-8 h-8 rounded-full flex items-center justify-center
                               text-gray-400 hover:text-primary-600 hover:bg-primary-50
                               transition-all duration-200 overflow-hidden
                               active:scale-[0.95]"
                      title="编辑"
                    >
                      {rippleId === task.id + '-edit' && (
                        <span className="absolute inset-0 bg-primary-200/50 rounded-full animate-ripple" />
                      )}
                      <Pencil className="w-4 h-4 relative z-10" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        handleRipple(task.id + '-delete');
                        handleDeleteClick(task.id, e);
                      }}
                      className="relative w-8 h-8 rounded-full flex items-center justify-center
                               text-gray-400 hover:text-red-500 hover:bg-red-50
                               transition-all duration-200 overflow-hidden
                               active:scale-[0.95]"
                      title="删除"
                    >
                      {rippleId === task.id + '-delete' && (
                        <span className="absolute inset-0 bg-red-200/50 rounded-full animate-ripple" />
                      )}
                      <Trash2 className="w-4 h-4 relative z-10" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
