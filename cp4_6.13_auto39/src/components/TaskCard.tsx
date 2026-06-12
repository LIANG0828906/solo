import { Calendar, GripVertical } from "lucide-react";
import type { TaskItem, TaskPriority } from "@/store/workshop";

const priorityConfig: Record<TaskPriority, { color: string; label: string; bg: string }> = {
  P0: { color: "bg-priority-p0", label: "紧急", bg: "bg-red-50" },
  P1: { color: "bg-priority-p1", label: "高", bg: "bg-orange-50" },
  P2: { color: "bg-priority-p2", label: "中", bg: "bg-blue-50" },
  P3: { color: "bg-priority-p3", label: "低", bg: "bg-gray-50" },
};

export default function TaskCard({
  task,
  onClick,
  onDragStart,
}: {
  task: TaskItem;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const p = priorityConfig[task.priority];
  const completedCount = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      <div className={`h-1.5 ${p.color}`} />
      <div className="p-3.5">
        <div className="flex items-start gap-2">
          {onDragStart && (
            <GripVertical size={14} className="text-gray-300 mt-0.5 shrink-0 cursor-grab" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">{task.title}</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-1.5 py-0.5 rounded ${p.color} text-white font-medium`}>
                {task.priority} {p.label}
              </span>
              <span className="text-xs text-gray-400">{task.assignee}</span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              {task.dueDate ? (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {task.dueDate}
                </span>
              ) : (
                <span />
              )}
              {totalSubtasks > 0 && (
                <span>
                  {completedCount}/{totalSubtasks}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
