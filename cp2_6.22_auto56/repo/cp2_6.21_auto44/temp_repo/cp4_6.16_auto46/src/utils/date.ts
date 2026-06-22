export function isWithinDays(dateString: string, days: number): boolean {
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export function getMonthDay(dateString: string): { month: string; day: string } {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('zh-CN', { month: 'short' });
  const day = date.getDate().toString();
  return { month, day };
}

export function sortDatesByAscending(dates: { date: string }[]): any[] {
  return [...dates].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}
