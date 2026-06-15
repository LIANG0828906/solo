import { memo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import type { Task, TeamMember } from '@/utils/types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/utils/types';

interface TaskCardProps {
  task: Task;
  members: TeamMember[];
  index: number;
  onEdit: (task: Task) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (diffDays < 0) {
    return `已过期 ${Math.abs(diffDays)} 天`;
  } else if (diffDays === 0) {
    return '今天到期';
  } else if (diffDays === 1) {
    return '明天到期';
  } else if (diffDays <= 7) {
    return `${diffDays}天后 (${month}月${day}日)`;
  }
  return `${month}月${day}日`;
}

const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 21,
  mass: 0.8,
};

export const TaskCard = memo(function TaskCard({
  task,
  members,
  index,
  onEdit,
  style,
  isDragging = false,
}: TaskCardProps) {
  const assignee = members.find((m) => m.id === task.assigneeId);
  const priorityClass = `priority-${task.priority}`;
  const priorityLabel = PRIORITY_LABELS[task.priority];
  const priorityColor = PRIORITY_COLORS[task.priority];

  const today = new Date();
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < today && task.status !== 'done';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          initial={false}
          animate={{
            scale: snapshot.isDragging ? 1.03 : 1,
            rotate: snapshot.isDragging ? 1 : 0,
            zIndex: snapshot.isDragging ? 1000 : 1,
            boxShadow: snapshot.isDragging
              ? '0 20px 40px -12px rgba(0, 0, 0, 0.25)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
          transition={springConfig}
          style={{
            ...style,
            ...provided.draggableProps.style,
          }}
          className={`
            task-card ${priorityClass} hover-scale
            bg-white rounded-lg shadow-sm p-3 mb-3
            cursor-pointer select-none
            ${snapshot.isDragging ? 'dragging opacity-95' : ''}
            ${isOverdue ? 'ring-1 ring-red-300' : ''}
          `}
          onDoubleClick={() => onEdit(task)}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-sm text-gray-800 flex-1 pr-2 line-clamp-2">
              {task.title}
            </h4>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white shrink-0"
              style={{ backgroundColor: priorityColor }}
            >
              {priorityLabel}
            </span>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-gray-500 flex-wrap gap-2">
            <div className="flex items-center gap-1 min-w-0">
              {assignee ? (
                <>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white shrink-0"
                    style={{ backgroundColor: assignee.color }}
                  >
                    {assignee.avatar}
                  </div>
                  <span className="text-[11px] truncate">{assignee.name}</span>
                </>
              ) : (
                <span className="text-gray-400 italic text-[11px]">未分配</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[11px]">
                <Clock size={12} />
                <span>{task.estimatedHours}h</span>
              </div>

              <div
                className={`flex items-center gap-1 text-[11px] ${
                  isOverdue ? 'text-red-500 font-medium' : ''
                }`}
              >
                <Calendar size={12} />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </Draggable>
  );
});

export default TaskCard;
