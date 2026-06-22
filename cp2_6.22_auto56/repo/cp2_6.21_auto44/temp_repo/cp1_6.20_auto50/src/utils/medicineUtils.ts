import { differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { Medicine } from '../types';

export const EXPIRING_SOON_DAYS = 30;
export const LOW_STOCK_THRESHOLD = 10;
export const MAX_STOCK_VISUAL = 100;

export type ExpiryStatus = 'normal' | 'expiringSoon' | 'expired';

export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (isBefore(expiry, today)) {
    return 'expired';
  }

  const daysLeft = differenceInDays(expiry, today);
  if (daysLeft <= EXPIRING_SOON_DAYS) {
    return 'expiringSoon';
  }

  return 'normal';
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return differenceInDays(expiry, today);
}

export function getExpiryText(expiryDate: string): string {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) {
    return `已过期 ${Math.abs(days)} 天`;
  }
  if (days === 0) {
    return '今天过期';
  }
  return `剩余 ${days} 天`;
}

export function getStockPercentage(quantity: number): number {
  return Math.min((quantity / MAX_STOCK_VISUAL) * 100, 100);
}

export function isLowStock(quantity: number): boolean {
  return quantity < LOW_STOCK_THRESHOLD;
}

export function filterMedicines(
  medicines: Medicine[],
  filter: 'all' | 'expiringSoon' | 'lowStock' | 'expired'
): Medicine[] {
  switch (filter) {
    case 'expiringSoon':
      return medicines.filter(m => getExpiryStatus(m.expiryDate) === 'expiringSoon');
    case 'lowStock':
      return medicines.filter(m => isLowStock(m.quantity));
    case 'expired':
      return medicines.filter(m => getExpiryStatus(m.expiryDate) === 'expired');
    default:
      return medicines;
  }
}

export function sortMedicines(
  medicines: Medicine[],
  sortBy: 'name' | 'quantityAsc' | 'quantityDesc' | 'expiry'
): Medicine[] {
  const sorted = [...medicines];
  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
      break;
    case 'quantityAsc':
      sorted.sort((a, b) => a.quantity - b.quantity);
      break;
    case 'quantityDesc':
      sorted.sort((a, b) => b.quantity - a.quantity);
      break;
    case 'expiry':
      sorted.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      break;
  }
  return sorted;
}

export function getStats(medicines: Medicine[]) {
  const total = medicines.length;
  const expiringSoon = medicines.filter(m => getExpiryStatus(m.expiryDate) === 'expiringSoon').length;
  const lowStock = medicines.filter(m => isLowStock(m.quantity)).length;
  const expired = medicines.filter(m => getExpiryStatus(m.expiryDate) === 'expired').length;
  return { total, expiringSoon, lowStock, expired };
}
