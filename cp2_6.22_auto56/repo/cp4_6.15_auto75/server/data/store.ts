import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { LostItem } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'items.json');

let items: LostItem[] = [];

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('[Store] 创建数据目录失败:', err);
  }
}

function loadFromFile(): void {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed as LostItem[];
        console.log(`[Store] 已从 JSON 文件加载 ${items.length} 条数据`);
        return;
      }
    }
    console.log('[Store] 未找到数据文件，将使用默认 mock 数据');
    items = createMockItems();
    saveToFile();
  } catch (err) {
    console.error('[Store] 加载数据文件失败，使用 mock 数据:', err);
    items = createMockItems();
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSave = false;

function saveToFile(): void {
  pendingSave = true;
  if (saveTimer) return;

  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (!pendingSave) return;
    pendingSave = false;

    ensureDataDir();
    try {
      const data = JSON.stringify(items, null, 2);
      fs.writeFileSync(DATA_FILE, data, 'utf-8');
      console.log(`[Store] 数据已持久化到文件，共 ${items.length} 条`);
    } catch (err) {
      console.error('[Store] 写入数据文件失败:', err);
    }
  }, 200);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export function getItems(): LostItem[] {
  return [...items];
}

export function getItemById(id: string): LostItem | undefined {
  return items.find((item) => item.id === id);
}

export function addItem(
  item: Omit<LostItem, 'id' | 'createdAt' | 'isClaimed'>
): LostItem {
  const newItem: LostItem = {
    ...item,
    id: generateId(),
    createdAt: Date.now(),
    isClaimed: false,
  };
  items.push(newItem);
  saveToFile();
  return newItem;
}

export function updateItem(
  id: string,
  updates: Partial<LostItem>
): LostItem | undefined {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  items[index] = { ...items[index], ...updates };
  saveToFile();
  return items[index];
}

export function deleteItem(id: string): boolean {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  saveToFile();
  return true;
}

function svgToBase64(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function createMockItems(): LostItem[] {
  const walletSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#FFF3E0"/>
  <rect x="15" y="30" width="70" height="45" rx="6" fill="#8B4513"/>
  <rect x="15" y="30" width="70" height="10" rx="3" fill="#5D3A1A"/>
  <circle cx="68" cy="52" r="5" fill="#FFD700" stroke="#B8860B" stroke-width="1"/>
  <rect x="22" y="48" width="22" height="3" rx="1" fill="#D2691E" opacity="0.6"/>
  <rect x="22" y="56" width="16" height="3" rx="1" fill="#D2691E" opacity="0.6"/>
</svg>`.trim();

  const keysSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#E8F5E9"/>
  <circle cx="28" cy="42" r="14" fill="none" stroke="#607D8B" stroke-width="5"/>
  <circle cx="28" cy="42" r="5" fill="#607D8B"/>
  <line x1="42" y1="42" x2="82" y2="42" stroke="#607D8B" stroke-width="5" stroke-linecap="round"/>
  <line x1="72" y1="42" x2="72" y2="58" stroke="#607D8B" stroke-width="4" stroke-linecap="round"/>
  <line x1="62" y1="42" x2="62" y2="52" stroke="#607D8B" stroke-width="4" stroke-linecap="round"/>
  <circle cx="78" cy="30" r="7" fill="#FF7043"/>
  <circle cx="78" cy="30" r="3" fill="#fff"/>
</svg>`.trim();

  const phoneSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#E3F2FD"/>
  <rect x="28" y="12" width="44" height="76" rx="8" fill="#212121"/>
  <rect x="31" y="18" width="38" height="58" rx="3" fill="#42A5F5"/>
  <circle cx="50" cy="82" r="4" fill="#424242"/>
  <circle cx="50" cy="82" r="2" fill="#616161"/>
  <rect x="42" y="14" width="16" height="2" rx="1" fill="#424242"/>
  <rect x="35" y="26" width="30" height="3" rx="1" fill="#fff" opacity="0.8"/>
  <rect x="35" y="33" width="24" height="3" rx="1" fill="#fff" opacity="0.6"/>
  <rect x="35" y="40" width="28" height="3" rx="1" fill="#fff" opacity="0.6"/>
  <rect x="35" y="47" width="20" height="3" rx="1" fill="#fff" opacity="0.6"/>
</svg>`.trim();

  const umbrellaSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#FCE4EC"/>
  <path d="M18 52 Q50 8 82 52" fill="#EF5350" stroke="#C62828" stroke-width="2"/>
  <path d="M34 52 Q50 20 66 52" fill="#FFCDD2" opacity="0.5"/>
  <line x1="50" y1="52" x2="50" y2="86" stroke="#424242" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M50 86 Q50 92 57 92 Q64 92 64 86" fill="none" stroke="#424242" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="50" cy="52" r="3" fill="#424242"/>
</svg>`.trim();

  const bookSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#FFF8E1"/>
  <rect x="18" y="18" width="64" height="64" rx="2" fill="#1976D2"/>
  <rect x="18" y="18" width="4" height="64" fill="#0D47A1"/>
  <rect x="30" y="30" width="44" height="3" rx="1" fill="#fff" opacity="0.9"/>
  <rect x="30" y="38" width="40" height="3" rx="1" fill="#fff" opacity="0.8"/>
  <rect x="30" y="46" width="42" height="3" rx="1" fill="#fff" opacity="0.8"/>
  <rect x="30" y="54" width="36" height="3" rx="1" fill="#fff" opacity="0.8"/>
  <rect x="30" y="62" width="38" height="3" rx="1" fill="#fff" opacity="0.7"/>
  <rect x="30" y="70" width="30" height="3" rx="1" fill="#fff" opacity="0.7"/>
</svg>`.trim();

  const now = Date.now();

  return [
    {
      id: generateId(),
      title: '棕色皮质钱包',
      location: '图书馆一楼自习室',
      description: '棕色皮质钱包，内有身份证和银行卡若干，现金约200元，拉链处有轻微磨损痕迹',
      image: svgToBase64(walletSvg),
      createdAt: now - 3600000 * 2,
      isClaimed: false,
    },
    {
      id: generateId(),
      title: '银色钥匙串带小熊挂件',
      location: '食堂二楼靠窗区域',
      description: '银色钥匙串，约5把钥匙，带有一个橙色小熊挂件，挂件上有名字缩写LZL',
      image: svgToBase64(keysSvg),
      createdAt: now - 3600000 * 5,
      isClaimed: false,
    },
    {
      id: generateId(),
      title: '黑色智能手机',
      location: '操场跑道旁长椅',
      description: '黑色智能手机，屏幕有轻微划痕，套有透明手机壳，手机壳背后夹有校园卡',
      image: svgToBase64(phoneSvg),
      createdAt: now - 3600000 * 10,
      isClaimed: true,
    },
    {
      id: generateId(),
      title: '红色折叠雨伞',
      location: '教学楼A栋门口',
      description: '红色折叠雨伞，黑色伞柄有磨损痕迹，伞面右下角有小污渍，伞骨有一根轻微弯曲',
      image: svgToBase64(umbrellaSvg),
      createdAt: now - 3600000 * 24,
      isClaimed: false,
    },
    {
      id: generateId(),
      title: '蓝色封面笔记本',
      location: '宿舍楼下传达室',
      description: '蓝色封面笔记本，内有高等数学课堂笔记，扉页写有姓名张三和学号20220101',
      image: svgToBase64(bookSvg),
      createdAt: now - 3600000 * 48,
      isClaimed: false,
    },
  ];
}

loadFromFile();
