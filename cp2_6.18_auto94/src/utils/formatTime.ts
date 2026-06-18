export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, now)) {
    return `今天 ${timePart}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `昨天 ${timePart}`;
  }

  return `${pad(date.getMonth() + 1)}月${pad(date.getDate())}日`;
}

export function formatFullDateTime(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatHistoryTime(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatHistoryDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, now)) return '今天';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return '昨天';

  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
