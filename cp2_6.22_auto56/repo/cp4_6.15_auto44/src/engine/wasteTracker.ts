import type { WasteRecord, Category } from '../types';

export interface MonthlyStats {
  consumed: { count: number; quantity: number };
  wasted: { count: number; quantity: number };
}

export function getMonthlyStats(records: WasteRecord[]): MonthlyStats {
  const consumed = records.filter((r) => r.type === 'consumed');
  const wasted = records.filter((r) => r.type === 'wasted');
  return {
    consumed: {
      count: consumed.length,
      quantity: consumed.reduce((sum, r) => sum + r.quantity, 0),
    },
    wasted: {
      count: wasted.length,
      quantity: wasted.reduce((sum, r) => sum + r.quantity, 0),
    },
  };
}

export function filterByCategory(records: WasteRecord[], category?: Category): WasteRecord[] {
  if (!category) return records;
  return records.filter((r) => r.category === category);
}

export function filterByMonth(records: WasteRecord[], year: number, month: number): WasteRecord[] {
  return records.filter((r) => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}
