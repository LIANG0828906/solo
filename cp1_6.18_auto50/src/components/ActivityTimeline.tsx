import { usePetStore } from '@/store';
import { ActivityType, ACTIVITY_LABELS, ACTIVITY_COLORS } from '@/types';
import { Utensils, Footprints, Gamepad2, Moon } from 'lucide-react';

interface ActivityTimelineProps {
  petId: string;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case ActivityType.Feeding: return Utensils;
    case ActivityType.Walking: return Footprints;
    case ActivityType.Playing: return Gamepad2;
    case ActivityType.Resting: return Moon;
  }
};

export default function ActivityTimeline({ petId }: ActivityTimelineProps) {
  const activities = usePetStore((state) => state.activities);
  const records = activities[petId] || [];

  if (records.length === 0) {
    return (
      <div className="text-text-secondary text-sm py-8 text-center">
        暂无活动记录
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-base-border" />
      {records.map((record, index) => {
        const Icon = getActivityIcon(record.type);
        return (
          <div
            key={index}
            className="relative flex gap-4 pb-6 timeline-item"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 z-10"
              style={{ backgroundColor: `${ACTIVITY_COLORS[record.type]}33` }}
            >
              <Icon size={14} style={{ color: ACTIVITY_COLORS[record.type] }} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">
                {ACTIVITY_LABELS[record.type]}
              </div>
              <div className="text-xs text-text-secondary mt-0.5">
                {record.description}
              </div>
              <div className="text-xs text-text-secondary/60 mt-1">
                {record.timestamp}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
