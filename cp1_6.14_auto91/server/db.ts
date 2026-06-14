import { JSONFilePreset } from 'lowdb/node';
import path from 'path';

interface FosterFamily {
  id: string;
  name: string;
  avatar: string;
  description: string;
  petTypes: string[];
  dailyRate: number;
  photos: string[];
  rating: number;
  fosterCount: number;
  services: string[];
  walkDuration: string;
  verified: boolean;
}

interface ScheduleTask {
  id: string;
  fosterFamilyId: string;
  petName: string;
  date: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  type: 'feed' | 'walk' | 'medicine' | 'other';
  description: string;
}

interface Message {
  id: string;
  fosterId: string;
  senderRole: 'owner' | 'foster';
  content: string;
  photos: string[];
  timestamp: string;
  read: boolean;
}

interface FosterApplication {
  id: string;
  familyId: string;
  ownerName: string;
  petName: string;
  petType: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface DbSchema {
  fosterFamilies: FosterFamily[];
  scheduleTasks: ScheduleTask[];
  messages: Message[];
  applications: FosterApplication[];
}

const defaultData: DbSchema = {
  fosterFamilies: [
    {
      id: 'f1',
      name: '王晓琳',
      avatar: 'https://img.zcool.cn/community/01cf9a5b5765b4a801214168a4ed72.jpg',
      description: '资深猫咪爱好者，家中养有3只猫咪，拥有8年猫咪寄养经验。熟悉各品种猫咪习性，能提供最贴心的照顾。',
      petTypes: ['猫'],
      dailyRate: 120,
      photos: [
        'https://img.zcool.cn/community/01cf9a5b5765b4a801214168a4ed72.jpg',
        'https://img.zcool.cn/community/0178655798bd5e0000018c1bf4a0c6.jpg'
      ],
      rating: 4.9,
      fosterCount: 56,
      services: ['喂食', '梳毛', '铲屎清洁', '视频看护'],
      walkDuration: '',
      verified: true
    },
    {
      id: 'f2',
      name: '李明远',
      avatar: 'https://img.zcool.cn/community/0178655798bd5e0000018c1bf4a0c6.jpg',
      description: '专业狗狗寄养师，拥有独立院落，每天保证2小时户外遛狗时间。擅长中大型犬护理，性格温和有耐心。',
      petTypes: ['狗'],
      dailyRate: 150,
      photos: [
        'https://img.zcool.cn/community/0178655798bd5e0000018c1bf4a0c6.jpg'
      ],
      rating: 4.8,
      fosterCount: 43,
      services: ['遛狗', '喂食', '洗澡', '基础训练'],
      walkDuration: '120分钟',
      verified: true
    },
    {
      id: 'f3',
      name: '张雨晴',
      avatar: 'https://img.zcool.cn/community/01cf9a5b5765b4a801214168a4ed72.jpg',
      description: '小型宠物之家，专门接待5kg以下的小型犬和猫咪。家中环境温馨安静，适合胆小敏感的宠物。',
      petTypes: ['猫', '狗'],
      dailyRate: 80,
      photos: [
        'https://img.zcool.cn/community/01cf9a5b5765b4a801214168a4ed72.jpg'
      ],
      rating: 4.7,
      fosterCount: 31,
      services: ['喂食', '陪伴玩耍', '每日照片更新'],
      walkDuration: '60分钟',
      verified: true
    },
    {
      id: 'f4',
      name: '陈思远',
      avatar: 'https://img.zcool.cn/community/0178655798bd5e0000018c1bf4a0c6.jpg',
      description: '异宠寄养专家，擅长仓鼠、兔子、龙猫等小型异宠照料。恒温恒湿环境，专业饲养设备齐全。',
      petTypes: ['仓鼠', '兔子', '龙猫', '鹦鹉'],
      dailyRate: 100,
      photos: [
        'https://img.zcool.cn/community/0178655798bd5e0000018c1bf4a0c6.jpg'
      ],
      rating: 4.6,
      fosterCount: 22,
      services: ['喂食', '笼舍清洁', '健康观察', '环境调控'],
      walkDuration: '',
      verified: false
    },
    {
      id: 'f5',
      name: '刘美华',
      avatar: 'https://img.zcool.cn/community/01cf9a5b5765b4a801214168a4ed72.jpg',
      description: '温馨宠物旅馆主人，10年宠物护理经验。提供独立宠物房间，每日视频连线让您随时看到毛孩子。',
      petTypes: ['猫', '狗'],
      dailyRate: 200,
      photos: [
        'https://img.zcool.cn/community/01cf9a5b5765b4a801214168a4ed72.jpg',
        'https://img.zcool.cn/community/0178655798bd5e0000018c1bf4a0c6.jpg'
      ],
      rating: 5.0,
      fosterCount: 89,
      services: ['独立房间', '定时喂食', '视频连线', '洗澡美容', '遛狗'],
      walkDuration: '90分钟',
      verified: true
    },
    {
      id: 'f6',
      name: '赵建国',
      avatar: 'https://img.zcool.cn/community/0178655798bd5e0000018c1bf4a0c6.jpg',
      description: '大型犬专属寄养，拥有200平室外活动区域。金毛、拉布拉多、哈士奇等大型犬的理想选择，保证充足运动量。',
      petTypes: ['狗'],
      dailyRate: 180,
      photos: [
        'https://img.zcool.cn/community/0178655798bd5e0000018c1bf4a0c6.jpg'
      ],
      rating: 4.5,
      fosterCount: 67,
      services: ['户外运动', '喂食', '洗澡', '行为矫正'],
      walkDuration: '180分钟',
      verified: true
    }
  ],
  scheduleTasks: [
    {
      id: 'st1',
      fosterFamilyId: 'f1',
      petName: '咪咪',
      date: '2026-06-15',
      timeSlot: 'morning',
      type: 'feed',
      description: '早上喂猫粮和罐头，注意饮水量'
    },
    {
      id: 'st2',
      fosterFamilyId: 'f1',
      petName: '咪咪',
      date: '2026-06-15',
      timeSlot: 'afternoon',
      type: 'walk',
      description: '室内逗猫棒互动15分钟'
    },
    {
      id: 'st3',
      fosterFamilyId: 'f2',
      petName: '旺财',
      date: '2026-06-16',
      timeSlot: 'morning',
      type: 'medicine',
      description: '服用驱虫药，饭后半小时服用'
    }
  ],
  messages: [
    {
      id: 'm1',
      fosterId: 'f1',
      senderRole: 'owner',
      content: '你好，我家咪咪下周需要寄养几天，请问有空位吗？',
      photos: [],
      timestamp: '2026-06-13T09:00:00.000Z',
      read: true
    },
    {
      id: 'm2',
      fosterId: 'f1',
      senderRole: 'foster',
      content: '您好！下周有空位的，咪咪之前来过，我会好好照顾它的～',
      photos: [],
      timestamp: '2026-06-13T09:15:00.000Z',
      read: false
    }
  ],
  applications: []
};

let db: any = null;

async function initDb() {
  const dbPath = path.join(process.cwd(), 'server', 'db.json');
  db = await JSONFilePreset<DbSchema>(dbPath, defaultData);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

function getCollection(name: keyof DbSchema) {
  const database = getDb();
  return database.data[name];
}

async function addItem(name: keyof DbSchema, item: any) {
  const database = getDb();
  database.data[name].push(item);
  await database.write();
  return item;
}

async function updateItem(name: keyof DbSchema, id: string, updates: any) {
  const database = getDb();
  const collection = database.data[name];
  const index = collection.findIndex((item: any) => item.id === id);
  if (index === -1) return null;
  Object.assign(collection[index], updates);
  await database.write();
  return collection[index];
}

async function deleteItem(name: keyof DbSchema, id: string) {
  const database = getDb();
  const collection = database.data[name];
  const index = collection.findIndex((item: any) => item.id === id);
  if (index === -1) return false;
  collection.splice(index, 1);
  await database.write();
  return true;
}

function findItems(name: keyof DbSchema, predicate: (item: any) => boolean) {
  const database = getDb();
  return database.data[name].filter(predicate);
}

export { initDb, getDb, getCollection, addItem, updateItem, deleteItem, findItems };
export type { DbSchema, FosterFamily, ScheduleTask, Message, FosterApplication };
