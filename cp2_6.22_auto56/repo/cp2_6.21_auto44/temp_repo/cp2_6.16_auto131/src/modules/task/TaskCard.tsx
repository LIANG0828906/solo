import { memo } from 'react';
import { Clock, Calendar, User, CheckCircle, AlertCircle } from 'lucide-react';
import type { Task } from '@/utils/types';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/utils/constants';
import { formatHours, isOverdue } from '@/utils/time';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onClaim?: () => void;
  currentUserId?: string;
}

function TaskCard({ task, onClick, onClaim, currentUserId }: TaskCardProps) {
  const statusColor = TASK_STATUS_COLORS[task.status];
  const statusLabel = TASK_STATUS_LABELS[task.status];
  const overdue = task.status !== 'completed' && isOverdue(task.deadline);

  const canClaim = task.status === 'pending' && currentUserId && task.creatorId !== currentUserId;

  return (
    <div
      className="task-card bg-white rounded-xl border-2 cursor-pointer flex flex-col h-full"
      style={{ borderColor: '#BBDEFB', minHeight: '180px' }}
      onClick={onClick}
    >
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-800 text-base line-clamp-2 flex-1 pr-2">
            {task.title}
          </h3>
          <span
            className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
            }}
          >
            {statusLabel}
          </span>
        </div>

        <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
          {task.description}
        </p>

        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>预计 {formatHours(task.estimatedHours)}</span>
            <span className="text-gray-300">·</span>
            <span>已记录 {formatHours(task.totalHours)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className={`w-3.5 h-3.5 ${overdue ? 'text-red-500' : ''}`} />
            <span className={overdue ? 'text-red-500 font-medium' : ''}>
              截止 {task.deadline}
              {overdue && ' (已逾期)'}
            </span>
          </div>
          {task.assigneeName && (
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span>认领人：{task.assigneeName}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            <span>发布人：{task.creatorName}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        {canClaim ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClaim?.();
            }}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            认领任务
          </button>
        ) : task.status === 'completed' ? (
          <div className="flex items-center justify-center gap-2 py-2 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            已完成
          </div>
        ) : null}
      </div>

      {overdue && (
        <div className="absolute top-2 right-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
      )}
    </div>
  );
}

export default memo(TaskCard);
