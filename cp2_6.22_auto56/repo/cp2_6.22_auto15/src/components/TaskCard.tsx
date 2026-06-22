import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '../../shared/types';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

const priorityColor: Record<Task['priority'], string> = {
  high: '#e74c3c',
  medium: '#f39c12',
  low: '#27ae60',
};

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className="bg-white rounded-lg p-3 cursor-grab active:cursor-grabbing transition-shadow border border-gray-100 hover:border-gray-200"
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging
              ? '0 6px 12px rgba(0,0,0,0.15)'
              : undefined,
            opacity: snapshot.isDragging ? 0.85 : 1,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-sm text-[#2c3e50] leading-snug">
              {task.title}
            </span>
            {task.storyPoints > 0 && (
              <span className="shrink-0 text-xs font-medium bg-[#eaf2f8] text-[#3498db] rounded-full px-2 py-0.5">
                {task.storyPoints} SP
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: priorityColor[task.priority] }}
            />
            {task.assignee && (
              <span className="text-xs text-gray-400 truncate">
                {task.assignee}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
