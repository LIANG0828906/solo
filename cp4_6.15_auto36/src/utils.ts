import { EXPIRE_DAYS } from './types';

export const getDaysLeft = (createdAt: number): number => {
  const now = Date.now();
  const expireTime = createdAt + EXPIRE_DAYS * 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((expireTime - now) / (24 * 60 * 60 * 1000));
  return Math.max(0, daysLeft);
};

export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return '30天前';
};

export const getConditionLabel = (condition: number): string => {
  if (condition >= 9) return '几乎全新';
  if (condition >= 7) return '成色很好';
  if (condition >= 5) return '正常使用';
  if (condition >= 3) return '有些旧了';
  return '较旧但能用';
};

export const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};
