import { v4 as uuidv4 } from 'uuid';
import type { Checkin } from '../types';

export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const createCheckin = (
  userId: string,
  skillId: string,
  date: string,
  duration: number,
  notes: string
): Checkin => ({
  id: uuidv4(),
  userId,
  skillId,
  date,
  duration: Math.max(1, Math.min(480, Math.floor(duration))),
  notes: notes.slice(0, 200),
  createdAt: Date.now()
});

export const calculateStreak = (checkins: Checkin[], userId: string): number => {
  if (checkins.length === 0) return 0;

  const userCheckins = checkins
    .filter(c => c.userId === userId)
    .map(c => c.date)
    .sort()
    .reverse();

  if (userCheckins.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateKey = formatDateKey(checkDate);
    if (userCheckins.includes(dateKey)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
};

export const getLastNDaysCheckins = (
  checkins: Checkin[], userId: string, days: number): Checkin[] => {
  const result: Checkin[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    const dateKey = formatDateKey(date);
    const dayCheckins = checkins.filter(
      c => c.userId === userId && c.date === dateKey);
    result.push(...dayCheckins);
  }

  return result;
};

export const getDailyDurationMap = (
  checkins: Checkin[],
  userId: string,
  days: number
): Array<{ date: string; duration: number }> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result: Array<{ date: string; duration: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = formatDateKey(date);
    const dayCheckins = checkins.filter(
      c => c.userId === userId && c.date === dateKey
    );
    const totalDuration = dayCheckins.reduce((sum, c) => sum + c.duration, 0);
    result.push({ date: dateKey, duration: totalDuration });
  }

  return result;
};

export const downsampleData = <T>(data: T[], maxPoints: number = 7): T[] => {
  if (data.length <= maxPoints) {
    return data;
  }
  return data.slice(-maxPoints);
};

export const getMonthDays = (year: number, month: number): Date[] => {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();

  for (let i = 0; i < startPadding; i++) {
    const d = new Date(year, month, -startPadding + i + 1);
    days.push(d);
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  while (days.length % 7 !== 0) {
    const lastDate = days[days.length - 1];
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + 1);
    days.push(nextDate);
  }

  return days;
};

export const validateCheckinDuration = (duration: number): boolean => {
  return Number.isInteger(duration) && duration >= 1 && duration <= 480;
};

export const validateCheckinNotes = (notes: string): boolean => {
  return notes.length <= 200;
};

export type DayStatus = 'completed' | 'missed' | 'pending';

export interface WeeklyDayData {
  dateKey: string;
  dayName: string;
  dayNumber: number;
  status: DayStatus;
  duration: number;
  isToday: boolean;
}

export const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const getWeeklyCalendarData = (
  checkins: Checkin[],
  userId: string
): WeeklyDayData[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const result: WeeklyDayData[] = [];
  const todayKey = formatDateKey(today);

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateKey = formatDateKey(date);

    const dayCheckins = checkins.filter(
      c => c.userId === userId && c.date === dateKey
    );
    const totalDuration = dayCheckins.reduce((sum, c) => sum + c.duration, 0);

    let status: DayStatus;
    if (totalDuration > 0) {
      status = 'completed';
    } else if (date < today) {
      status = 'missed';
    } else if (dateKey === todayKey) {
      status = 'pending';
    } else {
      status = 'pending';
    }

    result.push({
      dateKey,
      dayName: WEEKDAY_NAMES[i],
      dayNumber: date.getDate(),
      status,
      duration: totalDuration,
      isToday: dateKey === todayKey,
    });
  }

  return result;
};
