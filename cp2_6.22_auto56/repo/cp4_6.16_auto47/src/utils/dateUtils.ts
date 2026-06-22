import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  isWithinInterval,
  differenceInMinutes,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { CheckinRecord, DailyWorkHours, WeeklyAttendanceRate } from '@/types';

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function getWeekDays(date: Date = new Date()): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getDailyWorkHours(
  records: CheckinRecord[],
  weekDate: Date = new Date()
): DailyWorkHours[] {
  const weekDays = getWeekDays(weekDate);
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

  const dailyMap = new Map<string, number>();
  weekDays.forEach((day) => {
    dailyMap.set(format(day, 'yyyy-MM-dd'), 0);
  });

  const checkoutRecords = records.filter((r) => r.operationType === 'checkout' && r.checkoutTime && r.checkinTime);

  for (const record of checkoutRecords) {
    const recordDate = new Date(record.timestamp);
    if (isWithinInterval(recordDate, { start: weekStart, end: weekEnd })) {
      const dateKey = format(recordDate, 'yyyy-MM-dd');
      const current = dailyMap.get(dateKey) ?? 0;
      const minutes = record.workMinutes > 0
        ? record.workMinutes
        : differenceInMinutes(new Date(record.checkoutTime!), new Date(record.checkinTime!));
      dailyMap.set(dateKey, current + minutes / 60);
    }
  }

  return weekDays.map((day, index) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const totalHours = dailyMap.get(dateKey) ?? 0;
    return {
      day: dateKey,
      dayLabel: WEEKDAY_LABELS[index],
      hours: Math.round(totalHours * 100) / 100,
    };
  });
}

export function getWeeklyAttendanceRate(
  records: CheckinRecord[],
  referenceDate: Date = new Date()
): WeeklyAttendanceRate[] {
  const result: WeeklyAttendanceRate[] = [];
  const checkoutRecords = records.filter((r) => r.operationType === 'checkout');

  for (let i = 3; i >= 0; i--) {
    const weekDate = subWeeks(referenceDate, i);
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

    const workingDays = 5;

    const presentDays = new Set<string>();
    for (const record of checkoutRecords) {
      const recordDate = new Date(record.date);
      if (isWithinInterval(recordDate, { start: weekStart, end: weekEnd })) {
        presentDays.add(record.date);
      }
    }

    const presentCount = Math.min(presentDays.size, workingDays);
    const rate = Math.min(100, Math.max(0, Math.round((presentCount / workingDays) * 100)));

    result.push({
      week: format(weekStart, 'yyyy-MM-dd'),
      weekLabel: `第${format(weekDate, 'w', { locale: zhCN })}周`,
      rate,
    });
  }

  return result;
}

export function getDateRangeForPicker(): { min: string; max: string } {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return {
    min: format(thirtyDaysAgo, 'yyyy-MM-dd'),
    max: format(today, 'yyyy-MM-dd'),
  };
}

export function formatTime(isoString: string | null): string {
  if (!isoString) return '--:--';
  return format(new Date(isoString), 'HH:mm');
}

export function formatFullTime(isoString: string | null): string {
  if (!isoString) return '--:--:--';
  return format(new Date(isoString), 'HH:mm:ss');
}

export function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}分钟`;
  return `${hrs}小时${mins}分钟`;
}
