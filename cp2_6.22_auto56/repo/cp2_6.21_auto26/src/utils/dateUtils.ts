export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getMonthKey = (date: Date): string => {
  return formatMonth(date);
};

export const getWeekDates = (date: Date = new Date()): Date[] => {
  const result: Date[] = [];
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);

  for (let i = 0; i < 7; i++) {
    result.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
};

export const isInCurrentWeek = (date: Date): boolean => {
  const now = new Date();
  const weekDates = getWeekDates(now);
  const targetStr = formatDate(date);

  return weekDates.some((d) => formatDate(d) === targetStr);
};
