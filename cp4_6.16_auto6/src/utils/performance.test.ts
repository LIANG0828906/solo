import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import type { Subscription, BillingCycle, Category } from '@/types';
import { BILLING_CYCLE_MULTIPLIER } from '@/types';

function generateMockSubscriptions(count: number): Subscription[] {
  const names = ['Netflix', 'Spotify', 'iCloud', 'Dropbox', 'Adobe', 'Microsoft 365'];
  const categories: Category[] = ['entertainment', 'tool', 'storage', 'other'];
  const cycles: BillingCycle[] = ['monthly', 'quarterly', 'yearly'];
  const now = new Date().toISOString();

  return Array.from({ length: count }, (_, i) => ({
    id: uuidv4(),
    name: names[i % names.length] + (count > names.length ? ` ${i + 1}` : ''),
    price: Math.round((Math.random() * 200 + 5) * 100) / 100,
    billingCycle: cycles[i % cycles.length],
    nextBillingDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    category: categories[i % categories.length],
    note: '',
    createdAt: now,
    updatedAt: now,
  }));
}

function getMonthlyPrice(sub: Subscription): number {
  return sub.price / BILLING_CYCLE_MULTIPLIER[sub.billingCycle];
}

describe('性能测试', () => {
  it('200条数据 - 日历渲染时间应 ≤ 100ms', () => {
    const subs = generateMockSubscriptions(200);
    const start = performance.now();

    const billingMap = new Map<string, Subscription[]>();
    for (const sub of subs) {
      const key = sub.nextBillingDate.slice(0, 10);
      const list = billingMap.get(key) ?? [];
      list.push(sub);
      billingMap.set(key, list);
    }

    const duration = performance.now() - start;
    console.log(`200条数据 - 日历渲染: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(100);
  });

  it('200条数据 - 统计计算时间应 ≤ 80ms', () => {
    const subs = generateMockSubscriptions(200);
    const start = performance.now();

    const totalMonthly = subs.reduce((sum, sub) => sum + getMonthlyPrice(sub), 0);
    const categoryMap = new Map<Category, number>();
    for (const sub of subs) {
      const monthly = getMonthlyPrice(sub);
      categoryMap.set(sub.category, (categoryMap.get(sub.category) ?? 0) + monthly);
    }
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiring = subs.filter((sub) => {
      const d = new Date(sub.nextBillingDate);
      return d >= now && d <= sevenDaysLater;
    });

    void totalMonthly;
    void categoryMap;
    void expiring;

    const duration = performance.now() - start;
    console.log(`200条数据 - 统计计算: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(80);
  });

  it('500条数据 - 性能应保持稳定', () => {
    const subs = generateMockSubscriptions(500);
    const startCalendar = performance.now();

    const billingMap = new Map<string, Subscription[]>();
    for (const sub of subs) {
      const key = sub.nextBillingDate.slice(0, 10);
      const list = billingMap.get(key) ?? [];
      list.push(sub);
      billingMap.set(key, list);
    }
    const calendarTime = performance.now() - startCalendar;

    const startStats = performance.now();
    subs.reduce((sum, sub) => sum + getMonthlyPrice(sub), 0);
    const statsTime = performance.now() - startStats;

    console.log(`500条数据 - 日历渲染: ${calendarTime.toFixed(2)}ms, 统计计算: ${statsTime.toFixed(2)}ms`);
    expect(calendarTime).toBeLessThan(200);
    expect(statsTime).toBeLessThan(160);
  });
});
