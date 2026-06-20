import moment from 'moment';

export function formatTime(date: string): string {
  const now = moment();
  const target = moment(date);
  const diff = now.diff(target, 'seconds');

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
  return target.format('YYYY-MM-DD');
}

export function formatDate(date: string): string {
  return moment(date).format('YYYY-MM-DD');
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}
