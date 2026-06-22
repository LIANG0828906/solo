import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export function formatPrice(price: number): string {
  if (price >= 100000000) {
    return `¥${(price / 100000000).toFixed(2)}亿`;
  }
  if (price >= 10000) {
    return `¥${(price / 10000).toFixed(1)}万`;
  }
  return `¥${price.toLocaleString('zh-CN')}`;
}

export function formatFullPrice(price: number): string {
  return `¥${price.toLocaleString('zh-CN')}`;
}

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getCountdown(endTime: string): CountdownParts {
  const end = dayjs(endTime);
  const now = dayjs();
  const diff = Math.max(0, end.diff(now));
  const dur = dayjs.duration(diff);
  return {
    days: Math.floor(dur.asDays()),
    hours: dur.hours(),
    minutes: dur.minutes(),
    seconds: dur.seconds(),
  };
}

export function formatCountdown(endTime: string): string {
  const { days, hours, minutes, seconds } = getCountdown(endTime);
  if (days > 0) {
    return `${days}天 ${hours.toString().padStart(2, '0')}时 ${minutes.toString().padStart(2, '0')}分`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function isEndingSoon(endTime: string, hours = 6): boolean {
  const end = dayjs(endTime);
  return end.diff(dayjs(), 'hour') <= hours;
}

export function formatDateTime(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm');
}

export function formatRelativeTime(iso: string): string {
  return dayjs(iso).fromNow();
}

export function pad(num: number, len = 2): string {
  return num.toString().padStart(len, '0');
}
