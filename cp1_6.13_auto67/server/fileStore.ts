import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ExpoData } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'expo.json');

const defaultData: ExpoData = {
  exhibits: [
    {
      id: 'ex-001',
      name: '星夜',
      description: '梵高最著名的后印象派画作，描绘了充满运动感的夜空。',
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop.jpg',
      tags: ['绘画', '后印象派', '梵高'],
      likes: 128,
      boothId: null,
    },
    {
      id: 'ex-002',
      name: '蒙娜丽莎',
      description: '达芬奇的传世杰作，以神秘的微笑闻名于世。',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop.png',
      tags: ['绘画', '文艺复兴', '达芬奇'],
      likes: 256,
      boothId: null,
    },
    {
      id: 'ex-003',
      name: '青铜鼎',
      description: '商代青铜器精品，展现了古代精湛的铸造工艺。',
      imageUrl: 'https://images.unsplash.com/photo-1582561833407-b95380302ec9?w=400&h=300&fit=crop.jpg',
      tags: ['文物', '青铜器', '商代'],
      likes: 89,
      boothId: null,
    },
    {
      id: 'ex-004',
      name: '青花瓷瓶',
      description: '明代永乐年间官窑青花瓷，釉色温润典雅。',
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop.png',
      tags: ['瓷器', '明代', '青花'],
      likes: 167,
      boothId: null,
    },
    {
      id: 'ex-005',
      name: '现代雕塑',
      description: '当代艺术家创作的抽象金属雕塑，富有动感张力。',
      imageUrl: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&h=300&fit=crop.jpg',
      tags: ['雕塑', '现代艺术', '金属'],
      likes: 72,
      boothId: null,
    },
    {
      id: 'ex-006',
      name: '水墨山水',
      description: '近代国画大师的写意山水，意境深远清幽。',
      imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop.gif',
      tags: ['国画', '水墨', '山水'],
      likes: 198,
      boothId: null,
    },
  ],
  booths: [
    { id: 'b-1', name: '古典艺术区', number: 1, exhibitIds: [] },
    { id: 'b-2', name: '印象派专区', number: 2, exhibitIds: [] },
    { id: 'b-3', name: '东方艺术馆', number: 3, exhibitIds: [] },
    { id: 'b-4', name: '瓷器展厅', number: 4, exhibitIds: [] },
    { id: 'b-5', name: '雕塑长廊', number: 5, exhibitIds: [] },
    { id: 'b-6', name: '现代艺术区', number: 6, exhibitIds: [] },
    { id: 'b-7', name: '书画展厅', number: 7, exhibitIds: [] },
    { id: 'b-8', name: '特展区A', number: 8, exhibitIds: [] },
    { id: 'b-9', name: '特展区B', number: 9, exhibitIds: [] },
  ],
  comments: [],
};

export function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

export function readData(): ExpoData {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as ExpoData;
}

export function writeData(data: ExpoData): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
