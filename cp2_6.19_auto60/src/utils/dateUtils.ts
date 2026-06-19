export type Category = 'entertainment' | 'office' | 'cloud' | 'music' | 'other';
export type BillingCycle = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  category: Category;
  monthlyFee: number;
  startDate: string;
  billingCycle: BillingCycle;
  emoji: string;
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function getDaysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getNextBillingDate(startDate: string, billingCycle: BillingCycle): Date {
  const start = parseDate(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  let nextDate = new Date(start);

  if (billingCycle === 'monthly') {
    while (nextDate <= today) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
  } else {
    while (nextDate <= today) {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
  }

  return nextDate;
}

export function getDaysUntilExpiry(sub: Subscription): number {
  const nextDate = getNextBillingDate(sub.startDate, sub.billingCycle);
  return getDaysUntil(nextDate);
}

export function getEffectiveMonthlyFee(sub: Subscription): number {
  if (sub.billingCycle === 'monthly') {
    return sub.monthlyFee;
  }
  return sub.monthlyFee / 12;
}

export function calculateTotalMonthly(subscriptions: Subscription[]): number {
  return subscriptions.reduce((total, sub) => total + getEffectiveMonthlyFee(sub), 0);
}

export function calculateMonthlyExpenses(subscriptions: Subscription[], monthsAgo: number = 0): number {
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const targetMonthEnd = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);

  let total = 0;

  for (const sub of subscriptions) {
    const start = parseDate(sub.startDate);
    if (start > targetMonthEnd) continue;

    if (sub.billingCycle === 'monthly') {
      total += getEffectiveMonthlyFee(sub);
    } else {
      let billingDate = new Date(start);
      while (billingDate <= targetMonthEnd) {
        if (billingDate >= targetMonth && billingDate <= targetMonthEnd) {
          total += sub.monthlyFee;
          break;
        }
        billingDate.setFullYear(billingDate.getFullYear() + 1);
      }
    }
  }

  return Math.round(total * 100) / 100;
}

export function getMonthlyTrend(subscriptions: Subscription[], months: number = 6): { month: string; amount: number }[] {
  const result: { month: string; amount: number }[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const amount = calculateMonthlyExpenses(subscriptions, i);
    result.push({ month: monthLabel, amount });
  }

  return result;
}

export function getCategoryBreakdown(subscriptions: Subscription[]): { category: Category; name: string; amount: number; percentage: number }[] {
  const categoryNames: Record<Category, string> = {
    entertainment: '娱乐',
    office: '办公',
    cloud: '云服务',
    music: '音乐',
    other: '其他',
  };

  const totals: Record<Category, number> = {
    entertainment: 0,
    office: 0,
    cloud: 0,
    music: 0,
    other: 0,
  };

  let total = 0;
  for (const sub of subscriptions) {
    const fee = getEffectiveMonthlyFee(sub);
    totals[sub.category] += fee;
    total += fee;
  }

  const result: { category: Category; name: string; amount: number; percentage: number }[] = [];
  for (const key of Object.keys(totals) as Category[]) {
    if (totals[key] > 0) {
      result.push({
        category: key,
        name: categoryNames[key],
        amount: Math.round(totals[key] * 100) / 100,
        percentage: total > 0 ? Math.round((totals[key] / total) * 100) : 0,
      });
    }
  }

  return result.sort((a, b) => b.amount - a.amount);
}

export function calculateExpenseChange(subscriptions: Subscription[]): number {
  const thisMonth = calculateMonthlyExpenses(subscriptions, 0);
  const lastMonth = calculateMonthlyExpenses(subscriptions, 1);

  if (lastMonth === 0) {
    return thisMonth > 0 ? 100 : 0;
  }

  return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
}

export const CATEGORY_COLORS: Record<Category, { gradient: string; solid: string }> = {
  entertainment: { gradient: 'linear-gradient(135deg, #fce7f3 0%, #e9d5ff 100%)', solid: '#ec4899' },
  office: { gradient: 'linear-gradient(135deg, #dbeafe 0%, #a5f3fc 100%)', solid: '#3b82f6' },
  cloud: { gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', solid: '#10b981' },
  music: { gradient: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)', solid: '#f59e0b' },
  other: { gradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', solid: '#6b7280' },
};

export const CATEGORY_EMOJIS: Record<Category, string> = {
  entertainment: '🎬',
  office: '💼',
  cloud: '☁️',
  music: '🎵',
  other: '📦',
};
