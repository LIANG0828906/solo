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
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card rounded-xl p-4 mb-3 flex items-center gap-3 transition-shadow ${
        isSortableDragging
          ? 'border-2 border-dashed border-gray-300 bg-gray-50'
          : 'bg-white shadow hover:shadow-md'
      }`}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900 truncate">
            {exercise.name}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            {exercise.muscleGroup}
          </span>
          {exercise.adjustment && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-help ${
                exercise.adjustment.type === 'reduced'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              }`}
              title={exercise.adjustment.reason}
            >
              {exercise.adjustment.type === 'reduced' ? '↓减少' : '↑增加'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>
            {exercise.sets}组 × {exercise.reps}次
          </span>
          <span>休息 {exercise.restSeconds}秒</span>
          <DifficultyDots level={exercise.difficulty} />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          onClick={() => onEdit(exercise.exerciseId)}
        >
          <Pencil size={16} />
        </button>
        <button
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          onClick={() => onDelete(exercise.exerciseId)}
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
    <div
      className="rounded-xl p-4 mb-3 flex items-center gap-3 bg-white shadow-lg"
      style={{
        opacity: 0.7,
        transform: 'scale(1.02)',
      }}
    >
      <div className="cursor-grab text-gray-400">
        <GripVertical size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900 truncate">
            {exercise.name}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            {exercise.muscleGroup}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>
            {exercise.sets}组 × {exercise.reps}次
          </span>
          <span>休息 {exercise.restSeconds}秒</span>
        </div>
      </div>
    </div>
  );
}
