export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateRange = (dates: string[]): { min: Date; max: Date } => {
  const parsedDates = dates.map((d) => new Date(d));
  const min = new Date(Math.min(...parsedDates.map((d) => d.getTime())));
  const max = new Date(Math.max(...parsedDates.map((d) => d.getTime())));
  
  min.setDate(min.getDate() - 7);
  max.setDate(max.getDate() + 7);
  
  return { min, max };
};

export const getDaysDiff = (start: Date, end: Date): number => {
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isToday = (dateStr: string): boolean => {
  const today = new Date();
  const date = new Date(dateStr);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};
