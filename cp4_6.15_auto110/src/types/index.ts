export type MenuCategory = 'appetizer' | 'main' | 'dessert' | 'drink';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: MenuCategory;
  optionalToppings: string[];
  dailyLimit: number;
  remaining: number;
  ingredients: Ingredient[];
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed';

export interface BookingItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  selectedToppings: string[];
}

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  timeSlot: string;
  guestCount: number;
  items: BookingItem[];
  status: BookingStatus;
  createdAt: string;
}

export interface PurchaseItem {
  name: string;
  totalQuantity: number;
  unit: string;
}

export interface PurchaseList {
  date: string;
  items: PurchaseItem[];
  totalPortions: number;
}
