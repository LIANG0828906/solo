import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import { getDayCount, getDateForDay } from '../utils/dateUtils';

export const MiniTimeline = () => {
  const { currentTrip } = useTripStore();
  const { selectedDayIndex, setSelectedDayIndex } = useUiStore();
  
  if (!currentTrip) return null;
  
  const dayCount = getDayCount(currentTrip.startDate, currentTrip.endDate);
  
  const getActivityCountForDay = (dayIndex: number) => {
    return currentTrip.activities.filter(a => a.dayIndex === dayIndex).length;
  };
  
  const maxActivities = Math.max(...Array.from({ length: dayCount }, (_, i) => getActivityCountForDay(i)), 1);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-warm-100 shadow-lg z-40 animate-fade-in-up">
      <div className="container py-4">
        <div className="flex items-end justify-between gap-2 h-20 px-2">
          {Array.from({ length: dayCount }).map((_, index) => {
            const activityCount = getActivityCountForDay(index);
            const heightPercent = maxActivities > 0 ? (activityCount / maxActivities) * 100 : 0;
            const isSelected = selectedDayIndex === index;
            const date = getDateForDay(currentTrip.startDate, index);
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDayIndex(index)}
                className="flex-1 flex flex-col items-center gap-1 group min-w-0"
              >
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-t from-primary-500 to-accent-400 shadow-glow'
                      : activityCount > 0
                      ? 'bg-gradient-to-t from-primary-200 to-accent-100 group-hover:from-primary-300 group-hover:to-accent-200'
                      : 'bg-warm-100 group-hover:bg-warm-200'
                  }`}
                  style={{ height: `${Math.max(heightPercent, 10)}%` }}
                />
                
                <span
                  className={`text-xs font-medium transition-colors ${
                    isSelected ? 'text-primary-600' : 'text-warm-400 group-hover:text-warm-600'
                  }`}
                >
                  D{index + 1}
                </span>
                <span
                  className={`text-[10px] ${
                    isSelected ? 'text-primary-500' : 'text-warm-300'
                  }`}
                >
                  {date.getMonth() + 1}/{date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
