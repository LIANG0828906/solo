import type { LostItem } from '../types.js'

let items: LostItem[] = []

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export function getItems(): LostItem[] {
  return [...items]
}

export function getItemById(id: string): LostItem | undefined {
  return items.find((item) => item.id === id)
}

export function addItem(item: Omit<LostItem, 'id' | 'createdAt' | 'isClaimed'>): LostItem {
  const newItem: LostItem = {
    ...item,
    id: generateId(),
    createdAt: Date.now(),
    isClaimed: false,
  }
  items.push(newItem)
  return newItem
}

export function updateItem(id: string, updates: Partial<LostItem>): LostItem | undefined {
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) return undefined
  items[index] = { ...items[index], ...updates }
  return items[index]
}

export function deleteItem(id: string): boolean {
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) return false
  items.splice(index, 1)
  return true
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

const now = Date.now()

const mockItems: LostItem[] = [
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
]

items = mockItems
