import { useState, useEffect } from 'react';
import type { Habit } from '../types';
import { formatDate, getWeekProgress } from '../utils/constants';

interface HabitCardProps {
  habit: Habit;
  onCheckin: (habitId: string) => void;
  date: Date;
  isDone?: boolean;
  isMissed?: boolean;
  showCelebration: (milestone: number, habitName: string) => void;
  showAnimation?: boolean;
}

function HabitCard({ habit, onCheckin, date, isDone, isMissed, showCelebration, showAnimation }: HabitCardProps) {
  const [rippling, setRippling] = useState(false);
  const [prevStreak, setPrevStreak] = useState(habit.streak);
  const progress = getWeekProgress(habit, date);
  const progressPercent = Math.min(100, (progress.completed / progress.total) * 100);
  const todayStr = formatDate(date);
  const todayCheckin = habit.checkins.find(c => c.date === todayStr);
  const isCheckedToday = !!todayCheckin?.completed;

  useEffect(() => {
    if (habit.streak > prevStreak && habit.streak > 0) {
      const milestones = [3, 7, 14, 30, 60, 100];
      const newBadge = milestones.find(m => m === habit.streak);
      if (newBadge) {
        showCelebration(newBadge, habit.name);
      }
    }
    setPrevStreak(habit.streak);
  }, [habit.streak, prevStreak, habit.name, showCelebration]);

  const handleCheckin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMissed || isCheckedToday) return;
    setRippling(true);
    setTimeout(() => setRippling(false), 400);
    onCheckin(habit.id);
  };

  const hasBadge = habit.badges && habit.badges.length > 0;

  return (
    <div
      className={`habit-card ${isMissed ? 'missed' : ''} ${isDone ? 'completed-card' : ''} ${showAnimation ? 'card-bounce-in' : ''}`}
      style={{
        boxShadow: isMissed
          ? '0 4px 16px rgba(0,0,0,0.3)'
          : `0 4px 16px ${habit.color}33, 0 0 0 1px ${habit.color}22`,
      }}
    >
      {isMissed && <div className="missed-overlay" />}
      <div className="card-left">
        <div className="habit-icon-wrapper" style={{ backgroundColor: `${habit.color}22` }}>
          <span className="habit-icon">{habit.icon}</span>
          {hasBadge && <span className="badge-shine">✨</span>}
        </div>
        <div className="habit-info">
          <div className="habit-name-row">
            <span className="habit-name">{habit.name}</span>
            {habit.streak >= 3 && (
              <span className="streak-badge">🔥 连续{habit.streak}天</span>
            )}
          </div>
          <div className="color-tag" style={{ backgroundColor: habit.color }} />
          <div className="progress-wrapper">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: habit.color,
                  boxShadow: `0 0 8px ${habit.color}88`,
                }}
              />
            </div>
            <span className="progress-text">{progress.completed}/{progress.total} 本周</span>
          </div>
        </div>
      </div>
      <div className="card-right">
        <button
          className={`checkin-btn ${isCheckedToday ? 'checked' : ''} ${rippling ? 'rippling' : ''}`}
          style={{
            '--color': habit.color,
            borderColor: isCheckedToday ? habit.color : `${habit.color}66`,
            backgroundColor: isCheckedToday ? habit.color : 'transparent',
          } as React.CSSProperties}
          onClick={handleCheckin}
          disabled={isMissed}
          aria-label={isCheckedToday ? '已完成' : '打卡'}
        >
          {isCheckedToday ? '✓' : ''}
          {rippling && <span className="ripple" />}
        </button>
      </div>
    </div>
  );
}

export default HabitCard;
