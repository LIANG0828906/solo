import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Sound } from '../shared/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Data {
  sounds: Sound[]
}

const defaultData: Data = {
  sounds: [
    {
      id: '1',
      title: '城市交通高峰',
      fileName: 'sample1.webm',
      category: 'traffic',
      lat: 31.2304,
      lng: 121.4737,
      duration: 15,
      uploader: 'citywalker',
      uploadTime: '2024-01-15T08:30:00Z',
      description: '早高峰时段的城市主干道车流声',
      tags: ['traffic', 'morning', 'busy'],
      likes: 24,
      reports: 0,
      isReported: false,
    },
    {
      id: '2',
      title: '公园鸟鸣',
      fileName: 'sample2.webm',
      category: 'nature',
      lat: 31.2354,
      lng: 121.4787,
      duration: 22,
      uploader: 'naturelover',
      uploadTime: '2024-01-14T06:15:00Z',
      description: '清晨公园中的鸟鸣和树叶沙沙声',
      tags: ['birds', 'park', 'morning'],
      likes: 56,
      reports: 0,
      isReported: false,
    },
    {
      id: '3',
      title: '步行街人群',
      fileName: 'sample3.webm',
      category: 'crowd',
      lat: 31.2394,
      lng: 121.4717,
      duration: 18,
      uploader: 'urbanear',
      uploadTime: '2024-01-13T14:20:00Z',
      description: '周末步行街的人群喧嚣声',
      tags: ['crowd', 'weekend', 'shopping'],
      likes: 31,
      reports: 0,
      isReported: false,
    },
    {
      id: '4',
      title: '地铁施工',
      fileName: 'sample4.webm',
      category: 'machinery',
      lat: 31.2274,
      lng: 121.4697,
      duration: 12,
      uploader: 'citysound',
      uploadTime: '2024-01-12T10:45:00Z',
      description: '城市地铁建设工地的机械作业声',
      tags: ['construction', 'metro', 'industrial'],
      likes: 8,
      reports: 0,
      isReported: false,
    },
  ],
}

const dbPath = path.join(__dirname, '..', '..', 'data', 'db.json')

const adapter = new JSONFile<Data>(dbPath)
export const db = new Low(adapter, defaultData)

export async function initDb(): Promise<void> {
  await db.read()
  if (!db.data) {
    db.data = defaultData
    await db.write()
  }
  if (!db.data.sounds) {
    db.data.sounds = defaultData.sounds
    await db.write()
  }
}
