import { v4 as uuidv4 } from 'uuid';
import type { Item, User, Message, Conversation } from '../types';

const categories = ['书籍', '电子', '家居', '服饰', '运动', '其他'] as const;
const statuses: Array<'available' | 'reserved' | 'exchanged'> = ['available', 'available', 'available', 'reserved', 'exchanged'];

const itemNames = [
  '《深入理解计算机系统', '无线蓝牙耳机', '实木床头柜', '纯棉T恤', '瑜伽垫',
  '旧相机', '咖啡壶', '登山包', '电子阅读器', '台灯',
  '羽毛球拍', '牛仔裤', '加湿器', '充电宝', '故事书套装',
  '机械键盘', '收纳盒', '运动鞋', '热水壶', '滑板',
  '《JavaScript高级程序设计', '智能手表', '书桌', '连衣裙', '哑铃套装',
];

const descriptions = [
  '九成新，闲置转让，希望能找到有缘人。',
  '用了半年，功能完好，成色不错。',
  '搬家处理，价格可议，自提优先。',
  '买了没怎么用，几乎全新，配件齐全。',
  '闲置物品，占地方，便宜出了。',
];

const userNames = [
  '小明', '小红', '阿杰', '小美', '大伟',
  '晓燕', '阿强', '小雨', '小刚', '丽丽',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMockItems(count: number): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    const name = itemNames[i % itemNames.length];
    const category = categories[i % categories.length];
    const status = i < 15 ? statuses[i % statuses.length] : 'available';
    items.push({
      id: uuidv4(),
      name,
      category,
      weight: Number((Math.random() * 5 + 0.5).toFixed(1)),
      description: randomChoice(descriptions),
      imageUrl: `https://picsum.photos/seed/item${i}/400/300`,
      distance: Number((Math.random() * 5 + 0.1).toFixed(1)),
      status,
      publisherId: `user-${i % 10}`,
      publisherName: userNames[i % userNames.length],
      publishTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }
  return items.sort((a, b) => b.publishTime.getTime() - a.publishTime.getTime());
}

export function generateMockUsers(): User[] {
  const users: User[] = [];
  for (let i = 0; i < 10; i++) {
    const basePoints = randomInt(50, 500);
    const pointsHistory: number[] = [];
    let current = 0;
    for (let j = 0; j < 12; j++) {
      current += randomInt(5, 40);
      pointsHistory.push(current);
    }
    const scaledHistory = pointsHistory.map(p => Math.round((p / current) * basePoints));
    users.push({
      id: `user-${i}`,
      name: userNames[i],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      carbonPoints: i === 0 ? 320 : basePoints,
      exchangeCount: randomInt(5, 30),
      totalReduction: Number((basePoints * 0.8).toFixed(1)),
      monthlyExchangeCount: randomInt(1, 8),
      pointsHistory: scaledHistory,
    });
  }
  return users.sort((a, b) => b.carbonPoints - a.carbonPoints);
}

export function generateMockMessages(conversationId: string, itemId: string): Message[] {
  const messages: Message[] = [];
  const contents = [
    '你好，这个物品还在吗？',
    '在的，还在呢~',
    '我想交换，可以约个时间线下交换',
    '可以呀，你什么时候方便？',
    '周末下午可以吗？',
    '可以的，在小区门口见？',
    '好的，那周六下午3点怎么样？',
    '没问题，到时候见！',
  ];
  for (let i = 0; i < contents.length; i++) {
    messages.push({
      id: uuidv4(),
      conversationId,
      senderId: i % 2 === 0 ? 'current-user' : 'user-1',
      content: contents[i],
      timestamp: new Date(Date.now() - (contents.length - i) * 60000),
    });
  }
  return messages;
}

export function getCurrentUser(): User {
  return {
    id: 'current-user',
    name: '我',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
    carbonPoints: 320,
    exchangeCount: 15,
    totalReduction: 45.5,
    monthlyExchangeCount: 3,
    pointsHistory: [20, 45, 70, 100, 130, 160, 190, 220, 250, 280, 300, 320],
  };
}
