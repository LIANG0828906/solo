export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
};

export const getDayLabel = (startDate: string, dayIndex: number): string => {
  const start = new Date(startDate);
  const current = new Date(start);
  current.setDate(start.getDate() + dayIndex);
  return `第 ${dayIndex + 1} 天 · ${current.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}`;
};

export const getDateRange = (startDate: string, endDate: string): string => {
  return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
};

export const getDayCount = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export const getDateForDay = (startDate: string, dayIndex: number): Date => {
  const start = new Date(startDate);
  const current = new Date(start);
  current.setDate(start.getDate() + dayIndex);
  return current;
};

export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  return new Date(startDate) <= new Date(endDate);
};
