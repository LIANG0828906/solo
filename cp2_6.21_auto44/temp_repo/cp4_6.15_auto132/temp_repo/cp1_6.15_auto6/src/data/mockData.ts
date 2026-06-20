import { v4 as uuidv4 } from 'uuid';

export interface DiscountRule {
  id: string;
  condition: number;
  discount: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

export interface Activity {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  discountType: 'full_reduction' | 'percentage' | 'buy_gift';
  rules: DiscountRule[];
  products: Product[];
  buyGiftProduct?: Product | null;
  status: 'pending' | 'ongoing' | 'ended' | 'paused';
  stats: {
    participants: number;
    orders: number;
    totalDiscount: number;
    revenue: number;
    profit: number;
    roi: number;
  };
  funnelData?: {
    views: number;
    coupons: number;
    orders: number;
    payments: number;
  };
  productSales?: { productId: string; productName: string; quantity: number; revenue: number }[];
}

export interface SalesHistory {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
  profit: number;
}

export const mockProducts: Product[] = [
  { id: 'p1', name: '无线蓝牙耳机 Pro', price: 299, category: '数码', image: '🎧' },
  { id: 'p2', name: '智能手表 Series 5', price: 1299, category: '数码', image: '⌚' },
  { id: 'p3', name: '便携式充电宝 20000mAh', price: 159, category: '数码', image: '🔋' },
  { id: 'p4', name: '男士休闲运动鞋', price: 399, category: '服饰', image: '👟' },
  { id: 'p5', name: '女士夏季连衣裙', price: 259, category: '服饰', image: '👗' },
  { id: 'p6', name: '纯棉T恤 三件装', price: 129, category: '服饰', image: '👕' },
  { id: 'p7', name: '进口坚果礼盒 1kg', price: 188, category: '食品', image: '🥜' },
  { id: 'p8', name: '精品咖啡豆 500g', price: 98, category: '食品', image: '☕' },
  { id: 'p9', name: '有机绿茶礼盒', price: 268, category: '食品', image: '🍵' },
  { id: 'p10', name: '护肤精华套装', price: 599, category: '美妆', image: '💄' },
  { id: 'p11', name: '防晒霜 SPF50+', price: 158, category: '美妆', image: '🧴' },
  { id: 'p12', name: '北欧风台灯', price: 189, category: '家居', image: '💡' },
  { id: 'p13', name: '记忆棉枕头', price: 239, category: '家居', image: '🛏️' },
  { id: 'p14', name: '瑜伽垫 加厚款', price: 128, category: '运动', image: '🧘' },
  { id: 'p15', name: '儿童积木玩具套装', price: 329, category: '母婴', image: '🧸' },
  { id: 'p16', name: '机械键盘 青轴', price: 459, category: '数码', image: '⌨️' },
  { id: 'p17', name: '人体工学办公椅', price: 899, category: '家居', image: '🪑' },
  { id: 'p18', name: '空气炸锅 5L', price: 399, category: '家电', image: '🍳' },
];

export const generateSalesHistory = (days: number = 30): SalesHistory[] => {
  const history: SalesHistory[] = [];
  const today = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const baseSales = 150 + Math.sin(i / 7) * 30;
    const variance = Math.random() * 50;
    const sales = Math.round(baseSales + variance);
    const avgOrderValue = 280 + Math.random() * 80;
    const revenue = Math.round(sales * avgOrderValue);
    const profit = Math.round(revenue * (0.25 + Math.random() * 0.1));
    history.push({
      date: date.toISOString().split('T')[0],
      sales,
      orders: sales,
      revenue,
      profit,
    });
  }
  return history;
};

export const generateMockActivities = (): Activity[] => {
  const now = new Date();
  const activities: Activity[] = [];

  const createActivity = (
    name: string,
    startOffset: number,
    endOffset: number,
    discountType: Activity['discountType'],
    rules: DiscountRule[],
    products: Product[],
    baseStats: Partial<Activity['stats']> = {}
  ): Activity => {
    const start = new Date(now);
    start.setDate(start.getDate() + startOffset);
    const end = new Date(now);
    end.setDate(end.getDate() + endOffset);

    let status: Activity['status'];
    if (start > now) status = 'pending';
    else if (end < now) status = 'ended';
    else status = 'ongoing';

    const participants = baseStats.participants ?? Math.floor(Math.random() * 3000) + 500;
    const orders = baseStats.orders ?? Math.floor(participants * (0.3 + Math.random() * 0.3));
    const totalDiscount = baseStats.totalDiscount ?? orders * (20 + Math.random() * 60);
    const revenue = baseStats.revenue ?? orders * (200 + Math.random() * 300);
    const profit = Math.round(revenue * 0.28);
    const investment = totalDiscount + 500;
    const roi = investment > 0 ? Math.round((profit / investment) * 100) / 100 : 0;

    const views = participants * (3 + Math.random() * 2);
    const coupons = Math.floor(participants * (0.6 + Math.random() * 0.2));
    const payments = Math.floor(orders * (0.85 + Math.random() * 0.1));

    const productSales = products.slice(0, 5).map((p, idx) => ({
      productId: p.id,
      productName: p.name,
      quantity: Math.floor(orders * (0.4 - idx * 0.06)) + 10,
      revenue: Math.floor(orders * (0.4 - idx * 0.06) * p.price),
    }));

    return {
      id: uuidv4(),
      name,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      discountType,
      rules,
      products,
      status,
      stats: { participants, orders, totalDiscount, revenue, profit, roi },
      funnelData: { views: Math.round(views), coupons, orders, payments },
      productSales,
    };
  };

  activities.push(
    createActivity(
      '618年中大促·数码专场',
      -10,
      3,
      'full_reduction',
      [
        { id: uuidv4(), condition: 200, discount: 30 },
        { id: uuidv4(), condition: 500, discount: 80 },
        { id: uuidv4(), condition: 1000, discount: 180 },
      ],
      [mockProducts[0], mockProducts[1], mockProducts[2], mockProducts[15]],
      { participants: 4280, orders: 1856, totalDiscount: 78500, revenue: 628000 }
    ),
    createActivity(
      '夏季清仓·服饰特惠',
      -5,
      7,
      'percentage',
      [
        { id: uuidv4(), condition: 1, discount: 15 },
        { id: uuidv4(), condition: 3, discount: 25 },
        { id: uuidv4(), condition: 5, discount: 35 },
      ],
      [mockProducts[3], mockProducts[4], mockProducts[5]],
      { participants: 2560, orders: 980, totalDiscount: 42000, revenue: 298000 }
    ),
    createActivity(
      '美食狂欢节·满减优惠',
      -2,
      12,
      'full_reduction',
      [
        { id: uuidv4(), condition: 99, discount: 15 },
        { id: uuidv4(), condition: 199, discount: 40 },
        { id: uuidv4(), condition: 399, discount: 100 },
      ],
      [mockProducts[6], mockProducts[7], mockProducts[8]],
      { participants: 1890, orders: 720, totalDiscount: 28500, revenue: 185000 }
    )
  );

  activities.push(
    createActivity(
      '开学季·数码装备升级',
      3,
      18,
      'percentage',
      [
        { id: uuidv4(), condition: 1, discount: 10 },
        { id: uuidv4(), condition: 2, discount: 18 },
        { id: uuidv4(), condition: 4, discount: 28 },
      ],
      [mockProducts[0], mockProducts[2], mockProducts[15]],
      {}
    ),
    createActivity(
      '中秋礼盒·买二送一',
      5,
      20,
      'buy_gift',
      [
        { id: uuidv4(), condition: 2, discount: 1 },
      ],
      [mockProducts[6], mockProducts[8]],
      {}
    ),
    createActivity(
      '秋季上新·美妆护肤节',
      8,
      25,
      'full_reduction',
      [
        { id: uuidv4(), condition: 299, discount: 50 },
        { id: uuidv4(), condition: 599, discount: 120 },
        { id: uuidv4(), condition: 999, discount: 250 },
      ],
      [mockProducts[9], mockProducts[10]],
      {}
    ),
    createActivity(
      '家居焕新季',
      12,
      30,
      'percentage',
      [
        { id: uuidv4(), condition: 1, discount: 12 },
        { id: uuidv4(), condition: 3, discount: 22 },
      ],
      [mockProducts[11], mockProducts[12], mockProducts[16], mockProducts[17]],
      {}
    )
  );

  activities.push(
    createActivity(
      '五一劳动节大促',
      -50,
      -40,
      'full_reduction',
      [
        { id: uuidv4(), condition: 199, discount: 30 },
        { id: uuidv4(), condition: 399, discount: 70 },
        { id: uuidv4(), condition: 799, discount: 160 },
      ],
      [mockProducts[0], mockProducts[3], mockProducts[6], mockProducts[9]],
      { participants: 5680, orders: 2420, totalDiscount: 96800, revenue: 828000 }
    ),
    createActivity(
      '母亲节感恩回馈',
      -35,
      -28,
      'percentage',
      [
        { id: uuidv4(), condition: 1, discount: 20 },
        { id: uuidv4(), condition: 2, discount: 30 },
      ],
      [mockProducts[9], mockProducts[10], mockProducts[12]],
      { participants: 3120, orders: 1280, totalDiscount: 52000, revenue: 412000 }
    ),
    createActivity(
      '618预热场',
      -20,
      -12,
      'buy_gift',
      [
        { id: uuidv4(), condition: 3, discount: 1 },
      ],
      [mockProducts[6], mockProducts[7]],
      { participants: 2450, orders: 960, totalDiscount: 38500, revenue: 318000 }
    )
  );

  for (let i = 0; i < 10; i++) {
    const offsetBase = -80 + i * 8;
    const types: Activity['discountType'][] = ['full_reduction', 'percentage', 'buy_gift'];
    const type = types[i % 3];
    const productSlice = mockProducts.slice(i % 6, (i % 6) + 3);
    activities.push(
      createActivity(
        `促销活动 #${i + 1}`,
        offsetBase,
        offsetBase + 5,
        type,
        type === 'full_reduction'
          ? [
              { id: uuidv4(), condition: 100 + i * 20, discount: 15 + i * 3 },
              { id: uuidv4(), condition: 300 + i * 30, discount: 45 + i * 5 },
            ]
          : type === 'percentage'
          ? [
              { id: uuidv4(), condition: 1, discount: 10 + i * 2 },
              { id: uuidv4(), condition: 3, discount: 18 + i * 2 },
            ]
          : [{ id: uuidv4(), condition: 2 + (i % 2), discount: 1 }],
        productSlice,
        {
          participants: Math.floor(800 + Math.random() * 2500),
          orders: Math.floor(300 + Math.random() * 1200),
          totalDiscount: Math.floor(15000 + Math.random() * 60000),
          revenue: Math.floor(120000 + Math.random() * 500000),
        }
      )
    );
  }

  return activities;
};

export const salesHistory = generateSalesHistory(60);
export const mockActivities = generateMockActivities();
