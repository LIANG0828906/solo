import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbFile = path.join(__dirname, '../db.json')

const defaultData = {
  items: [
    {
      id: 'item-1',
      title: '二手自行车',
      category: 'furniture',
      condition: 'good',
      description: '九成新山地自行车，骑行不到500公里，前后碟刹，变速正常。',
      images: [],
      userId: 'user1',
      userName: '张三',
      userAvatar: '',
      status: 'available',
      createdAt: Date.now() - 86400000 * 5
    },
    {
      id: 'item-2',
      title: 'Python编程入门书籍',
      category: 'books',
      condition: 'like-new',
      description: '《Python编程：从入门到实践》，无笔记无折痕，附光盘。',
      images: [],
      userId: 'user1',
      userName: '张三',
      userAvatar: '',
      status: 'available',
      createdAt: Date.now() - 86400000 * 4
    },
    {
      id: 'item-3',
      title: '蓝牙音箱',
      category: 'electronics',
      condition: 'good',
      description: 'JBL蓝牙音箱，音质清晰，电池续航约6小时，轻微使用痕迹。',
      images: [],
      userId: 'user2',
      userName: '李四',
      userAvatar: '',
      status: 'available',
      createdAt: Date.now() - 86400000 * 3
    },
    {
      id: 'item-4',
      title: '瑜伽垫',
      category: 'clothing',
      condition: 'fair',
      description: '加厚瑜伽垫，使用一年，有少量磨损，不影响使用。',
      images: [],
      userId: 'user2',
      userName: '李四',
      userAvatar: '',
      status: 'available',
      createdAt: Date.now() - 86400000 * 2
    },
    {
      id: 'item-5',
      title: '儿童积木套装',
      category: 'other',
      condition: 'like-new',
      description: '大颗粒积木200块，适合3岁以上儿童，原装盒装完整。',
      images: [],
      userId: 'user1',
      userName: '张三',
      userAvatar: '',
      status: 'available',
      createdAt: Date.now() - 86400000
    },
    {
      id: 'item-6',
      title: '不锈钢保温杯',
      category: 'other',
      condition: 'good',
      description: '500ml保温杯，保温效果好，12小时仍烫手，无异味。',
      images: [],
      userId: 'user2',
      userName: '李四',
      userAvatar: '',
      status: 'available',
      createdAt: Date.now() - 3600000 * 6
    }
  ],
  exchanges: [
    {
      id: 'exchange-1',
      itemId: 'item-3',
      itemTitle: '蓝牙音箱',
      itemImage: '',
      requesterId: 'user1',
      requesterName: '张三',
      requesterAvatar: '',
      ownerId: 'user2',
      ownerName: '李四',
      message: '你好，我想用Python书籍交换你的蓝牙音箱，可以吗？',
      status: 'accepted',
      createdAt: Date.now() - 86400000 * 2,
      acceptedAt: Date.now() - 86400000,
      completedAt: null,
      requesterRated: false,
      ownerRated: false
    },
    {
      id: 'exchange-2',
      itemId: 'item-5',
      itemTitle: '儿童积木套装',
      itemImage: '',
      requesterId: 'user2',
      requesterName: '李四',
      requesterAvatar: '',
      ownerId: 'user1',
      ownerName: '张三',
      message: '我家孩子很喜欢积木，方便交换吗？',
      status: 'pending',
      createdAt: Date.now() - 3600000 * 3,
      acceptedAt: null,
      completedAt: null,
      requesterRated: false,
      ownerRated: false
    }
  ],
  ratings: [
    {
      id: 'rating-1',
      exchangeId: 'exchange-1',
      fromUserId: 'user1',
      fromUserName: '张三',
      fromUserAvatar: '',
      toUserId: 'user2',
      score: 5,
      comment: '李四人很好，物品描述一致，交换过程很顺利！',
      createdAt: Date.now() - 3600000
    }
  ]
}

let db = null

export async function initDB() {
  const adapter = new JSONFile(dbFile)
  db = new Low(adapter, defaultData)
  await db.read()
  if (!db.data.items) db.data.items = []
  if (!db.data.exchanges) db.data.exchanges = []
  if (!db.data.ratings) db.data.ratings = []
  await db.write()
  return db
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.')
  }
  return db
}
