import type { Book, Order, Promotion, OrderStatus, DashboardStats } from './types';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${formatDate(timestamp)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export const isOrderOverdue = (order: Order): boolean => {
  if (order.status !== '待支付') return false;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return order.createdAt < sevenDaysAgo;
};

export const getOrderProgress = (status: OrderStatus): number => {
  const progressMap: Record<OrderStatus, number> = {
    '待支付': 0,
    '已支付': 33,
    '已发货': 66,
    '已完成': 100,
    '已取消': 0
  };
  return progressMap[status];
};

export const getNextOrderStatus = (status: OrderStatus): OrderStatus | null => {
  const nextMap: Partial<Record<OrderStatus, OrderStatus>> = {
    '待支付': '已支付',
    '已支付': '已发货',
    '已发货': '已完成'
  };
  return nextMap[status] || null;
};

export interface ValidatePromoResult {
  valid: boolean;
  discountAmount: number;
  message: string;
}

export const validatePromoCode = (
  code: string,
  totalAmount: number,
  promotions: Promotion[]
): ValidatePromoResult => {
  const promo = promotions.find(p => p.code === code);
  if (!promo) {
    return { valid: false, discountAmount: 0, message: '折扣码不存在' };
  }
  if (promo.expiresAt < Date.now()) {
    return { valid: false, discountAmount: 0, message: '折扣码已过期' };
  }
  if (promo.usedCount >= promo.maxUsage) {
    return { valid: false, discountAmount: 0, message: '折扣码已用完' };
  }
  if (totalAmount < promo.minAmount) {
    return { valid: false, discountAmount: 0, message: `订单金额需满${formatCurrency(promo.minAmount)}才能使用` };
  }
  return {
    valid: true,
    discountAmount: promo.discountAmount,
    message: `折扣码应用成功，立减${formatCurrency(promo.discountAmount)}`
  };
};

export const calculateDashboardStats = (books: Book[], orders: Order[]): DashboardStats => {
  const completedOrders = orders.filter(o => o.status === '已完成');
  const totalSales = completedOrders.reduce((sum, o) => sum + o.finalAmount, 0);
  const totalOrders = orders.length;
  const totalInventoryValue = books.reduce((sum, b) => sum + b.price * b.stock, 0);

  const salesLast7Days: { date: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const daySales = completedOrders
      .filter(o => o.createdAt >= date.getTime() && o.createdAt < nextDate.getTime())
      .reduce((sum, o) => sum + o.finalAmount, 0);

    salesLast7Days.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      amount: daySales
    });
  }

  return { totalSales, totalOrders, totalInventoryValue, salesLast7Days };
};

export const getRandomCoverColor = (): string => {
  const colors = [
    '#6B8CC4', '#8BA888', '#D4A574', '#C4906B',
    '#8C6BC4', '#6BC4A8', '#C46B8B', '#A8C46B'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const STORAGE_KEYS = {
  books: 'bookstore_books',
  orders: 'bookstore_orders',
  promotions: 'bookstore_promotions'
};

export const loadFromStorage = <T>(key: keyof typeof STORAGE_KEYS, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS[key]);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: keyof typeof STORAGE_KEYS, value: T): void => {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
  } catch {
    console.error('Failed to save to localStorage');
  }
};

export const generateMockBooks = (): Book[] => {
  const books: Book[] = [
    { id: generateId(), title: '百年孤独', author: '加西亚·马尔克斯', isbn: '9787544253994', price: 55.00, stock: 12, category: '文学', coverColor: '#6B8CC4', createdAt: Date.now() - 86400000 * 30 },
    { id: generateId(), title: '活着', author: '余华', isbn: '9787506365437', price: 35.00, stock: 25, category: '文学', coverColor: '#8BA888', createdAt: Date.now() - 86400000 * 25 },
    { id: generateId(), title: 'JavaScript高级程序设计', author: 'Nicholas C. Zakas', isbn: '9787115545381', price: 129.00, stock: 8, category: '科技', coverColor: '#D4A574', createdAt: Date.now() - 86400000 * 20 },
    { id: generateId(), title: '人类简史', author: '尤瓦尔·赫拉利', isbn: '9787508647357', price: 68.00, stock: 15, category: '科技', coverColor: '#C4906B', createdAt: Date.now() - 86400000 * 15 },
    { id: generateId(), title: '家常菜大全', author: '美食生活工作室', isbn: '9787543678912', price: 39.90, stock: 20, category: '生活', coverColor: '#8C6BC4', createdAt: Date.now() - 86400000 * 10 },
    { id: generateId(), title: '高等数学', author: '同济大学数学系', isbn: '9787040396638', price: 45.00, stock: 30, category: '教育', coverColor: '#6BC4A8', createdAt: Date.now() - 86400000 * 5 },
    { id: generateId(), title: '三体', author: '刘慈欣', isbn: '9787536692930', price: 48.00, stock: 18, category: '文学', coverColor: '#C46B8B', createdAt: Date.now() - 86400000 * 3 },
    { id: generateId(), title: 'Python编程从入门到实践', author: 'Eric Matthes', isbn: '9787115428028', price: 89.00, stock: 10, category: '科技', coverColor: '#A8C46B', createdAt: Date.now() - 86400000 * 2 },
  ];
  return books;
};

export const generateMockOrders = (books: Book[]): Order[] => {
  const statuses: OrderStatus[] = ['待支付', '已支付', '已发货', '已完成', '已取消'];
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
  const orders: Order[] = [];

  for (let i = 0; i < 15; i++) {
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let totalAmount = 0;

    for (let j = 0; j < numItems; j++) {
      const book = books[Math.floor(Math.random() * books.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      items.push({
        bookId: book.id,
        bookTitle: book.title,
        price: book.price,
        quantity
      });
      totalAmount += book.price * quantity;
    }

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const daysAgo = Math.floor(Math.random() * 15);
    const createdAt = Date.now() - daysAgo * 24 * 60 * 60 * 1000;

    orders.push({
      id: generateId(),
      customerName: names[Math.floor(Math.random() * names.length)],
      items,
      totalAmount,
      discountAmount: 0,
      finalAmount: totalAmount,
      status,
      createdAt
    });
  }

  return orders;
};

export const generateMockPromotions = (): Promotion[] => {
  return [
    {
      id: generateId(),
      code: 'NEW5',
      minAmount: 50,
      discountAmount: 5,
      maxUsage: 100,
      usedCount: 23,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000
    },
    {
      id: generateId(),
      code: 'SUMMER20',
      minAmount: 200,
      discountAmount: 20,
      maxUsage: 50,
      usedCount: 15,
      expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000
    }
  ];
};
