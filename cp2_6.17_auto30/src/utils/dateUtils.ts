export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseDateLocal(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateLocal(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  return new Date(dateStr);
}

export function parseDate(dateStr: string): Date {
  return parseDateLocal(dateStr);
}

export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? parseDateLocal(date) : new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseDateLocal(date1) : new Date(date1);
  const d2 = typeof date2 === 'string' ? parseDateLocal(date2) : new Date(date2);
  const msPerDay = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / msPerDay);
}

export function daysFromToday(date: Date | string): number {
  const today = new Date();
  const target = typeof date === 'string' ? parseDateLocal(date) : new Date(date);
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((utcTarget - utcToday) / msPerDay);
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseDateLocal(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseDateLocal(date2) : date2;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function today(): string {
  return formatDate(new Date());
}
