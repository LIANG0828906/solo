import {
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  isSameDay,
  isSameMonth,
  differenceInDays,
} from 'date-fns';
import type { Activity, DailyEmission, ActivityType } from '@/types';
import { ACTIVITY_TYPE_COLORS, getFactor } from '@/constants/emissionFactors';

export const formatNumber = (num: number, decimals = 2): string => {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

export const formatDateKey = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(startOfDay(d), 'yyyy-MM-dd');
};

export const todayKey = (): string => formatDateKey(new Date());

export const getDateRange = (days: number): Date[] => {
  const result: Date[] = [];
  const today = startOfDay(new Date());
  for (let i = days - 1; i >= 0; i--) {
    result.push(subDays(today, i));
  }
  return result;
};

export const aggregateDailyEmissions = (
  activities: Activity[],
  days = 30,
): DailyEmission[] => {
  const dates = getDateRange(days);
  const map = new Map<string, DailyEmission>();

  dates.forEach((date) => {
    const key = formatDateKey(date);
    map.set(key, {
      date: key,
      dateLabel: format(date, 'MM/dd'),
      total: 0,
      transport: 0,
      diet: 0,
      electricity: 0,
    });
  });

  activities.forEach((act) => {
    const key = formatDateKey(act.date);
    const existing = map.get(key);
    if (existing) {
      existing.total += act.emission;
      existing[act.type] += act.emission;
    }
  });

  const result = Array.from(map.values());
  result.forEach((d) => {
    d.total = Math.round(d.total * 100) / 100;
    d.transport = Math.round(d.transport * 100) / 100;
    d.diet = Math.round(d.diet * 100) / 100;
    d.electricity = Math.round(d.electricity * 100) / 100;
  });

  return result;
};

export const getTodayEmission = (activities: Activity[]): number => {
  const today = todayKey();
  return activities
    .filter((a) => formatDateKey(a.date) === today)
    .reduce((sum, a) => sum + a.emission, 0);
};

export const getMonthEmission = (activities: Activity[]): number => {
  const monthStart = startOfMonth(new Date());
  return activities
    .filter((a) => isSameMonth(new Date(a.date), monthStart))
    .reduce((sum, a) => sum + a.emission, 0);
};

export const getWeekEmission = (activities: Activity[]): number => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return activities
    .filter((a) => {
      const d = new Date(a.date);
      return d >= weekStart && d <= new Date();
    })
    .reduce((sum, a) => sum + a.emission, 0);
};

export const getRecentActivities = (
  activities: Activity[],
  days: number,
): Activity[] => {
  const cutoff = subDays(new Date(), days - 1);
  return activities.filter((a) => {
    const d = new Date(a.date);
    return differenceInDays(new Date(), d) < days && d >= startOfDay(cutoff);
  });
};

export const filterActivitiesByType = (
  activities: Activity[],
  type: ActivityType,
): Activity[] => {
  return activities.filter((a) => a.type === type);
};

export const filterActivitiesBySubtype = (
  activities: Activity[],
  subtype: string,
): Activity[] => {
  return activities.filter((a) => a.subtype === subtype);
};

export const calculateTargetProgress = (
  currentMonth: number,
  target: number,
): number => {
  if (target <= 0) return 100;
  const progress = ((target - currentMonth) / target) * 100;
  return Math.max(0, Math.min(100, Math.round(progress * 10) / 10));
};

export const getProgressColor = (percentage: number): string => {
  if (percentage < 33) return '#E53935';
  if (percentage < 66) return '#FFA726';
  return '#43A047';
};

export const getTopEmittingSubtypes = (
  activities: Activity[],
  limit = 10,
) => {
  const map = new Map<string, { emission: number; count: number }>();

  activities.forEach((a) => {
    const key = a.subtype;
    const existing = map.get(key) || { emission: 0, count: 0 };
    existing.emission += a.emission;
    existing.count += 1;
    map.set(key, existing);
  });

  const total = Array.from(map.values()).reduce(
    (s, v) => s + v.emission,
    0,
  );

  const result = Array.from(map.entries())
    .map(([subtype, data]) => {
      const factor = getFactor('transport', subtype)
        || getFactor('diet', subtype)
        || getFactor('electricity', subtype);
      return {
        subtype,
        label: factor?.label || subtype,
        type: factor?.type || ('transport' as ActivityType),
        totalEmission: Math.round(data.emission * 100) / 100,
        percentage: total > 0 ? Math.round((data.emission / total) * 1000) / 10 : 0,
        count: data.count,
        icon: factor?.icon || '📊',
        color: factor?.color || ACTIVITY_TYPE_COLORS.transport,
      };
    })
    .sort((a, b) => b.totalEmission - a.totalEmission)
    .slice(0, limit);

  return result;
};

export const getActivityTypeColor = (type: ActivityType): string => {
  return ACTIVITY_TYPE_COLORS[type];
};
