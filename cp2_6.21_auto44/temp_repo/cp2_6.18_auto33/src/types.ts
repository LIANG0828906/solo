export interface MenuItem {
  id: string;
  name: string;
  originalPrice: number;
  discount: number;
  discountedPrice: number;
  restaurantId: string;
}

export interface Restaurant {
  id: string;
  name: string;
  menuItems: MenuItem[];
}

export interface OrderItem extends MenuItem {
  orderId: string;
}

export interface User {
  id: string;
  name: string;
  avatarColor: string;
}

export interface GroupOrder {
  id: string;
  items: OrderItem[];
  peopleCount: number;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  perPersonPrice: number;
  createdAt: Date;
  participants: User[];
}

export interface DiscountTier {
  threshold: number;
  discount: number;
}

export interface OrderCalculationResult {
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  perPersonPrice: number;
  currentTier: DiscountTier | null;
  nextTier: DiscountTier | null;
  progressToNextTier: number;
  amountToNextTier: number;
}
