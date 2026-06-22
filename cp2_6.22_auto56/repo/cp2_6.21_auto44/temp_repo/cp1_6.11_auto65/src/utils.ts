import { Task, ViewMode } from './types';

export const ASSIGNEES = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];

export const COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'
];

export const getColorForAssignee = (assignee: string): string => {
  const index = ASSIGNEES.indexOf(assignee);
  return COLORS[index >= 0 ? index : 0];
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const diffDays = (date1: Date, date2: Date): number => {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const dateToPixel = (
  date: Date,
  startDate: Date,
  dayWidth: number
): number => {
  const diffTime = date.getTime() - startDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays * dayWidth;
};

export const pixelToDate = (
  pixel: number,
  startDate: Date,
  dayWidth: number
): Date => {
  const days = pixel / dayWidth;
  return new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
};

export const snapToGrid = (
  date: Date,
  snapToHalfDay: boolean = false
): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (snapToHalfDay && date.getHours() >= 12) {
    d.setHours(12, 0, 0, 0);
  }
  return d;
};

export const snapProgress = (progress: number): number => {
  return Math.max(0, Math.min(100, Math.round(progress / 5) * 5));
};

export const calculateBezierPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string => {
  const controlOffset = Math.abs(x2 - x1) * 0.4;
  return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
};

export const getArrowMarker = (): string => {
  return `url(#arrowhead)`;
};

export const getDayWidthForViewMode = (viewMode: ViewMode): number => {
  switch (viewMode) {
    case 'day':
      return 100;
    case 'week':
      return 30;
    case 'month':
      return 8;
    default:
      return 30;
  }
};

export const getTotalDaysForViewMode = (viewMode: ViewMode): number => {
  switch (viewMode) {
    case 'day':
      return 30;
    case 'week':
      return 90;
    case 'month':
      return 365;
    default:
      return 90;
  }
};

export const getViewModeLabel = (viewMode: ViewMode): string => {
  switch (viewMode) {
    case 'day':
      return '日视图';
    case 'week':
      return '周视图';
    case 'month':
      return '月视图';
    default:
      return '周视图';
  }
};

export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const getMonthName = (month: number): string => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months[month];
};

export const generateDateTicks = (
  startDate: Date,
  totalDays: number,
  viewMode: ViewMode
): Array<{ date: Date; label: string; isMajor: boolean }> => {
  const ticks: Array<{ date: Date; label: string; isMajor: boolean }> = [];
  
  for (let i = 0; i <= totalDays; i++) {
    const date = addDays(startDate, i);
    
    if (viewMode === 'day') {
      const isMajor = date.getDate() === 1 || date.getDay() === 1;
      ticks.push({
        date,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        isMajor
      });
    } else if (viewMode === 'week') {
      if (date.getDay() === 1) {
        ticks.push({
          date,
          label: `第${getWeekNumber(date)}周`,
          isMajor: true
        });
      } else if (i % 1 === 0) {
        ticks.push({
          date,
          label: `${date.getDate()}`,
          isMajor: false
        });
      }
    } else if (viewMode === 'month') {
      if (date.getDate() === 1) {
        ticks.push({
          date,
          label: getMonthName(date.getMonth()),
          isMajor: true
        });
      }
    }
  }
  
  return ticks;
};

export const getStatusColor = (task: Task): string => {
  if (task.status === 'completed') return '#10b981';
  if (task.status === 'warning') return '#f59e0b';
  return task.color;
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return '待开始';
    case 'in-progress':
      return '进行中';
    case 'completed':
      return '已完成';
    case 'warning':
      return '有阻塞';
    default:
      return status;
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const getRandomId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
