import dayjs from 'dayjs';

export const formatPrice = (price: number): string => {
  return `¥${price.toFixed(2)}`;
};

export const formatDate = (date: string): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const getStockStatus = (
  stock: number,
  maxStock: number = 100
): { isLow: boolean; percentage: number } => {
  const percentage = Math.min(Math.max((stock / maxStock) * 100, 0), 100);
  const isLow = percentage < 20;
  return { isLow, percentage };
};

export const debounce = (func: Function, delay: number): Function => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const generateId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
