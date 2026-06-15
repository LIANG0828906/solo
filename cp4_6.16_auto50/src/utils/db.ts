import { get, set, del, keys, createStore } from 'idb-keyval';
import { Item, SwapEvent, Member } from '@/types';
import { generateId, generateAvatar } from './helpers';

const customStore = createStore('swaptrail-db', 'swaptrail-store');

const ITEMS_KEY = 'items';
const EVENTS_KEY = 'swap_events';
const MEMBERS_KEY = 'members';
const INITIALIZED_KEY = 'initialized';

export const db = {
  async getItems(): Promise<Item[]> {
    const items = await get<Item[]>(ITEMS_KEY, customStore);
    return items || [];
  },

  async saveItems(items: Item[]): Promise<void> {
    await set(ITEMS_KEY, items, customStore);
  },

  async getSwapEvents(): Promise<SwapEvent[]> {
    const events = await get<SwapEvent[]>(EVENTS_KEY, customStore);
    return events || [];
  },

  async saveSwapEvents(events: SwapEvent[]): Promise<void> {
    await set(EVENTS_KEY, events, customStore);
  },

  async getMembers(): Promise<Member[]> {
    const members = await get<Member[]>(MEMBERS_KEY, customStore);
    return members || [];
  },

  async saveMembers(members: Member[]): Promise<void> {
    await set(MEMBERS_KEY, members, customStore);
  },

  async isInitialized(): Promise<boolean> {
    const initialized = await get<boolean>(INITIALIZED_KEY, customStore);
    return initialized || false;
  },

  async markInitialized(): Promise<void> {
    await set(INITIALIZED_KEY, true, customStore);
  },

  async clearAll(): Promise<void> {
    const allKeys = await keys(customStore);
    for (const key of allKeys) {
      await del(key, customStore);
    }
  },
};

export const generateSampleData = async (): Promise<void> => {
  const members: Member[] = [
    { name: '小明', avatar: generateAvatar('小明') },
    { name: '小红', avatar: generateAvatar('小红') },
    { name: '小刚', avatar: generateAvatar('小刚') },
    { name: '小美', avatar: generateAvatar('小美') },
    { name: '阿强', avatar: generateAvatar('阿强') },
    { name: '小丽', avatar: generateAvatar('小丽') },
    { name: '大伟', avatar: generateAvatar('大伟') },
  ];

  const now = new Date();
  const items: Item[] = [
    {
      id: generateId(),
      name: 'Kindle电子书阅读器',
      description: '使用两年，屏幕完好，带原装保护套',
      tags: ['电子', '书籍'],
      currentHolder: '小红',
      holderAvatar: generateAvatar('小红'),
      status: 'active',
      createdAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      name: '《人类简史》精装版',
      description: '九成新，无划痕，适合收藏',
      tags: ['书籍'],
      currentHolder: '小刚',
      holderAvatar: generateAvatar('小刚'),
      status: 'active',
      createdAt: new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      name: '优衣库羽绒服M码',
      description: '冬季保暖，穿过一季，已干洗',
      tags: ['衣物'],
      currentHolder: '小美',
      holderAvatar: generateAvatar('小美'),
      status: 'active',
      createdAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      name: '小米空气净化器2S',
      description: '除雾霾PM2.5，滤芯刚更换',
      tags: ['家居', '电子'],
      currentHolder: '阿强',
      holderAvatar: generateAvatar('阿强'),
      status: 'active',
      createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      name: '乐高城市系列积木',
      description: '完整套装，带说明书，孩子长大不再玩',
      tags: ['玩具'],
      currentHolder: '小丽',
      holderAvatar: generateAvatar('小丽'),
      status: 'active',
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      name: '博世电钻套装',
      description: '家用工具箱，含多种钻头，九成新',
      tags: ['工具'],
      currentHolder: '大伟',
      holderAvatar: generateAvatar('大伟'),
      status: 'active',
      createdAt: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      name: '迪卡侬瑜伽垫',
      description: '加厚8mm，防滑材质，很少使用',
      tags: ['运动'],
      currentHolder: '小明',
      holderAvatar: generateAvatar('小明'),
      status: 'active',
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      name: '索尼WH-1000XM3耳机',
      description: '顶级降噪，音质出色，带原装耳机盒',
      tags: ['电子'],
      currentHolder: '小红',
      holderAvatar: generateAvatar('小红'),
      status: 'active',
      createdAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      name: '北欧风格台灯',
      description: '可调节亮度，暖白光，护眼设计',
      tags: ['家居'],
      currentHolder: '小刚',
      holderAvatar: generateAvatar('小刚'),
      status: 'active',
      createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      name: '《三体》全集套装',
      description: '刘慈欣经典科幻，全新未拆封',
      tags: ['书籍'],
      currentHolder: '小美',
      holderAvatar: generateAvatar('小美'),
      status: 'active',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  const events: SwapEvent[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const eventCount = Math.floor(Math.random() * 3) + 1;
    let currentHolder = item.currentHolder;
    let currentAvatar = item.holderAvatar;
    let eventDate = new Date(item.createdAt);

    for (let j = 0; j < eventCount; j++) {
      const nextHolder = members[Math.floor(Math.random() * members.length)];
      if (nextHolder.name === currentHolder) continue;

      const daysToAdd = Math.floor(Math.random() * 30) + 7;
      eventDate = new Date(eventDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      if (eventDate > now) break;

      const notes = [
        '物品状态良好，希望你喜欢！',
        '继续传递这份闲置的价值',
        '很高兴能帮到需要的人',
        '物品保养得很好，请继续爱护它',
        '这是我很喜欢的东西，希望你也能用上',
      ];

      events.push({
        id: generateId(),
        itemId: item.id,
        fromHolder: currentHolder,
        fromAvatar: currentAvatar,
        toHolder: nextHolder.name,
        toAvatar: nextHolder.avatar,
        swapDate: eventDate,
        note: notes[Math.floor(Math.random() * notes.length)],
      });

      currentHolder = nextHolder.name;
      currentAvatar = nextHolder.avatar;
    }
  }

  events.sort((a, b) => b.swapDate.getTime() - a.swapDate.getTime());

  await db.saveMembers(members);
  await db.saveItems(items);
  await db.saveSwapEvents(events);
  await db.markInitialized();
};
