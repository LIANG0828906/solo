export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
    }
    return `${hours}小时前`;
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}

export function formatDueDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

export function getDateRange(period: 'week' | 'twoWeeks' | 'month'): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'twoWeeks':
      start.setDate(start.getDate() - 14);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
  }
  
  return { start, end };
}

export function isDateInRange(dateString: string, start: Date, end: Date): boolean {
  const date = new Date(dateString);
  return date >= start && date <= end;
}
