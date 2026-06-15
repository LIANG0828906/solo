import { v4 as uuidv4 } from 'uuid';
import { MenuItem, Booking, BookingStatus, PurchaseList, Ingredient } from '../../types';
import { menuItems, bookings } from '../data/memoryData';

export const getMenuItems = (): MenuItem[] => {
  return [...menuItems];
};

export const getMenuItemById = (id: string): MenuItem | undefined => {
  return menuItems.find((item) => item.id === id);
};

export const createMenuItem = (item: Omit<MenuItem, 'id' | 'remaining'>): MenuItem => {
  const newItem: MenuItem = {
    ...item,
    id: uuidv4(),
    remaining: item.dailyLimit,
  };
  menuItems.push(newItem);
  return newItem;
};

export const updateMenuItem = (id: string, updates: Partial<MenuItem>): MenuItem | null => {
  const index = menuItems.findIndex((item) => item.id === id);
  if (index === -1) return null;
  menuItems[index] = { ...menuItems[index], ...updates };
  return menuItems[index];
};

export const deleteMenuItem = (id: string): boolean => {
  const index = menuItems.findIndex((item) => item.id === id);
  if (index === -1) return false;
  menuItems.splice(index, 1);
  return true;
};

export const getBookings = (date?: string): Booking[] => {
  if (date) {
    return bookings.filter((b) => b.date === date);
  }
  return [...bookings];
};

export const getBookingById = (id: string): Booking | undefined => {
  return bookings.find((b) => b.id === id);
};

export const createBooking = (
  booking: Omit<Booking, 'id' | 'status' | 'createdAt'>
): Booking => {
  for (const item of booking.items) {
    const menuItem = getMenuItemById(item.menuItemId);
    if (!menuItem) {
      throw new Error(`菜品不存在: ${item.menuItemId}`);
    }
    if (menuItem.remaining < item.quantity) {
      throw new Error(`菜品「${menuItem.name}」余量不足`);
    }
  }

  for (const item of booking.items) {
    const menuItem = getMenuItemById(item.menuItemId);
    if (menuItem) {
      menuItem.remaining -= item.quantity;
    }
  }

  const newBooking: Booking = {
    ...booking,
    id: uuidv4(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  return newBooking;
};

export const updateBookingStatus = (id: string, status: BookingStatus): Booking | null => {
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;
  bookings[index].status = status;
  return bookings[index];
};

export const generatePurchaseList = (date: string): PurchaseList => {
  const confirmedBookings = bookings.filter(
    (b) => b.date === date && b.status === 'confirmed'
  );

  const ingredientMap = new Map<string, { name: string; totalQuantity: number; unit: string }>();
  let totalPortions = 0;

  for (const booking of confirmedBookings) {
    for (const bookingItem of booking.items) {
      const menuItem = getMenuItemById(bookingItem.menuItemId);
      if (menuItem) {
        totalPortions += bookingItem.quantity;
        for (const ingredient of menuItem.ingredients) {
          const key = `${ingredient.name}-${ingredient.unit}`;
          const existing = ingredientMap.get(key);
          if (existing) {
            existing.totalQuantity += ingredient.quantity * bookingItem.quantity;
          } else {
            ingredientMap.set(key, {
              name: ingredient.name,
              totalQuantity: ingredient.quantity * bookingItem.quantity,
              unit: ingredient.unit,
            });
          }
        }
      }
    }
  }

  return {
    date,
    items: Array.from(ingredientMap.values()),
    totalPortions,
  };
};
