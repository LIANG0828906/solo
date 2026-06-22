export type DishCategory = 'cold' | 'hot' | 'staple' | 'drink';

export const CATEGORY_LABELS: Record<DishCategory, string> = {
  cold: '凉菜',
  hot: '热菜',
  staple: '主食',
  drink: '饮品',
};

export interface Dish {
  id: string;
  name: string;
  price: number;
  category: DishCategory;
  spiciness: 1 | 2 | 3;
  rating: 1 | 2 | 3 | 4 | 5;
  emoji: string;
}

export interface Member {
  id: string;
  name: string;
  selectedDishIds: string[];
}

export interface Group {
  id: string;
  createdAt: number;
  members: Member[];
  maxMembers: 6;
}

export interface MergedDish {
  dish: Dish;
  count: number;
  memberIds: string[];
}

export interface DiscountRule {
  threshold: number;
  discount: number;
}

export interface SplitResult {
  memberId: string;
  memberName: string;
  amount: number;
}

export interface CheckoutResult {
  originalTotal: number;
  discountApplied: number;
  finalTotal: number;
  splits: SplitResult[];
}
