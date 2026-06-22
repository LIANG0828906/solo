import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import type {
  User,
  Instrument,
  Order,
  Database,
  InstrumentCategory,
  OrderStatus,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '..', '..', 'db.json');

const defaultData: Database = {
  users: [],
  instruments: [],
  orders: [],
};

const adapter = new JSONFile<Database>(dbPath);
const db = new Low<Database>(adapter, defaultData);

function sha256(str: string): string {
  return createHash('sha256').update(str).digest('hex');
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getMockData(): Database {
  const now = new Date().toISOString();
  const users: User[] = [
    {
      id: 'user1',
      username: 'alice',
      passwordHash: sha256('123456'),
      nickname: '爱丽丝',
      createdAt: now,
    },
    {
      id: 'user2',
      username: 'bob',
      passwordHash: sha256('123456'),
      nickname: '鲍勃',
      createdAt: now,
    },
    {
      id: 'user3',
      username: 'carol',
      passwordHash: sha256('123456'),
      nickname: '卡罗尔',
      createdAt: now,
    },
  ];

  const mockInstruments: Array<Omit<Instrument, 'id' | 'createdAt'>> = [
    {
      ownerId: 'user1',
      name: 'Yamaha FG800 民谣吉他',
      category: 'guitar' as InstrumentCategory,
      brand: 'Yamaha',
      purchaseYear: 2020,
      dailyRate: 30,
      deposit: 500,
      description: '经典民谣吉他，音色温暖，适合弹唱和指弹。附带琴包、拨片和变调夹。',
      images: [],
      status: 'available',
    },
    {
      ownerId: 'user1',
      name: 'Casio PX-S1000 电钢琴',
      category: 'keyboard' as InstrumentCategory,
      brand: 'Casio',
      purchaseYear: 2021,
      dailyRate: 50,
      deposit: 1000,
      description: '88键重锤电钢琴，音色逼真，便携设计。适合练习和小型演出。',
      images: [],
      status: 'available',
    },
    {
      ownerId: 'user2',
      name: 'Yamaha YFL-222 长笛',
      category: 'wind' as InstrumentCategory,
      brand: 'Yamaha',
      purchaseYear: 2019,
      dailyRate: 25,
      deposit: 400,
      description: '入门级长笛，镀银表面，音色通透。适合初学者和学生使用。',
      images: [],
      status: 'available',
    },
    {
      ownerId: 'user2',
      name: '1/4 小提琴 儿童款',
      category: 'string' as InstrumentCategory,
      brand: 'Suzuki',
      purchaseYear: 2018,
      dailyRate: 20,
      deposit: 300,
      description: '适合4-7岁儿童的小提琴，附琴盒和琴弓。状态良好。',
      images: [],
      status: 'rented',
    },
    {
      ownerId: 'user2',
      name: 'Roland TD-17KV 电子鼓',
      category: 'percussion' as InstrumentCategory,
      brand: 'Roland',
      purchaseYear: 2022,
      dailyRate: 80,
      deposit: 2000,
      description: '专业电子鼓套装，网状鼓皮，手感接近真鼓。不扰民，适合家用练习。',
      images: [],
      status: 'available',
    },
    {
      ownerId: 'user3',
      name: 'Gibson Les Paul Studio 电吉他',
      category: 'guitar' as InstrumentCategory,
      brand: 'Gibson',
      purchaseYear: 2017,
      dailyRate: 100,
      deposit: 3000,
      description: '经典美产电吉他，桃花心木琴身，音色浑厚。摇滚和布鲁斯利器。',
      images: [],
      status: 'available',
    },
    {
      ownerId: 'user3',
      name: 'AKAI MPK Mini MK3 MIDI键盘',
      category: 'keyboard' as InstrumentCategory,
      brand: 'AKAI',
      purchaseYear: 2023,
      dailyRate: 15,
      deposit: 200,
      description: '25键便携MIDI控制器，带打击垫和旋钮。音乐制作入门首选。',
      images: [],
      status: 'available',
    },
    {
      ownerId: 'user3',
      name: '专业卡洪鼓 Cajon',
      category: 'percussion' as InstrumentCategory,
      brand: 'Meinl',
      purchaseYear: 2021,
      dailyRate: 25,
      deposit: 300,
      description: '西班牙进口卡洪鼓，内置响弦，音色丰富。不插电演出必备。',
      images: [],
      status: 'available',
    },
    {
      ownerId: 'user1',
      name: '中音萨克斯 Alto Sax',
      category: 'wind' as InstrumentCategory,
      brand: 'Jupiter',
      purchaseYear: 2020,
      dailyRate: 45,
      deposit: 800,
      description: '降E中音萨克斯，适合爵士和流行。附带清洁套装和笛头。',
      images: [],
      status: 'available',
    },
  ];

  const instruments: Instrument[] = mockInstruments.map((inst) => ({
    ...inst,
    id: uid(),
    createdAt: now,
  }));

  return { users, instruments, orders: [] };
}

export async function initDb(): Promise<void> {
  await db.read();
  if (!db.data || !db.data.users || db.data.users.length === 0) {
    const mock = getMockData();
    db.data = mock;
    await db.write();
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  await db.read();
  return db.data.users.find((u) => u.username === username) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  await db.read();
  return db.data.users.find((u) => u.id === id) || null;
}

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  await db.read();
  const newUser: User = {
    ...user,
    id: uid(),
    createdAt: new Date().toISOString(),
  };
  db.data.users.push(newUser);
  await db.write();
  return newUser;
}

interface InstrumentFilters {
  category?: InstrumentCategory;
  sort?: 'asc' | 'desc';
  search?: string;
}

export async function getInstruments(filters?: InstrumentFilters): Promise<Instrument[]> {
  await db.read();
  let result = [...db.data.instruments];

  if (filters?.category) {
    result = result.filter((i) => i.category === filters.category);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q),
    );
  }

  if (filters?.sort === 'asc') {
    result.sort((a, b) => a.dailyRate - b.dailyRate);
  } else if (filters?.sort === 'desc') {
    result.sort((a, b) => b.dailyRate - a.dailyRate);
  }

  return result;
}

export async function getInstrumentById(id: string): Promise<Instrument | null> {
  await db.read();
  return db.data.instruments.find((i) => i.id === id) || null;
}

export async function createInstrument(
  instrument: Omit<Instrument, 'id' | 'createdAt' | 'status'>,
): Promise<Instrument> {
  await db.read();
  const newInstrument: Instrument = {
    ...instrument,
    id: uid(),
    status: 'available',
    createdAt: new Date().toISOString(),
  };
  db.data.instruments.push(newInstrument);
  await db.write();
  return newInstrument;
}

export async function deleteInstrument(id: string): Promise<boolean> {
  await db.read();
  const idx = db.data.instruments.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  db.data.instruments.splice(idx, 1);
  await db.write();
  return true;
}

export async function updateInstrumentStatus(
  id: string,
  status: 'available' | 'rented' | 'pending',
): Promise<Instrument | null> {
  await db.read();
  const inst = db.data.instruments.find((i) => i.id === id);
  if (!inst) return null;
  inst.status = status;
  await db.write();
  return inst;
}

export async function getOrdersByUserId(
  userId: string,
  role?: 'sent' | 'received',
): Promise<Order[]> {
  await db.read();
  let result = db.data.orders;
  if (role === 'sent') {
    result = result.filter((o) => o.renterId === userId);
  } else if (role === 'received') {
    result = result.filter((o) => o.ownerId === userId);
  } else {
    result = result.filter((o) => o.renterId === userId || o.ownerId === userId);
  }
  return [...result].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getOrderById(id: string): Promise<Order | null> {
  await db.read();
  return db.data.orders.find((o) => o.id === id) || null;
}

export async function createOrder(
  order: Omit<Order, 'id' | 'createdAt' | 'status'>,
): Promise<Order> {
  await db.read();
  const newOrder: Order = {
    ...order,
    id: uid(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.data.orders.push(newOrder);
  await db.write();
  return newOrder;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | null> {
  await db.read();
  const order = db.data.orders.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  await db.write();
  return order;
}

export { sha256 };
