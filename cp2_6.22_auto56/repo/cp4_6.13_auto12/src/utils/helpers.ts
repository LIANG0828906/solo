export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
};

export const formatHours = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}分钟`;
  }
  return `${hours.toFixed(1)}小时`;
};

export const formatDateCN = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

export const formatDateTimeCN = (isoStr: string): string => {
  const d = new Date(isoStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const adjustBrightness = (hex: string, percent: number): string => {
  const h = hex.replace('#', '');
  let r = parseInt(h.substring(0, 2), 16);
  let g = parseInt(h.substring(2, 4), 16);
  let b = parseInt(h.substring(4, 6), 16);
  r = Math.min(255, Math.max(0, Math.round(r * (1 + percent / 100))));
  g = Math.min(255, Math.max(0, Math.round(g * (1 + percent / 100))));
  b = Math.min(255, Math.max(0, Math.round(b * (1 + percent / 100))));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
};

export const generateHeatColor = (color: string, ratio: number): string => {
  if (ratio <= 0) return '#3a3a4a';
  const clamped = Math.min(1, Math.max(0, ratio));
  const h = color.replace('#', '');
  const targetR = parseInt(h.substring(0, 2), 16);
  const targetG = parseInt(h.substring(2, 4), 16);
  const targetB = parseInt(h.substring(4, 6), 16);
  const base = 58;
  const r = Math.round(base + (targetR - base) * clamped);
  const g = Math.round(base + (targetG - base) * clamped);
  const b = Math.round(base + (targetB - base) * clamped);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
};

export const getDateArray = (start: Date, days: number): Date[] => {
  const arr: Date[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    arr.push(d);
  }
  return arr;
};

export const getMonthDays = (year: number, month: number): Date[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1);
  const startPadding = firstDay.getDay();
  const totalCells = Math.ceil((startPadding + daysInMonth) / 7) * 7;
  const arr: Date[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(year, month, 1 - startPadding + i);
    arr.push(d);
  }
  return arr;
};

export const getWeekDates = (anchor: Date = new Date()): { start: Date; end: Date } => {
  const d = new Date(anchor);
  const day = (d.getDay() + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

export const coldToWarmGradient = (ratio: number): string => {
  const r = clamp(Math.round(60 + 195 * ratio), 0, 255);
  const g = clamp(Math.round(120 - 60 * ratio), 0, 255);
  const b = clamp(Math.round(255 - 215 * ratio), 0, 255);
  return `rgb(${r}, ${g}, ${b})`;
};

export const getDefaultAvatar = (nickname: string): string => {
  const colors = ['#7c6fff', '#f5c542', '#22c55e', '#ef4444', '#3b82f6', '#ec4899'];
  const idx = (nickname?.charCodeAt(0) || 0) % colors.length;
  const color = colors[idx];
  const letter = (nickname || 'U').charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="${color}"/><text x="50" y="65" font-size="48" text-anchor="middle" fill="#fff" font-family="system-ui" font-weight="600">${letter}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const triggerNotification = (title: string, body: string) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%237c6fff"%3E%3Cpath d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/%3E%3C/svg%3E',
      });
    } catch {}
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
};

export const debounce = <T extends (...args: any[]) => any>(fn: T, ms: number) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};
