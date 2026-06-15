export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export function isDateInRange(dateStr: string, start?: string, end?: string): boolean {
  const date = new Date(dateStr);
  if (start && date < new Date(start)) return false;
  if (end && date > new Date(end + 'T23:59:59')) return false;
  return true;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
