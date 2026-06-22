import { useState } from 'react';
import { usePetStore } from '@/store';
import { ActivityType, ACTIVITY_LABELS, ACTIVITY_COLORS } from '@/types';
import { Utensils, Footprints, Gamepad2, Moon, Plus } from 'lucide-react';

interface ActivityFormProps {
  petId: string;
}

const ICON_MAP: Record<ActivityType, React.ElementType> = {
  [ActivityType.Feeding]: Utensils,
  [ActivityType.Walking]: Footprints,
  [ActivityType.Playing]: Gamepad2,
  [ActivityType.Resting]: Moon,
};

export function ActivityForm({ petId }: ActivityFormProps) {
  const logActivity = usePetStore((s) => s.logActivity);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!selectedActivity || isSubmitting) return;
    setIsSubmitting(true);
    logActivity(petId, selectedActivity);
    setSelectedActivity(null);
    setIsSubmitting(false);
  };

  return (
    <div className="mt-2">
      <h3 className="text-sm font-medium text-text-primary mb-3">记录活动</h3>
      <div className="flex gap-2 flex-wrap">
        {(Object.values(ActivityType) as ActivityType[]).map((type) => {
          const Icon = ICON_MAP[type];
          const isSelected = selectedActivity === type;
          return (
            <button
              key={type}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer"
              style={
                isSelected
                  ? {
                      borderColor: ACTIVITY_COLORS[type],
                      color: ACTIVITY_COLORS[type],
                      backgroundColor: `${ACTIVITY_COLORS[type]}1A`,
                    }
                  : {}
              }
              onClick={() => setSelectedActivity(isSelected ? null : type)}
            >
              <Icon size={14} />
              {ACTIVITY_LABELS[type]}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className={`mt-3 w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
          isSubmitting
            ? 'bg-accent/50 text-base cursor-wait'
            : selectedActivity
              ? 'bg-accent text-base font-semibold hover:bg-accent/90'
              : 'bg-base-hover text-text-secondary cursor-not-allowed'
        }`}
        onClick={handleSubmit}
        disabled={!selectedActivity || isSubmitting}
      >
        <Plus size={14} />
        {isSubmitting ? '提交中...' : '记录活动'}
      </button>
    </div>
  );
}
