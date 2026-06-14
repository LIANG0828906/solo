import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import type { DatabaseSchema } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', '..', 'data')
const dbFile = path.join(dataDir, 'db.json')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const defaultData: DatabaseSchema = {
  books: [
    {
      id: '1',
      title: '百年孤独',
      author: '加西亚·马尔克斯',
      category: '文学',
      isbn: '978-7-5442-5399-4',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20book%20cover%20of%20One%20Hundred%20Years%20of%20Solitude%20literary%20novel&image_size=portrait_4_3',
      description: '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。',
      totalQuantity: 5,
      availableQuantity: 3,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      title: '活着',
      author: '余华',
      category: '文学',
      isbn: '978-7-5063-3043-5',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20literary%20book%20cover%20of%20To%20Live%20novel%20Yu%20Hua&image_size=portrait_4_3',
      description: '讲述了农村人福贵悲惨的人生遭遇，展现了生命的韧性。',
      totalQuantity: 4,
      availableQuantity: 2,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
    {
      id: '3',
      title: '人类简史',
      author: '尤瓦尔·赫拉利',
      category: '历史',
      isbn: '978-7-5086-5989-8',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20of%20Sapiens%20A%20Brief%20History%20of%20Humankind&image_size=portrait_4_3',
      description: '从认知革命到科学革命，讲述智人如何登上食物链顶端。',
      totalQuantity: 3,
      availableQuantity: 3,
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z',
    },
    {
      id: '4',
      title: '代码整洁之道',
      author: 'Robert C. Martin',
      category: '科技',
      isbn: '978-7-115-21748-2',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clean%20code%20programming%20book%20cover%20technology&image_size=portrait_4_3',
      description: '软件工程领域的经典著作，教你如何编写整洁、可维护的代码。',
      totalQuantity: 6,
      availableQuantity: 4,
      createdAt: '2024-01-04T00:00:00.000Z',
      updatedAt: '2024-01-04T00:00:00.000Z',
    },
    {
      id: '5',
      title: '小王子',
      author: '安托万·德·圣-埃克苏佩里',
      category: '文学',
      isbn: '978-7-02-004249-5',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=the%20little%20prince%20book%20cover%20fairy%20tale&image_size=portrait_4_3',
      description: '一部充满诗意和哲理的童话，献给所有曾经是孩子的大人。',
      totalQuantity: 8,
      availableQuantity: 6,
      createdAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z',
    },
    {
      id: '6',
      title: '三体',
      author: '刘慈欣',
      category: '科幻',
      isbn: '978-7-5366-9293-0',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=The%20Three%20Body%20Problem%20sci-fi%20book%20cover%20universe&image_size=portrait_4_3',
      description: '中国科幻文学的里程碑，讲述人类与三体文明的首次接触。',
      totalQuantity: 5,
      availableQuantity: 2,
      createdAt: '2024-01-06T00:00:00.000Z',
      updatedAt: '2024-01-06T00:00:00.000Z',
    },
  ],
  readers: [
    {
      id: 'admin-1',
      name: '系统管理员',
      email: 'admin@library.com',
      passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIwQzYcMzXzYwNzYwNzYwNzYwNzYwNzYw',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  loans: [],
  notifications: [],
  config: {
    maxBorrowCount: 5,
    loanDays: 14,
    lateFeePerDay: 0.5,
  },
}

const adapter = new JSONFile<DatabaseSchema>(dbFile)
export const db = new Low(adapter, defaultData)

export async function initDb(): Promise<void> {
  await db.read()
  if (db.data === null) {
    db.data = defaultData
  }
  await db.write()
}

export default db
