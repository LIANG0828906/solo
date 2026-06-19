import { v4 as uuidv4 } from 'uuid';
import type { Product, Order, OrderStatus, DeliveryRoute } from '@/types';

const PRODUCT_TEMPLATES = [
  { name: '红富士苹果', price: 5.99, stock: 100, dailyLimit: 50 },
  { name: '有机西红柿', price: 4.5, stock: 80, dailyLimit: 40 },
  { name: '新鲜黄瓜', price: 3.2, stock: 120, dailyLimit: 60 },
  { name: '土鸡蛋(30枚)', price: 29.9, stock: 50, dailyLimit: 25 },
  { name: '纯牛奶(250ml*12)', price: 39.9, stock: 60, dailyLimit: 30 },
  { name: '金龙鱼花生油5L', price: 89.9, stock: 30, dailyLimit: 15 },
  { name: '东北大米10kg', price: 59.9, stock: 40, dailyLimit: 20 },
  { name: '新鲜草莓', price: 25.9, stock: 40, dailyLimit: 20 },
  { name: '香蕉', price: 6.99, stock: 100, dailyLimit: 50 },
  { name: '卫生纸10卷装', price: 24.9, stock: 70, dailyLimit: 35 },
];

const USER_NAMES = [
  '张阿姨', '李叔叔', '王大姐', '刘奶奶', '陈大哥',
  '周女士', '吴先生', '郑阿姨', '孙大姐', '赵叔叔',
  '黄妈妈', '周爸爸', '林阿姨', '何先生', '罗女士',
  '梁叔叔', '宋大姐', '唐阿姨', '许先生', '韩女士',
];

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

export function generateMockProducts(): Product[] {
  return PRODUCT_TEMPLATES.map((template) => ({
    id: uuidv4(),
    ...template,
    sold: Math.floor(Math.random() * (template.dailyLimit * 0.5)),
    createdAt: new Date().toISOString(),
  }));
}

function generateOrderItems(products: Product[]): Order['items'] {
  const itemCount = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, itemCount).map((product) => ({
    productId: product.id,
    productName: product.name,
    quantity: Math.floor(Math.random() * 3) + 1,
    price: product.price,
  }));
}

function generateDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 12) + 8);
  date.setMinutes(Math.floor(Math.random() * 60));
  return date.toISOString();
}

function generateStatus(_index: number): OrderStatus {
  const statuses: OrderStatus[] = ['pending', 'confirmed', 'delivering', 'delivered', 'completed'];
  const weights = [0.15, 0.2, 0.25, 0.25, 0.15];
  let random = Math.random();
  let sum = 0;
  for (let i = 0; i < statuses.length; i++) {
    sum += weights[i];
    if (random <= sum) return statuses[i];
  }
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function generateDeliveryPath(): { x: number; y: number }[] {
  const startX = 50 + Math.random() * 10 - 5;
  const startY = 50 + Math.random() * 10 - 5;
  const points: { x: number; y: number }[] = [];
  const segments = 8;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = startX + (Math.random() - 0.5) * 30 * t;
    const y = startY + (Math.random() - 0.5) * 30 * t;
    points.push({ x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) });
  }
  return points;
}

export function generateMockOrders(products: Product[]): Order[] {
  const orders: Order[] = [];
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const items = generateOrderItems(products);
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const status = daysAgo === 0 ? generateStatus(i) : 'completed';
    const createdAt = generateDate(daysAgo);
    orders.push({
      id: uuidv4(),
      userName: USER_NAMES[i % USER_NAMES.length],
      userAvatar: AVATAR_COLORS[i % AVATAR_COLORS.length],
      items,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status,
      createdAt,
      updatedAt: createdAt,
      deliveryLocation: { x: 50, y: 50 },
    });
  }
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateMockDeliveryRoutes(orders: Order[]): DeliveryRoute[] {
  return orders
    .filter((order) => order.status === 'delivering' || order.status === 'delivered')
    .map((order) => ({
      orderId: order.id,
      path: generateDeliveryPath(),
      currentIndex: order.status === 'delivered' ? 8 : Math.floor(Math.random() * 4),
      progress: order.status === 'delivered' ? 1 : Math.random() * 0.5,
    }));
}

export function generateAllMockData() {
  const products = generateMockProducts();
  const orders = generateMockOrders(products);
  const deliveryRoutes = generateMockDeliveryRoutes(orders);
  return { products, orders, deliveryRoutes };
}
