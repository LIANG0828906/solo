export interface TimezoneInfo {
  name: string;
  offset: number;
}

export const TIMEZONE_OFFSETS: Record<string, number> = {
  'UTC-12': -12, 'UTC-11': -11, 'UTC-10': -10, 'UTC-9:30': -9.5,
  'UTC-9': -9, 'UTC-8': -8, 'UTC-7': -7, 'UTC-6': -6, 'UTC-5': -5,
  'UTC-4': -4, 'UTC-3:30': -3.5, 'UTC-3': -3, 'UTC-2': -2, 'UTC-1': -1,
  'UTC+0': 0, 'UTC+1': 1, 'UTC+2': 2, 'UTC+3': 3, 'UTC+3:30': 3.5,
  'UTC+4': 4, 'UTC+4:30': 4.5, 'UTC+5': 5, 'UTC+5:30': 5.5, 'UTC+5:45': 5.75,
  'UTC+6': 6, 'UTC+6:30': 6.5, 'UTC+7': 7, 'UTC+8': 8, 'UTC+8:45': 8.75,
  'UTC+9': 9, 'UTC+9:30': 9.5, 'UTC+10': 10, 'UTC+10:30': 10.5, 'UTC+11': 11,
  'UTC+12': 12, 'UTC+12:45': 12.75, 'UTC+13': 13, 'UTC+14': 14,
};

export const ALL_TIMEZONES = Object.keys(TIMEZONE_OFFSETS);

export const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function getTimezoneOffset(timezone: string): number {
  return TIMEZONE_OFFSETS[timezone] ?? 0;
}

export function localHourToUTC(localHour: number, timezone: string): number {
  const offset = getTimezoneOffset(timezone);
  let utcHour = localHour - offset;
  while (utcHour < 0) utcHour += 24;
  while (utcHour >= 24) utcHour -= 24;
  return Math.floor(utcHour);
}

export function utcHourToLocal(utcHour: number, timezone: string): number {
  const offset = getTimezoneOffset(timezone);
  let localHour = utcHour + offset;
  while (localHour < 0) localHour += 24;
  while (localHour >= 24) localHour -= 24;
  return Math.floor(localHour);
}

export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function formatHourRange(startHour: number, endHour: number): string {
  return `${formatHour(startHour)}-${formatHour(endHour)}`;
}

export function formatLocalHourFromUTC(utcHour: number, timezone: string): string {
  return formatHour(utcHourToLocal(utcHour, timezone));
}

export function timeSlotsIntersect(
  startA: number, endA: number,
  startB: number, endB: number
): boolean {
  return startA < endB && startB < endA;
}

export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getUTCDay();
}

export function getUTCTodayString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}-${now.getUTCDate().toString().padStart(2, '0')}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}-${d.getUTCDate().toString().padStart(2, '0')}`;
}

export function getMinutesUntil(
  dateStr: string,
  timeUTC: string
): number {
  const meetingTime = new Date(`${dateStr}T${timeUTC}Z`).getTime();
  return Math.floor((meetingTime - Date.now()) / 60000);
}

export function formatCountdown(minutes: number): string {
  if (minutes < 0) return '已开始';
  if (minutes < 60) return `${minutes}分钟后`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}小时${mins}分钟后`;
  const days = Math.floor(hours / 24);
  return `${days}天${hours % 24}小时后`;
}

export function getBrowserTimezone(): string {
  try {
    const offset = -new Date().getTimezoneOffset() / 60;
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const hours = Math.floor(abs);
    const mins = Math.round((abs - hours) * 60);
    if (mins === 0) {
      return `UTC${sign}${hours}`;
    }
    return `UTC${sign}${hours}:${mins.toString().padStart(2, '0')}`;
  } catch {
    return 'UTC+0';
  }
}
