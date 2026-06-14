import { JSONFilePreset } from 'lowdb/node'

interface Song {
  id: string
  title: string
  artist: string
  artistAvatar: string
  tags: string[]
  priceDigital: number
  priceCD: number
  coverImage: string
  audioFile: string
  scoreFile: string
  lyrics: string
  description: string
  purchaseCount: number
  rating: number
  createdAt: string
}

interface Purchase {
  id: string
  songId: string
  type: 'digital' | 'cd'
  createdAt: string
}

interface DbData {
  songs: Song[]
  purchases: Purchase[]
}

const defaultData: DbData = {
  songs: [
    {
      id: '1',
      title: '午夜星河',
      artist: '林夜声',
      artistAvatar: '',
      tags: ['电子', '氛围'],
      priceDigital: 12.9,
      priceCD: 49.9,
      coverImage: '',
      audioFile: '/uploads/audio/sample1.mp3',
      scoreFile: '/uploads/scores/sample1.pdf',
      lyrics: '午夜星河闪烁\n光影交织成梦\n在城市尽头\n我听见了风的声音\n穿越时间的缝隙\n触碰你的心跳',
      description: '一首融合电子音色与氛围音乐的作品，在午夜时分的城市中游走，捕捉光影与声音的交织。',
      purchaseCount: 128,
      rating: 4.8,
      createdAt: '2025-12-15T10:00:00Z'
    },
    {
      id: '2',
      title: '破晓之歌',
      artist: '陈晨光',
      artistAvatar: '',
      tags: ['摇滚', '流行'],
      priceDigital: 9.9,
      priceCD: 39.9,
      coverImage: '',
      audioFile: '/uploads/audio/sample2.mp3',
      scoreFile: '/uploads/scores/sample2.pdf',
      lyrics: '破晓的阳光穿透云层\n照亮沉睡的大地\n每一步都是新的开始\n每一刻都值得珍惜\n让我们一起走向远方\n在光明中寻找答案',
      description: '摇滚与流行的融合，用破晓的第一缕阳光象征希望与新生，激励每一个在路上的灵魂。',
      purchaseCount: 256,
      rating: 4.9,
      createdAt: '2025-11-20T08:00:00Z'
    },
    {
      id: '3',
      title: '雨巷漫步',
      artist: '苏墨然',
      artistAvatar: '',
      tags: ['民谣', '流行'],
      priceDigital: 8.9,
      priceCD: 35.9,
      coverImage: '',
      audioFile: '/uploads/audio/sample3.mp3',
      scoreFile: '/uploads/scores/sample3.pdf',
      lyrics: '细雨纷飞的小巷\n青石板上的脚步声\n撑一把油纸伞\n走过千年的时光\n在转角处遇见你\n是最美的意外',
      description: '民谣风格作品，以江南雨巷为意象，用细腻的旋律勾勒出一幅水墨画卷。',
      purchaseCount: 89,
      rating: 4.6,
      createdAt: '2026-01-05T14:00:00Z'
    },
    {
      id: '4',
      title: '霓虹都市',
      artist: '林夜声',
      artistAvatar: '',
      tags: ['电子', '流行'],
      priceDigital: 15.9,
      priceCD: 59.9,
      coverImage: '',
      audioFile: '/uploads/audio/sample4.mp3',
      scoreFile: '/uploads/scores/sample4.pdf',
      lyrics: '霓虹灯下的都市\n每个人都是孤独的星\n在喧嚣中寻找宁静\n在繁华中保持真实\n让音乐成为桥梁\n连接每一颗跳动的心',
      description: '电子流行风格的都市交响，用合成器编织出城市的脉搏，在霓虹与暗影之间寻找真实的自我。',
      purchaseCount: 312,
      rating: 4.7,
      createdAt: '2026-02-10T20:00:00Z'
    },
    {
      id: '5',
      title: '山海经·梦',
      artist: '赵云箫',
      artistAvatar: '',
      tags: ['古风', '氛围'],
      priceDigital: 11.9,
      priceCD: 45.9,
      coverImage: '',
      audioFile: '/uploads/audio/sample5.mp3',
      scoreFile: '/uploads/scores/sample5.pdf',
      lyrics: '翻开泛黄的书页\n山海之间的传说\n凤凰涅槃的火焰\n鲲鹏展翅的九万里\n梦回远古的苍穹\n听见先民的歌唱',
      description: '取材自《山海经》的古风氛围音乐，用现代编曲手法重塑上古神话的壮阔与神秘。',
      purchaseCount: 176,
      rating: 4.9,
      createdAt: '2026-03-01T12:00:00Z'
    }
  ],
  purchases: []
}

export async function getDb() {
  const db = await JSONFilePreset<DbData>('db.json', defaultData)
  return db
}

export type { Song, Purchase, DbData }
