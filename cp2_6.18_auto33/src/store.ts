import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Restaurant,
  MenuItem,
  OrderItem,
  GroupOrder,
  User,
  OrderCalculationResult,
} from './types';
import { calculateOrder } from './utils/orderCalc';

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9',
];

const USER_NAMES = ['小明', '小红', '小李', '小王', '小张', '小陈'];

function generateParticipants(count: number): User[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uuidv4(),
    name: USER_NAMES[i % USER_NAMES.length],
    avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
  }));
}

const mockRestaurants: Restaurant[] = [
  {
    id: 'r1',
    name: '川味小厨',
    menuItems: [
      { id: 'm1', name: '麻婆豆腐', originalPrice: 28, discount: 0.85, discountedPrice: 23.8, restaurantId: 'r1' },
      { id: 'm2', name: '宫保鸡丁', originalPrice: 38, discount: 0.88, discountedPrice: 33.4, restaurantId: 'r1' },
      { id: 'm3', name: '鱼香肉丝', originalPrice: 32, discount: 0.9, discountedPrice: 28.8, restaurantId: 'r1' },
      { id: 'm4', name: '回锅肉', originalPrice: 42, discount: 0.85, discountedPrice: 35.7, restaurantId: 'r1' },
    ],
  },
  {
    id: 'r2',
    name: '粤式茶餐厅',
    menuItems: [
      { id: 'm5', name: '蜜汁叉烧饭', originalPrice: 35, discount: 0.88, discountedPrice: 30.8, restaurantId: 'r2' },
      { id: 'm6', name: '虾饺皇', originalPrice: 28, discount: 0.9, discountedPrice: 25.2, restaurantId: 'r2' },
      { id: 'm7', name: '肠粉', originalPrice: 18, discount: 0.85, discountedPrice: 15.3, restaurantId: 'r2' },
      { id: 'm8', name: '烧鹅饭', originalPrice: 45, discount: 0.88, discountedPrice: 39.6, restaurantId: 'r2' },
    ],
  },
  {
    id: 'r3',
    name: '日式便当屋',
    menuItems: [
      { id: 'm9', name: '照烧鸡腿饭', originalPrice: 32, discount: 0.85, discountedPrice: 27.2, restaurantId: 'r3' },
      { id: 'm10', name: '三文鱼刺身', originalPrice: 48, discount: 0.9, discountedPrice: 43.2, restaurantId: 'r3' },
      { id: 'm11', name: '豚骨拉面', originalPrice: 28, discount: 0.88, discountedPrice: 24.6, restaurantId: 'r3' },
      { id: 'm12', name: '寿司拼盘', originalPrice: 42, discount: 0.85, discountedPrice: 35.7, restaurantId: 'r3' },
    ],
  },
  {
    id: 'r4',
    name: '西北面馆',
    menuItems: [
      { id: 'm13', name: '兰州拉面', originalPrice: 18, discount: 0.9, discountedPrice: 16.2, restaurantId: 'r4' },
      { id: 'm14', name: '肉夹馍', originalPrice: 12, discount: 0.85, discountedPrice: 10.2, restaurantId: 'r4' },
      { id: 'm15', name: '油泼面', originalPrice: 22, discount: 0.88, discountedPrice: 19.4, restaurantId: 'r4' },
      { id: 'm16', name: '牛肉泡馍', originalPrice: 35, discount: 0.85, discountedPrice: 29.8, restaurantId: 'r4' },
    ],
  },
  {
    id: 'r5',
    name: '轻食沙拉',
    menuItems: [
      { id: 'm17', name: '鸡胸肉沙拉', originalPrice: 28, discount: 0.88, discountedPrice: 24.6, restaurantId: 'r5' },
      { id: 'm18', name: '牛油果三明治', originalPrice: 32, discount: 0.9, discountedPrice: 28.8, restaurantId: 'r5' },
      { id: 'm19', name: '藜麦碗', originalPrice: 35, discount: 0.85, discountedPrice: 29.8, restaurantId: 'r5' },
      { id: 'm20', name: '鲜虾卷', originalPrice: 25, discount: 0.88, discountedPrice: 22.0, restaurantId: 'r5' },
    ],
  },
  {
    id: 'r6',
    name: '湘菜馆',
    menuItems: [
      { id: 'm21', name: '剁椒鱼头', originalPrice: 48, discount: 0.85, discountedPrice: 40.8, restaurantId: 'r6' },
      { id: 'm22', name: '小炒黄牛肉', originalPrice: 42, discount: 0.88, discountedPrice: 37.0, restaurantId: 'r6' },
      { id: 'm23', name: '口味虾', originalPrice: 45, discount: 0.9, discountedPrice: 40.5, restaurantId: 'r6' },
      { id: 'm24', name: '干锅肥肠', originalPrice: 38, discount: 0.85, discountedPrice: 32.3, restaurantId: 'r6' },
    ],
  },
];

interface LunchMateState {
  restaurants: Restaurant[];
  orderItems: OrderItem[];
  peopleCount: number;
  orderHistory: GroupOrder[];
  currentUser: User;
  calculationResult: OrderCalculationResult | null;
  expandedRestaurantId: string | null;
  addItemToOrder: (menuItem: MenuItem) => void;
  removeItemFromOrder: (orderId: string) => void;
  reorderItems: (sourceIndex: number, destIndex: number) => void;
  setPeopleCount: (count: number) => void;
  submitOrder: () => void;
  clearOrder: () => void;
  toggleRestaurant: (restaurantId: string) => void;
  recalculate: () => void;
}

export const useLunchMateStore = create<LunchMateState>((set, get) => ({
  restaurants: mockRestaurants,
  orderItems: [],
  peopleCount: 2,
  orderHistory: [],
  currentUser: {
    id: uuidv4(),
    name: '我',
    avatarColor: AVATAR_COLORS[0],
  },
  calculationResult: null,
  expandedRestaurantId: 'r1',

  addItemToOrder: (menuItem: MenuItem) => {
    const orderItem: OrderItem = {
      ...menuItem,
      orderId: uuidv4(),
    };
    set((state) => ({
      orderItems: [...state.orderItems, orderItem],
    }));
    get().recalculate();
  },

  removeItemFromOrder: (orderId: string) => {
    set((state) => ({
      orderItems: state.orderItems.filter((item) => item.orderId !== orderId),
    }));
    get().recalculate();
  },

  reorderItems: (sourceIndex: number, destIndex: number) => {
    set((state) => {
      const newItems = Array.from(state.orderItems);
      const [removed] = newItems.splice(sourceIndex, 1);
      newItems.splice(destIndex, 0, removed);
      return { orderItems: newItems };
    });
    get().recalculate();
  },

  setPeopleCount: (count: number) => {
    const validCount = Math.max(1, Math.min(6, count));
    set({ peopleCount: validCount });
    get().recalculate();
  },

  submitOrder: () => {
    const state = get();
    if (state.orderItems.length === 0) return;
    if (!state.calculationResult) return;

    const newOrder: GroupOrder = {
      id: uuidv4(),
      items: state.orderItems,
      peopleCount: state.peopleCount,
      totalPrice: state.calculationResult.totalPrice,
      discountAmount: state.calculationResult.discountAmount,
      finalPrice: state.calculationResult.finalPrice,
      perPersonPrice: state.calculationResult.perPersonPrice,
      createdAt: new Date(),
      participants: generateParticipants(state.peopleCount),
    };

    set((prevState) => ({
      orderHistory: [newOrder, ...prevState.orderHistory].slice(0, 10),
      orderItems: [],
    }));
    get().recalculate();
  },

  clearOrder: () => {
    set({ orderItems: [] });
    get().recalculate();
  },

  toggleRestaurant: (restaurantId: string) => {
    set((state) => ({
      expandedRestaurantId:
        state.expandedRestaurantId === restaurantId ? null : restaurantId,
    }));
  },

  recalculate: () => {
    const state = get();
    const result = calculateOrder(state.orderItems, state.peopleCount);
    set({ calculationResult: result });
  },
}));
