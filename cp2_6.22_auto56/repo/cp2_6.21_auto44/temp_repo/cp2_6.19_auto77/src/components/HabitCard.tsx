import { memo } from 'react';
import type { Habit } from '../types';

export interface HabitCardProps {
  habit: Habit;
  weeklyCount: number;
  isNew?: boolean;
  showCheck?: boolean;
  checkedToday?: boolean;
  animationDelay?: number;
  onCheck?: (habitId: string) => void;
  onClick?: (habitId: string) => void;
}

function HabitCardInner({
  habit,
  weeklyCount,
  isNew,
  showCheck = false,
  checkedToday = false,
  animationDelay = 0,
  onCheck,
  onClick,
}: HabitCardProps) {
  const handleCardClick = () => {
    if (onClick) onClick(habit.id);
  };

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCheck && !checkedToday) onCheck(habit.id);
  };

  return (
    <div
      className="habit-card"
      onClick={handleCardClick}
      style={
        {
          animationDelay: `${animationDelay}ms`,
          cursor: onClick ? 'pointer' : 'default',
        } as React.CSSProperties
      }
      data-is-new={isNew ? '1' : '0'}
    >
      <div
        className="habit-icon-wrap"
        style={{ background: habit.color }}
      >
        <span className="habit-icon" aria-hidden>
          {habit.icon}
        </span>
      </div>

      <div className="habit-main">
        <div className="habit-name" title={habit.name}>
          {habit.name}
        </div>
        <div className="habit-sub">
          本周 {weeklyCount}/{habit.weeklyTarget} 天
          <span className="tag">目标 {habit.weeklyTarget} 天/周</span>
        </div>
      </div>

      {showCheck && (
        <button
          type="button"
          className={
            'check-btn ' +
            (checkedToday ? 'checked ' : '') +
            (checkedToday ? 'disabled' : '')
          }
          onClick={handleCheck}
          aria-label={checkedToday ? '已完成打卡' : '点击打卡'}
          disabled={checkedToday}
        >
          <svg className="check-svg" viewBox="0 0 24 24" aria-hidden>
            <polyline points="4 12 10 18 20 6" />
          </svg>
        </button>
      )}
    </div>
  );
}

export const HabitCard = memo(HabitCardInner);
HabitCard.displayName = 'HabitCard';
