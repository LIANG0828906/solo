import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import type { Database, HeritageItem, Rating, User } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbFile = path.join(dataDir, 'db.json');

const makeRatings = (ratings: Array<{ userId: string; score: number }>): Rating[] => {
  return ratings.map((r) => ({
    userId: r.userId,
    score: r.score,
    createdAt: new Date('2025-01-15T10:00:00Z').toISOString(),
  }));
};

const calcAvg = (ratings: Rating[]): number => {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
};

const heritageSeed: HeritageItem[] = [
  {
    id: 'heritage-001',
    name: '蔚县剪纸',
    region: '华北',
    category: '纸艺',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      'https://images.unsplash.com/photo-1606293459339-aa5d34a7b0e1?w=1200',
      'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=1200',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    story:
      '<p>蔚县剪纸是河北省张家口市蔚县的传统民间艺术，距今已有200多年的历史。</p><p>它以刻代剪，刀工精细，色彩艳丽，题材广泛，被誉为"中华剪纸第一村"。</p><p>2006年，蔚县剪纸被列入第一批国家级非物质文化遗产名录，成为中华传统文化的瑰宝。</p>',
    ratings: makeRatings([
      { userId: 'user-a', score: 5 },
      { userId: 'user-b', score: 4 },
      { userId: 'user-c', score: 5 },
    ]),
    averageRating: 0,
    createdAt: new Date('2025-01-10T08:00:00Z').toISOString(),
    createdBy: 'user-demo',
  },
  {
    id: 'heritage-002',
    name: '苏绣',
    region: '华东',
    category: '绣艺',
    images: [
      'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200',
      'https://images.unsplash.com/photo-1606293459339-aa5d34a7b0e1?w=1200',
    ],
    videoUrl: undefined,
    story:
      '<p>苏绣是江苏省苏州地区的传统刺绣艺术，与湘绣、粤绣、蜀绣并称为中国四大名绣。</p><p>苏绣以针法精细、色彩雅致、图案秀丽著称，被誉为"东方艺术明珠"。</p><p>苏绣作品曾多次作为国礼赠送外宾，在国际上享有盛誉。</p>',
    ratings: makeRatings([
      { userId: 'user-a', score: 5 },
      { userId: 'user-d', score: 5 },
    ]),
    averageRating: 0,
    createdAt: new Date('2025-01-11T09:00:00Z').toISOString(),
    createdBy: 'user-demo',
  },
  {
    id: 'heritage-003',
    name: '景德镇陶瓷',
    region: '华东',
    category: '陶艺',
    images: [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200',
      'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=1200',
    ],
    videoUrl: 'https://www.youtube.com/embed/9bZkp7q19f0',
    story:
      '<p>景德镇陶瓷始于汉代，兴于唐宋，盛于明清，至今已有1700多年的历史。</p><p>景德镇素有"瓷都"之称，其瓷器以"白如玉、明如镜、薄如纸、声如磬"的独特风格闻名于世。</p><p>青花瓷、粉彩瓷、玲珑瓷、颜色釉瓷并称为景德镇四大传统名瓷。</p>',
    ratings: makeRatings([
      { userId: 'user-b', score: 5 },
      { userId: 'user-c', score: 4 },
      { userId: 'user-d', score: 5 },
    ]),
    averageRating: 0,
    createdAt: new Date('2025-01-12T10:00:00Z').toISOString(),
    createdBy: 'user-demo',
  },
  {
    id: 'heritage-004',
    name: '东阳木雕',
    region: '华东',
    category: '雕刻',
    images: [
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200',
    ],
    story:
      '<p>东阳木雕是浙江省东阳市的传统雕刻艺术，与乐清黄杨木雕、青田石雕并称"浙江三雕"。</p><p>东阳木雕以浮雕见长，构图饱满，层次丰富，刀法精湛，被誉为"雕花状元"。</p><p>北京故宫、杭州灵隐寺等著名建筑中都有大量东阳木雕精品。</p>',
    ratings: makeRatings([
      { userId: 'user-a', score: 4 },
      { userId: 'user-e', score: 4 },
    ]),
    averageRating: 0,
    createdAt: new Date('2025-01-13T11:00:00Z').toISOString(),
    createdBy: 'user-demo',
  },
  {
    id: 'heritage-005',
    name: '粤绣',
    region: '华南',
    category: '绣艺',
    images: [
      'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200',
      'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
    ],
    videoUrl: 'https://www.youtube.com/embed/3JZ_D3ELwOQ',
    story:
      '<p>粤绣是广东省广州、潮州等地的传统刺绣艺术，是中国四大名绣之一。</p><p>粤绣构图饱满，色彩浓郁，装饰性强，题材多为花鸟、龙凤、博古等，具有浓郁的岭南特色。</p><p>粤绣中的潮绣以垫高立体著称，绣品金碧辉煌，气势恢宏。</p>',
    ratings: makeRatings([
      { userId: 'user-c', score: 5 },
      { userId: 'user-d', score: 4 },
    ]),
    averageRating: 0,
    createdAt: new Date('2025-01-14T12:00:00Z').toISOString(),
    createdBy: 'user-demo',
  },
  {
    id: 'heritage-006',
    name: '蜀绣',
    region: '西南',
    category: '绣艺',
    images: [
      'https://images.unsplash.com/photo-1606293459339-aa5d34a7b0e1?w=1200',
      'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200',
    ],
    story:
      '<p>蜀绣是四川省成都地区的传统刺绣艺术，与苏绣、湘绣、粤绣并称为中国四大名绣。</p><p>蜀绣以软缎和彩丝为主要原料，针法严谨，片线光亮，变化丰富，具有浓厚的地方特色。</p><p>蜀绣题材多为花鸟、走兽、山水、虫鱼，其中以"芙蓉鲤鱼"最为著名。</p>',
    ratings: makeRatings([
      { userId: 'user-a', score: 5 },
      { userId: 'user-b', score: 5 },
      { userId: 'user-e', score: 4 },
    ]),
    averageRating: 0,
    createdAt: new Date('2025-01-15T13:00:00Z').toISOString(),
    createdBy: 'user-demo',
  },
  {
    id: 'heritage-007',
    name: '宜兴紫砂陶',
    region: '华东',
    category: '陶艺',
    images: [
      'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=1200',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200',
    ],
    videoUrl: undefined,
    story:
      '<p>宜兴紫砂陶是江苏省宜兴市的传统陶瓷艺术，始于北宋，盛于明清，至今已有千年历史。</p><p>紫砂陶以紫砂泥为原料，质地细腻，色泽古朴，透气性好，制作的紫砂壶沏茶色香味皆蕴。</p><p>宜兴紫砂陶制作技艺于2006年被列入第一批国家级非物质文化遗产名录。</p>',
    ratings: makeRatings([
      { userId: 'user-b', score: 4 },
      { userId: 'user-c', score: 5 },
    ]),
    averageRating: 0,
    createdAt: new Date('2025-01-16T14:00:00Z').toISOString(),
    createdBy: 'user-demo',
  },
  {
    id: 'heritage-008',
    name: '凤翔木版年画',
    region: '西北',
    category: '其他',
    images: [
      'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=1200',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      'https://images.unsplash.com/photo-1606293459339-aa5d34a7b0e1?w=1200',
    ],
    videoUrl: 'https://www.youtube.com/embed/OPf0YbXqDm0',
    story:
      '<p>凤翔木版年画是陕西省凤翔县的传统民间美术，始于明代，盛于清代，至今已有500多年历史。</p><p>凤翔年画以门画、风俗画、戏曲故事画为主，色彩鲜艳，造型夸张，线条粗犷，具有浓郁的西北风情。</p><p>2006年，凤翔木版年画被列入第一批国家级非物质文化遗产名录。</p>',
    ratings: makeRatings([
      { userId: 'user-d', score: 5 },
      { userId: 'user-e', score: 4 },
      { userId: 'user-a', score: 4 },
    ]),
    averageRating: 0,
    createdAt: new Date('2025-01-17T15:00:00Z').toISOString(),
    createdBy: 'user-demo',
  },
];

heritageSeed.forEach((item) => {
  item.averageRating = calcAvg(item.ratings);
});

const defaultData: Database = {
  heritage: heritageSeed,
  users: [
    {
      id: 'user-demo',
      username: 'demo',
      password: bcrypt.hashSync('demo123', 10),
      favorites: [],
      createdAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    },
  ],
};

export const db = new Low<Database>(new JSONFile(dbFile), defaultData);

await db.read();
if (!db.data) {
  db.data = defaultData;
}
if (!db.data.heritage || db.data.heritage.length === 0) {
  db.data.heritage = heritageSeed;
}
if (!db.data.users || db.data.users.length === 0) {
  db.data.users = defaultData.users;
}
await db.write();

export default db;
