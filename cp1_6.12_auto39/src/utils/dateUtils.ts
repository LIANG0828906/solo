import {
  format,
  addMinutes,
  isBefore,
  isAfter,
  parse,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addHours,
  startOfDay,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  const endDate = addMinutes(date, durationMinutes);
  return format(endDate, 'HH:mm');
};

export const checkTimeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const parseTime = (time: string): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);

  return isBefore(s1, e2) && isAfter(e1, s2);
};

export const getTimeUntilExpiry = (
  expiryDate: string
): { days: number; hours: number; minutes: number; isExpired: boolean } => {
  const now = new Date();
  const expiry = new Date(expiryDate);

  const isExpired = isBefore(expiry, now);

  if (isExpired) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }

  const days = differenceInDays(expiry, now);
  const hours = differenceInHours(expiry, now) % 24;
  const minutes = differenceInMinutes(expiry, now) % 60;

  return { days, hours, minutes, isExpired };
};

export const isExpiringWithin24Hours = (expiryDate: string): boolean => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const twentyFourHoursLater = addHours(now, 24);

  return isBefore(expiry, twentyFourHoursLater) && isAfter(expiry, now);
};

export const formatDate = (date: string | Date, formatStr: string = 'yyyy-MM-dd'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: zhCN });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

export const combineDateAndTime = (dateStr: string, timeStr: string): Date => {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  const [hours, minutes] = timeStr.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const getTodayString = (): string => {
  return format(startOfDay(new Date()), 'yyyy-MM-dd');
};

export const formatTimeUntilExpiry = (expiryDate: string): string => {
  const { days, hours, minutes, isExpired } = getTimeUntilExpiry(expiryDate);

  if (isExpired) {
    return '已过期';
  }

  if (days > 0) {
    return `还有 ${days} 天 ${hours} 小时`;
  }

  if (hours > 0) {
    return `还有 ${hours} 小时 ${minutes} 分钟`;
  }

  return `还有 ${minutes} 分钟`;
};
