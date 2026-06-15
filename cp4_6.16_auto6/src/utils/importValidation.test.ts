import { describe, it, expect } from 'vitest';
import type { Subscription } from '@/types';

function validateSubscriptionData(data: unknown): data is Subscription[] {
  if (!Array.isArray(data)) return false;
  return data.every((item) => {
    if (typeof item !== 'object' || item === null) return false;
    const sub = item as Record<string, unknown>;
    return (
      typeof sub.id === 'string' &&
      typeof sub.name === 'string' &&
      typeof sub.price === 'number' &&
      typeof sub.billingCycle === 'string' &&
      ['monthly', 'quarterly', 'yearly'].includes(sub.billingCycle as string) &&
      typeof sub.nextBillingDate === 'string' &&
      typeof sub.category === 'string' &&
      ['entertainment', 'tool', 'storage', 'other'].includes(sub.category as string) &&
      typeof sub.note === 'string'
    );
  });
}

describe('数据导入验证', () => {
  it('should validate correct subscription data', () => {
    const validData: Subscription[] = [
      {
        id: '1',
        name: 'Netflix',
        price: 68,
        billingCycle: 'monthly',
        nextBillingDate: '2026-06-18',
        category: 'entertainment',
        note: '',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ];
    expect(validateSubscriptionData(validData)).toBe(true);
  });

  it('should reject non-array data', () => {
    expect(validateSubscriptionData(null)).toBe(false);
    expect(validateSubscriptionData({})).toBe(false);
    expect(validateSubscriptionData('string')).toBe(false);
    expect(validateSubscriptionData(123)).toBe(false);
  });

  it('should reject missing required fields', () => {
    const invalidData = [
      {
        id: '1',
        name: 'Netflix',
        // missing price
        billingCycle: 'monthly',
        nextBillingDate: '2026-06-18',
        category: 'entertainment',
        note: '',
      },
    ];
    expect(validateSubscriptionData(invalidData)).toBe(false);
  });

  it('should reject invalid field types', () => {
    const invalidData = [
      {
        id: '1',
        name: 'Netflix',
        price: '68', // should be number
        billingCycle: 'monthly',
        nextBillingDate: '2026-06-18',
        category: 'entertainment',
        note: '',
      },
    ];
    expect(validateSubscriptionData(invalidData)).toBe(false);
  });

  it('should reject invalid billing cycle values', () => {
    const invalidData = [
      {
        id: '1',
        name: 'Netflix',
        price: 68,
        billingCycle: 'weekly', // invalid
        nextBillingDate: '2026-06-18',
        category: 'entertainment',
        note: '',
      },
    ];
    expect(validateSubscriptionData(invalidData)).toBe(false);
  });

  it('should reject invalid category values', () => {
    const invalidData = [
      {
        id: '1',
        name: 'Netflix',
        price: 68,
        billingCycle: 'monthly',
        nextBillingDate: '2026-06-18',
        category: 'music', // invalid
        note: '',
      },
    ];
    expect(validateSubscriptionData(invalidData)).toBe(false);
  });

  it('should reject corrupted JSON structure', () => {
    const corruptedData = [
      {
        id: 123, // should be string
        name: null, // should be string
        price: 'not a number',
        billingCycle: 'monthly',
        nextBillingDate: '2026-06-18',
        category: 'entertainment',
        note: '',
      },
    ];
    expect(validateSubscriptionData(corruptedData)).toBe(false);
  });

  it('should handle mixed valid and invalid items', () => {
    const mixedData = [
      {
        id: '1',
        name: 'Netflix',
        price: 68,
        billingCycle: 'monthly',
        nextBillingDate: '2026-06-18',
        category: 'entertainment',
        note: '',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
      {
        id: 2, // invalid type
        name: 'Spotify',
        price: 15,
        billingCycle: 'monthly',
        nextBillingDate: '2026-06-20',
        category: 'entertainment',
        note: '',
      },
    ];
    expect(validateSubscriptionData(mixedData)).toBe(false);
  });
});
