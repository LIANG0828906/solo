import type { DonationItem, ItemCategory } from './dataManager';

export interface StatsSummary {
  totalItems: number;
  totalClaimed: number;
  totalCompleted: number;
  claimRate: number;
}

export interface DailyTrendPoint {
  date: string;
  count: number;
}

export interface CategoryDistribution {
  category: ItemCategory;
  count: number;
  percentage: number;
}

export function calculateSummary(items: DonationItem[]): StatsSummary {
  const totalItems = items.length;
  const totalClaimed = items.filter((item) => item.status !== '待认领').length;
  const totalCompleted = items.filter((item) => item.status === '已完成').length;
  const claimRate = totalClaimed > 0 ? Math.round((totalCompleted / totalClaimed) * 100) : 0;

  return { totalItems, totalClaimed, totalCompleted, claimRate };
}

export function calculateDailyTrend(items: DonationItem[], days: number = 30): DailyTrendPoint[] {
  const result: DailyTrendPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = items.filter((item) => {
      const itemDate = new Date(item.createdAt);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === date.getTime();
    }).length;
    result.push({ date: dateStr, count });
  }
  return result;
}

export function calculateCategoryDistribution(items: DonationItem[]): CategoryDistribution[] {
  const categories: ItemCategory[] = ['书籍', '衣物', '文具', '玩具', '其他'];
  const total = items.length || 1;

  return categories.map((category) => {
    const count = items.filter((item) => item.category === category).length;
    return {
      category,
      count,
      percentage: Math.round((count / total) * 100),
    };
  });
}
