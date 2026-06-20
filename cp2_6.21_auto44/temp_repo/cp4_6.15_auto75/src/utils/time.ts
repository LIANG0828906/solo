export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) {
    return '刚刚';
  }

  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}分钟前`;
  }

  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}小时前`;
  }

  if (diff < 2 * day) {
    return '昨天';
  }

  if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days}天前`;
  }

  if (diff < month) {
    const weeks = Math.floor(diff / week);
    return `${weeks}周前`;
  }

  if (diff < year) {
    const months = Math.floor(diff / month);
    return `${months}个月前`;
  }

  const years = Math.floor(diff / year);
  return `${years}年前`;
}
