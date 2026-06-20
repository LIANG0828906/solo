import { Workout } from '../types';
import { getWeekDates, isSameDay, getDayName, formatDuration } from '../utils/helpers';
import './styles/WeeklyCalendar.css';

interface WeeklyCalendarProps {
  workouts: Workout[];
}

export default function WeeklyCalendar({ workouts }: WeeklyCalendarProps) {
  const weekDates = getWeekDates();
  const today = new Date();

  const getWorkoutForDate = (date: Date): Workout | undefined => {
    const timestamp = date.getTime();
    return workouts.find((workout) => isSameDay(workout.date, timestamp));
  };

  return (
    <div className="weekly-calendar">
      {weekDates.map((date, index) => {
        const workout = getWorkoutForDate(date);
        const isToday = isSameDay(date.getTime(), today.getTime());

        return (
          <div
            key={index}
            className={`weekly-calendar-day ${isToday ? 'weekly-calendar-day-today' : ''}`}
          >
            <span className="weekly-calendar-day-name">{getDayName(date)}</span>
            <span className="weekly-calendar-day-date">{date.getDate()}</span>
            <div
              className={`weekly-calendar-dot ${
                workout ? 'weekly-calendar-dot-workout' : 'weekly-calendar-dot-rest'
              }`}
            />
            {workout && (
              <div className="weekly-calendar-tooltip">
                <div className="weekly-calendar-tooltip-name">{workout.planName}</div>
                <div className="weekly-calendar-tooltip-duration">
                  {formatDuration(workout.duration)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
