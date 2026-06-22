import { Item, Category } from '@/api';
import { differenceInHours, differenceInDays, parseISO } from 'date-fns';

export const CATEGORY_EMOJI: Record<Category, string> = {
  蔬菜: '🥬',
  水果: '🍎',
  肉类: '🥩',
  乳制品: '🥛',
  调料: '🧂',
};

export type StatusType = 'healthy' | 'warning' | 'expired';

export const getItemStatus = (item: Item): StatusType => {
  const remainingHours = getRemainingHours(item);
  if (remainingHours < 0) return 'expired';
  if (remainingHours <= 72) return 'warning';
  return 'healthy';
};

export const getRemainingHours = (item: Item): number => {
  const purchase = parseISO(item.purchaseDate);
  const expiry = new Date(purchase);
  expiry.setDate(expiry.getDate() + item.shelfLifeDays);
  return differenceInHours(expiry, new Date());
};

export const getRemainingDays = (item: Item): number => {
  const purchase = parseISO(item.purchaseDate);
  const expiry = new Date(purchase);
  expiry.setDate(expiry.getDate() + item.shelfLifeDays);
  return Math.ceil(differenceInHours(expiry, new Date()) / 24);
};

export const formatDate = (dateStr: string): string => {
  const date = parseISO(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const getExpiryDate = (item: Item): Date => {
  const purchase = parseISO(item.purchaseDate);
  const expiry = new Date(purchase);
  expiry.setDate(expiry.getDate() + item.shelfLifeDays);
  return expiry;
};
