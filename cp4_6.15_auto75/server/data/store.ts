import { readFile, writeFile, access, mkdir } from 'fs/promises'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { LostItem } from '../types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = __dirname
const DATA_FILE = path.join(DATA_DIR, 'data.json')

let items: LostItem[] = []
let initialized = false

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

function svgToBase64(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

const walletSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#f5f5f5"/>
  <rect x="15" y="30" width="70" height="45" rx="5" fill="#8B4513"/>
  <rect x="15" y="30" width="70" height="10" fill="#654321"/>
  <circle cx="70" cy="52" r="6" fill="#FFD700"/>
</svg>
`.trim()

const keysSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#f0f0f0"/>
  <circle cx="30" cy="40" r="15" fill="none" stroke="#C0C0C0" stroke-width="4"/>
  <line x1="45" y1="40" x2="80" y2="40" stroke="#C0C0C0" stroke-width="4"/>
  <line x1="70" y1="40" x2="70" y2="55" stroke="#C0C0C0" stroke-width="4"/>
  <line x1="60" y1="40" x2="60" y2="50" stroke="#C0C0C0" stroke-width="4"/>
</svg>
`.trim()

const phoneSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#e8e8e8"/>
  <rect x="30" y="15" width="40" height="70" rx="5" fill="#1a1a1a"/>
  <rect x="33" y="20" width="34" height="55" fill="#4a90d9"/>
  <circle cx="50" cy="80" r="3" fill="#333"/>
</svg>
`.trim()

const umbrellaSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#fafafa"/>
  <path d="M20 50 Q50 10 80 50" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
  <line x1="50" y1="50" x2="50" y2="85" stroke="#333" stroke-width="3"/>
  <path d="M50 85 Q50 90 55 90" fill="none" stroke="#333" stroke-width="3"/>
</svg>
`.trim()

const bookSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#f5f5f5"/>
  <rect x="20" y="20" width="60" height="65" fill="#3498db"/>
  <rect x="25" y="20" width="2" height="65" fill="#2980b9"/>
  <line x1="35" y1="35" x2="70" y2="35" stroke="#fff" stroke-width="2"/>
  <line x1="35" y1="45" x2="65" y2="45" stroke="#fff" stroke-width="2"/>
  <line x1="35" y1="55" x2="60" y2="55" stroke="#fff" stroke-width="2"/>
</svg>
`.trim()

const backpackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#f5f5f5"/>
  <rect x="28" y="25" width="44" height="55" rx="6" fill="#2ecc71"/>
  <rect x="28" y="25" width="44" height="12" rx="6" fill="#27ae60"/>
  <rect x="20" y="35" width="8" height="30" rx="4" fill="#27ae60"/>
  <rect x="72" y="35" width="8" height="30" rx="4" fill="#27ae60"/>
  <rect x="40" y="45" width="20" height="15" rx="3" fill="#1abc9c"/>
</svg>
`.trim()

const glassesSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#fafafa"/>
  <circle cx="30" cy="50" r="18" fill="none" stroke="#333" stroke-width="3"/>
  <circle cx="70" cy="50" r="18" fill="none" stroke="#333" stroke-width="3"/>
  <line x1="48" y1="50" x2="52" y2="50" stroke="#333" stroke-width="3"/>
  <line x1="12" y1="50" x2="5" y2="42" stroke="#333" stroke-width="3"/>
  <line x1="88" y1="50" x2="95" y2="42" stroke="#333" stroke-width="3"/>
</svg>
`.trim()

function createMockData(): LostItem[] {
  const now = Date.now()
  return [
    {
      id: generateId(),
      title: '棕色钱包',
      location: '图书馆一楼自习室',
      description: '棕色皮质钱包，内有身份证和银行卡若干，现金约200元',
      image: svgToBase64(walletSvg),
      createdAt: now - 3600000 * 2,
      isClaimed: false,
    },
    {
      id: generateId(),
      title: '一串钥匙',
      location: '食堂二楼',
      description: '银色钥匙串，约5把钥匙，带有一个小熊挂件',
      image: svgToBase64(keysSvg),
      createdAt: now - 3600000 * 5,
      isClaimed: false,
    },
    {
      id: generateId(),
      title: '黑色手机',
      location: '操场跑道旁',
      description: '黑色智能手机，屏幕有轻微划痕，套有透明手机壳',
      image: svgToBase64(phoneSvg),
      createdAt: now - 3600000 * 10,
      isClaimed: true,
    },
    {
      id: generateId(),
      title: '红色雨伞',
      location: '教学楼A栋门口',
      description: '红色折叠雨伞，伞柄有磨损痕迹，伞面有小污渍',
      image: svgToBase64(umbrellaSvg),
      createdAt: now - 3600000 * 24,
      isClaimed: false,
    },
    {
      id: generateId(),
      title: '蓝色笔记本',
      location: '宿舍楼下传达室',
      description: '蓝色封面笔记本，内有课堂笔记，写有名字张三',
      image: svgToBase64(bookSvg),
      createdAt: now - 3600000 * 48,
      isClaimed: false,
    },
    {
      id: generateId(),
      title: '绿色双肩包',
      location: '体育馆更衣室',
      description: '绿色运动双肩包，内有运动服和毛巾，品牌为Nike',
      image: svgToBase64(backpackSvg),
      createdAt: now - 3600000 * 72,
      isClaimed: false,
    },
    {
      id: generateId(),
      title: '黑框眼镜',
      location: '教学楼B栋302教室',
      description: '黑色框近视眼镜，镜片有轻度磨损，配有棕色眼镜盒',
      image: svgToBase64(glassesSvg),
      createdAt: now - 3600000 * 96,
      isClaimed: false,
    },
  ]
}

export function initStoreSync(): void {
  if (initialized) return

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  if (!existsSync(DATA_FILE)) {
    const mockData = createMockData()
    writeFileSync(DATA_FILE, JSON.stringify(mockData, null, 2), 'utf-8')
    items = mockData
  } else {
    try {
      const content = readFileSync(DATA_FILE, 'utf-8')
      items = JSON.parse(content)
    } catch {
      const mockData = createMockData()
      writeFileSync(DATA_FILE, JSON.stringify(mockData, null, 2), 'utf-8')
      items = mockData
    }
  }

  initialized = true
}

export async function initStore(): Promise<void> {
  if (initialized) return

  try {
    await access(DATA_DIR)
  } catch {
    await mkdir(DATA_DIR, { recursive: true })
  }

  try {
    await access(DATA_FILE)
    const content = await readFile(DATA_FILE, 'utf-8')
    items = JSON.parse(content)
  } catch {
    const mockData = createMockData()
    await writeFile(DATA_FILE, JSON.stringify(mockData, null, 2), 'utf-8')
    items = mockData
  }

  initialized = true
}

export async function loadItems(): Promise<LostItem[]> {
  if (!initialized) {
    await initStore()
  }
  return [...items]
}

export async function saveItems(): Promise<void> {
  await writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8')
}

export function getItems(): LostItem[] {
  if (!initialized) {
    initStoreSync()
  }
  return [...items]
}

export function getItemById(id: string): LostItem | undefined {
  if (!initialized) {
    initStoreSync()
  }
  return items.find((item) => item.id === id)
}

export function addItem(item: Omit<LostItem, 'id' | 'createdAt' | 'isClaimed'>): LostItem {
  if (!initialized) {
    initStoreSync()
  }
  const newItem: LostItem = {
    ...item,
    id: generateId(),
    createdAt: Date.now(),
    isClaimed: false,
  }
  items.push(newItem)
  saveItems().catch(() => {})
  return newItem
}

export function updateItem(id: string, updates: Partial<LostItem>): LostItem | undefined {
  if (!initialized) {
    initStoreSync()
  }
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) return undefined
  items[index] = { ...items[index], ...updates }
  saveItems().catch(() => {})
  return items[index]
}

export function deleteItem(id: string): boolean {
  if (!initialized) {
    initStoreSync()
  }
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) return false
  items.splice(index, 1)
  saveItems().catch(() => {})
  return true
}
