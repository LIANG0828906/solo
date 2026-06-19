import type { Product, UsageLog, ProductStatus } from '@/types';
import { addMonths, isPast, getDaysDiff, getPast7Days, getTodayString, addDays } from './dateUtils';

export const getRemainingPercent = (product: Product): number => {
  if (product.capacity <= 0) return 0;
  const remaining = product.capacity - product.usedAmount;
  return Math.max(0, Math.min(100, (remaining / product.capacity) * 100));
};

export const get7DayAverageUsage = (productId: string, logs: UsageLog[]): number => {
  const past7Days = getPast7Days();
  const productLogs = logs.filter(log => 
    log.productId === productId && past7Days.includes(log.date)
  );
  
  if (productLogs.length === 0) return 0;
  
  const totalAmount = productLogs.reduce((sum, log) => sum + log.amount, 0);
  return totalAmount / 7;
};

export const getEstimatedFinishDate = (product: Product, logs: UsageLog[]): string | null => {
  const avgDailyUsage = get7DayAverageUsage(product.id, logs);
  if (avgDailyUsage <= 0) return null;
  
  const remaining = product.capacity - product.usedAmount;
  if (remaining <= 0) return getTodayString();
  
  const remainingDays = Math.ceil(remaining / avgDailyUsage);
  const estimatedDate = addDays(new Date(), remainingDays);
  return estimatedDate.toISOString().split('T')[0];
};

export const getEstimatedDaysLeft = (product: Product, logs: UsageLog[]): number | null => {
  const avgDailyUsage = get7DayAverageUsage(product.id, logs);
  if (avgDailyUsage <= 0) return null;
  
  const remaining = product.capacity - product.usedAmount;
  if (remaining <= 0) return 0;
  
  return Math.ceil(remaining / avgDailyUsage);
};

export const getProductStatus = (product: Product): ProductStatus => {
  if (product.usedAmount >= product.capacity) {
    return '已用完';
  }
  
  const expireDate = addMonths(new Date(product.openDate), product.shelfLife);
  if (isPast(expireDate)) {
    return '已过期';
  }
  
  return '进行中';
};

export const isLowStock = (product: Product): boolean => {
  return getRemainingPercent(product) < 10;
};

export const getExpireDate = (product: Product): Date => {
  return addMonths(new Date(product.openDate), product.shelfLife);
};

export const getDaysUntilExpire = (product: Product): number => {
  const expireDate = getExpireDate(product);
  return getDaysDiff(new Date(), expireDate);
};

export const getUniqueBrands = (products: Product[]): string[] => {
  const brands = new Set(products.map(p => p.brand));
  return Array.from(brands).sort();
};

export const getUsageChartData = (productId: string, logs: UsageLog[]): Array<{ date: string; amount: number; dayName: string }> => {
  const past7Days = getPast7Days();
  
  return past7Days.map(date => {
    const dayLogs = logs.filter(log => log.productId === productId && log.date === date);
    const amount = dayLogs.reduce((sum, log) => sum + log.amount, 0);
    
    const dateObj = new Date(date);
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dayName = dayNames[dateObj.getDay()];
    
    return { date, amount, dayName };
  });
};

export const sortProducts = (products: Product[], logs: UsageLog[]): Product[] => {
  return [...products].sort((a, b) => {
    const aLowStock = isLowStock(a);
    const bLowStock = isLowStock(b);
    
    if (aLowStock && !bLowStock) return -1;
    if (!aLowStock && bLowStock) return 1;
    
    const aStatus = getProductStatus(a);
    const bStatus = getProductStatus(b);
    
    const statusPriority: Record<ProductStatus, number> = {
      '进行中': 0,
      '已过期': 1,
      '已用完': 2,
    };
    
    if (statusPriority[aStatus] !== statusPriority[bStatus]) {
      return statusPriority[aStatus] - statusPriority[bStatus];
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const getDailyUsageStats = (logs: UsageLog[]): Array<{ date: string; count: number; amount: number }> => {
  const past7Days = getPast7Days();
  
  return past7Days.map(date => {
    const dayLogs = logs.filter(log => log.date === date);
    const uniqueProducts = new Set(dayLogs.map(log => log.productId));
    const totalAmount = dayLogs.reduce((sum, log) => sum + log.amount, 0);
    
    return {
      date,
      count: uniqueProducts.size,
      amount: Math.round(totalAmount * 10) / 10,
    };
  });
};
