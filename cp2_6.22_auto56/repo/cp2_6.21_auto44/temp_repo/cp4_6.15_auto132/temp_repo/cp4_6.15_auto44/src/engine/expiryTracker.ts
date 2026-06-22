import type { Category } from '../types';

export function getDaysRemaining(expiryDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(daysRemaining: number): boolean {
  return daysRemaining <= 3;
}

export function isCritical(daysRemaining: number): boolean {
  return daysRemaining < 1;
}

const categoryTips: Record<Category, string[]> = {
  '蔬菜': ['快过期的蔬菜可以做成蔬菜浓汤', '蔫了的蔬菜适合炒菜或炖煮', '蔬菜叶可以做蔬菜饼'],
  '水果': ['快过期的香蕉可以做香蕉松饼', '软了的水果适合打成果汁或奶昔', '水果可以做成果酱'],
  '肉类': ['快过期的肉类建议立即烹饪后冷冻保存', '肉类可以卤制延长保存时间', '剩余肉类可做成肉馅'],
  '蛋奶': ['快过期的鸡蛋可以做成水煮蛋或茶叶蛋', '牛奶快过期可以做成酸奶或布丁', '奶酪可以冷冻保存'],
  '调料': ['调料保质期较长，注意密封保存', '开封后的酱料需冷藏', '干燥调料避免受潮'],
  '其他': ['注意检查保质期', '尽快使用即将过期的食材', '合理规划食材使用顺序'],
};

export function getExpiryTip(ingredientName: string, category: Category): string {
  const tips = categoryTips[category];
  const index = ingredientName.length % tips.length;
  return tips[index];
}
