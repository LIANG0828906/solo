import { Smartphone, Wallet, IdCard, BookOpen, Coffee, Package } from 'lucide-react';
import type { Category } from '@/types';
import { CATEGORY_COLORS } from '@/types';

interface CategoryIconProps {
  category: Category;
  size?: number;
}

const iconMap: Record<Category, typeof Smartphone> = {
  '手机': Smartphone,
  '钱包': Wallet,
  '校园卡': IdCard,
  '书籍': BookOpen,
  '水杯': Coffee,
  '其他': Package,
};

export default function CategoryIcon({ category, size = 20 }: CategoryIconProps) {
  const Icon = iconMap[category];
  const color = CATEGORY_COLORS[category];

  return <Icon size={size} color={color} />;
}
