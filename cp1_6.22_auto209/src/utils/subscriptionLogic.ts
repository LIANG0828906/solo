export type CategoryType = 'streaming' | 'cloud' | 'fitness' | 'software' | 'other';
export type CycleType = 'monthly' | 'quarterly' | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  category: CategoryType;
  cycle: CycleType;
  amount: number;
  expiryDate: string;
  isActive: boolean;
  trialReminder: boolean;
  createdAt: string;
}

export interface CategoryStats {
  category: CategoryType;
  total: number;
  count: number;
}

export interface MonthData {
  month: string;
  total: number;
  [key: string]: number | string;
}

export const CATEGORY_MAP: Record<CategoryType, { label: string; emoji: string }> = {
  streaming: { label: '流媒体', emoji: '🎬' },
  cloud: { label: '云存储', emoji: '☁️' },
  fitness: { label: '健身', emoji: '💪' },
  software: { label: '软件', emoji: '💻' },
  other: { label: '其他', emoji: '📦' },
};

export const CYCLE_MAP: Record<CycleType, { label: string; months: number }> = {
  monthly: { label: '月', months: 1 },
  quarterly: { label: '季', months: 3 },
  yearly: { label: '年', months: 12 },
};

const STORAGE_KEY = 'subscription_manager_data';

export function calculateDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getExpiryColor(days: number): string {
  if (days <= 7) return '#EF4444';
  if (days <= 30) return '#F97316';
  return '#6B7280';
}

export function calculateYearlyCost(amount: number, cycle: CycleType): number {
  const months = CYCLE_MAP[cycle].months;
  return Math.round((amount / months) * 12 * 100) / 100;
}

export function groupByCategory(subscriptions: Subscription[]): CategoryStats[] {
  const stats: Record<string, CategoryStats> = {};

  subscriptions
    .filter((s) => s.isActive)
    .forEach((sub) => {
      const yearlyAmount = calculateYearlyCost(sub.amount, sub.cycle);
      if (!stats[sub.category]) {
        stats[sub.category] = {
          category: sub.category,
          total: 0,
          count: 0,
        };
      }
      stats[sub.category].total += yearlyAmount;
      stats[sub.category].count += 1;
    });

  return Object.values(stats);
}

export function getMonthlyTrend(subscriptions: Subscription[]): MonthData[] {
  const months: MonthData[] = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = `${date.getMonth() + 1}月`;

    const monthData: MonthData = {
      month: monthLabel,
      total: 0,
    };

    Object.keys(CATEGORY_MAP).forEach((cat) => {
      monthData[cat] = 0;
    });

    subscriptions
      .filter((s) => s.isActive)
      .forEach((sub) => {
        const monthlyAmount = sub.amount / CYCLE_MAP[sub.cycle].months;
        monthData.total += monthlyAmount;
        monthData[sub.category] = (monthData[sub.category] as number) + monthlyAmount;
      });

    monthData.total = Math.round(monthData.total * 100) / 100;
    Object.keys(CATEGORY_MAP).forEach((cat) => {
      monthData[cat] = Math.round((monthData[cat] as number) * 100) / 100;
    });

    months.push(monthData);
  }

  return months;
}

export function getCategoryTrend(subscriptions: Subscription[]): Array<{ month: string; [key: string]: number | string }> {
  const months: Array<{ month: string; [key: string]: number | string }> = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthLabel = `${date.getMonth() + 1}月`;

    const monthData: { month: string; [key: string]: number | string } = {
      month: monthLabel,
    };

    const categoryTotals: Record<string, number> = {};
    let total = 0;

    subscriptions
      .filter((s) => s.isActive)
      .forEach((sub) => {
        const monthlyAmount = sub.amount / CYCLE_MAP[sub.cycle].months;
        categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + monthlyAmount;
        total += monthlyAmount;
      });

    Object.keys(CATEGORY_MAP).forEach((cat) => {
      const catTotal = categoryTotals[cat] || 0;
      monthData[CATEGORY_MAP[cat as CategoryType].label] = total > 0 ? Math.round((catTotal / total) * 100) : 0;
    });

    months.push(monthData);
  }

  return months;
}

export function loadFromLocalStorage(): Subscription[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return [];
}

export function saveToLocalStorage(subscriptions: Subscription[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function generateCSV(subscriptions: Subscription[]): string {
  const headers = ['服务名称', '类别', '计费周期', '金额', '到期日期', '状态'];

  const escapeCSV = (value: string | number): string | number => {
    if (typeof value === 'string') {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      if (/^[=+-@]/.test(value)) {
        return `'${value}`;
      }
    }
    return value;
  };

  const rows = subscriptions.map((sub) => [
    escapeCSV(sub.name),
    escapeCSV(CATEGORY_MAP[sub.category].label),
    escapeCSV(CYCLE_MAP[sub.cycle].label),
    sub.amount,
    sub.expiryDate,
    sub.isActive ? '启用' : '暂停',
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  return '\uFEFF' + csvContent;
}

export function filterSubscriptions(subscriptions: Subscription[], query: string): Subscription[] {
  if (!query.trim()) return subscriptions;
  const lowerQuery = query.toLowerCase();
  return subscriptions.filter(
    (sub) =>
      sub.name.toLowerCase().includes(lowerQuery) ||
      CATEGORY_MAP[sub.category].label.includes(query)
  );
}

export function sortByExpiry(subscriptions: Subscription[]): Subscription[] {
  return [...subscriptions].sort((a, b) => {
    const daysA = calculateDaysUntilExpiry(a.expiryDate);
    const daysB = calculateDaysUntilExpiry(b.expiryDate);
    return daysA - daysB;
  });
}

export function getExpiringSubscriptions(subscriptions: Subscription[], days: number = 7): Subscription[] {
  return subscriptions.filter(
    (sub) => sub.isActive && calculateDaysUntilExpiry(sub.expiryDate) <= days
  );
}
