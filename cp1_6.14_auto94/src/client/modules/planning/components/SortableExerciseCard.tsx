import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { PlanExerciseWithDetails } from './types';

interface SortableExerciseCardProps {
  exercise: PlanExerciseWithDetails;
  isDragging: boolean;
  onEdit: (exerciseId: string) => void;
  onDelete: (exerciseId: string) => void;
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < level ? 'bg-orange-500' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function SortableExerciseCard({
  exercise,
  isDragging,
  onEdit,
  onDelete,
}: SortableExerciseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: exercise.exerciseId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 0.3s ease-out, opacity 0.25s ease-out',
    opacity: isSortableDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card rounded-xl p-4 mb-3 flex items-center gap-3 m-0 ${
        isSortableDragging
          ? 'dragging-placeholder pointer-events-none'
          : ''
      }`}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none p-1 rounded-lg hover:bg-gray-50 transition-colors"
        {...attributes}
        {...listeners}
        aria-label="拖拽排序"
      >
        <GripVertical size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-gray-900 truncate">
            {exercise.name}
          </span>
          <span className="badge badge-blue">
            {exercise.muscleGroup}
          </span>
          {exercise.adjustment && (
            <span
              className={`badge cursor-help ${
                exercise.adjustment.type === 'reduced'
                  ? 'badge-red'
                  : 'badge-green'
              }`}
              title={exercise.adjustment.reason}
            >
              {exercise.adjustment.type === 'reduced' ? '↓减少' : '↑增加'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="font-medium">
            {exercise.sets}组 × {exercise.reps}次
          </span>
          <span>休息 {exercise.restSeconds}秒</span>
          <DifficultyDots level={exercise.difficulty} />
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
          onClick={() => onEdit(exercise.exerciseId)}
          aria-label="编辑动作"
        >
          <Pencil size={16} />
        </button>
        <button
          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          onClick={() => onDelete(exercise.exerciseId)}
          aria-label="删除动作"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export function DragOverlayCard({
  exercise,
}: {
  exercise: PlanExerciseWithDetails;
}) {
  return (
    <div className="drag-overlay card rounded-xl p-4 mb-3 flex items-center gap-3 m-0 pointer-events-none">
      <div className="cursor-grab text-gray-400 p-1">
        <GripVertical size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-gray-900 truncate">
            {exercise.name}
          </span>
          <span className="badge badge-blue">
            {exercise.muscleGroup}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="font-medium">
            {exercise.sets}组 × {exercise.reps}次
          </span>
          <span>休息 {exercise.restSeconds}秒</span>
        </div>
      </div>
    </div>
  );
}
