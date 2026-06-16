import { v4 } from 'uuid';
import type { Item, HeatMapData, FilterParams, User, Area, ItemCategory } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(100 + Math.floor(Math.random() * 201));

const categories: ItemCategory[] = ['家具', '电器', '书籍', '服装', '其他'];
const areas: Area[] = ['东区', '西区', '南区', '北区'];

const sellerNames = ['李明', '张华', '王芳', '刘洋', '陈静', '杨帆', '赵磊', '黄丽', '周强', '吴敏', '徐涛', '孙燕'];
const itemNames = [
  '宜家三人沙发', '小米空气净化器', '《百年孤独》精装版', '优衣库羽绒服L码', '飞利浦电动牙刷',
  '实木餐桌椅套装', '华为路由器AX3', '《三体》全集套装', 'Nike运动鞋42码', '戴森吸尘器V8',
  '北欧风格茶几', '格力空调1.5匹', '《人类简史》平装版', 'Adidas运动外套XL', '九阳破壁机',
  '双人布艺床架', 'MacBook Pro 14寸', '《代码大全》第二版', 'Levis牛仔裤32码', '博世电钻套装',
  '可折叠办公椅', 'iPhone 14 Pro', '《设计模式》GoF', 'Uniqlo保暖内衣M码', '小熊电炖锅',
  '简约现代衣柜', '索尼WH-1000XM5', '《深入理解计算机系统》', '哥伦比亚冲锋衣L码', '小米扫地机器人'
];

const generateMockItems = (): Item[] => {
  const items: Item[] = [];
  for (let i = 0; i < 30; i++) {
    const sellerIdx = i % sellerNames.length;
    const category = categories[i % categories.length];
    const area = areas[i % areas.length];
    const prices = [299, 1299, 45, 399, 199, 1899, 249, 88, 599, 1899, 459, 2399, 68, 499, 699, 1599, 8999, 128, 299, 459, 289, 6299, 98, 149, 159, 2299, 1899, 168, 799, 1499];
    const distances = [0.5, 1.2, 2.8, 0.3, 1.8, 3.2, 0.9, 1.5, 2.1, 0.7, 1.3, 2.5, 0.4, 1.9, 3.0, 0.6, 1.1, 2.3, 0.8, 1.7, 2.9, 0.2, 1.4, 2.6, 0.9, 1.6, 2.2, 0.5, 1.0, 2.4];
    const registerDates = ['2024-03-15', '2024-07-22', '2023-11-08', '2025-01-30', '2024-05-12', '2024-09-18'];

    items.push({
      id: `item-${i + 1}`,
      name: itemNames[i],
      category,
      description: `${itemNames[i]}，九成新，品相良好，自提优先，同城可配送。有兴趣欢迎私信详聊~`,
      price: prices[i],
      images: [`https://picsum.photos/seed/item${i + 1}/400/300`],
      sellerId: `seller-${sellerIdx + 1}`,
      sellerName: sellerNames[sellerIdx],
      sellerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sellerNames[sellerIdx])}`,
      sellerRegisterDate: registerDates[sellerIdx % registerDates.length],
      distance: distances[i],
      area,
      createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString()
    });
  }
  return items;
};

const mockItems = generateMockItems();

export const fetchItems = async (filter?: FilterParams): Promise<Item[]> => {
  await randomDelay();
  let items = [...mockItems];
  if (filter) {
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase();
      items = items.filter(it => it.name.toLowerCase().includes(kw));
    }
    if (filter.category && filter.category !== '全部') {
      items = items.filter(it => it.category === filter.category);
    }
    if (typeof filter.minPrice === 'number') {
      items = items.filter(it => it.price >= filter.minPrice);
    }
    if (typeof filter.maxPrice === 'number') {
      items = items.filter(it => it.price <= filter.maxPrice);
    }
  }
  return items;
};

export const fetchHeatMapData = async (): Promise<HeatMapData[]> => {
  await randomDelay();
  const data: HeatMapData[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86400000);
    const dayStr = `${day.getMonth() + 1}/${day.getDate()}`;
    for (const area of areas) {
      data.push({
        day: dayStr,
        area,
        count: Math.floor(Math.random() * 51)
      });
    }
  }
  return data;
};

export const createItem = async (data: Omit<Item, 'id' | 'createdAt'>): Promise<Item> => {
  await randomDelay();
  const newItem: Item = {
    ...data,
    id: v4(),
    createdAt: new Date().toISOString()
  };
  mockItems.unshift(newItem);
  return newItem;
};

export const updateItem = async (id: string, data: Partial<Item>): Promise<Item> => {
  await randomDelay();
  const idx = mockItems.findIndex(it => it.id === id);
  const existing = idx >= 0 ? mockItems[idx] : {
    id,
    name: '',
    category: '其他' as ItemCategory,
    description: '',
    price: 0,
    images: [],
    sellerId: '',
    sellerName: '',
    sellerAvatar: '',
    sellerRegisterDate: '',
    distance: 0,
    area: '东区' as Area,
    createdAt: new Date().toISOString()
  };
  const merged = { ...existing, ...data, id };
  if (idx >= 0) {
    mockItems[idx] = merged;
  }
  return merged;
};

export const deleteItem = async (id: string): Promise<boolean> => {
  await randomDelay();
  const idx = mockItems.findIndex(it => it.id === id);
  if (idx >= 0) {
    mockItems.splice(idx, 1);
  }
  return true;
};

export const sendMessage = async (itemId: string, message: string): Promise<boolean> => {
  await randomDelay();
  console.log(`[Mock] 发送私信给 itemId=${itemId}, message=${message}`);
  return true;
};

export const fetchCurrentUser = async (): Promise<User> => {
  await randomDelay();
  return {
    id: 'user-1',
    name: '小王',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    registerDate: '2025-01-15'
  };
};
