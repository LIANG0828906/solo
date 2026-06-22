export enum OrderStatus {
  PLACED = '已下单',
  PREPARING = '制作中',
  READY = '已完成',
  PICKED_UP = '已取餐'
}

export type StockStatus = '充足' | '紧张' | '售罄';

export interface Stall {
  id: string;
  name: string;
  cuisine: string;
  cuisineColor: string;
  waitTime: number;
  position: { x: number; y: number };
  description: string;
  emoji: string;
}

export interface MenuItem {
  id: string;
  stallId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  stock: number;
  stockStatus: StockStatus;
}

export interface CartItem {
  menuItemId: string;
  stallId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  stallId: string;
  items: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: number;
}

export interface AppState {
  cart: CartItem[];
  orders: Order[];
  menuItems: MenuItem[];
}

export type AppAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { menuItemId: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'PLACE_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: OrderStatus } }
  | { type: 'UPDATE_STOCK'; payload: { menuItemId: string; stock: number } };
