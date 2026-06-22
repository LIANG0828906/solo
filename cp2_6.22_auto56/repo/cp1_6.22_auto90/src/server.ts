import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

interface Episode {
  id: string
  title: string
  description: string
  duration: number
  publishedAt: string
  audioUrl: string
}

interface Podcast {
  id: string
  title: string
  author: string
  description: string
  coverImage: string
  category: string
  episodes: Episode[]
}

interface Playlist {
  id: string
  name: string
  podcastIds: string[]
  createdAt: string
  updatedAt: string
}

interface Note {
  id: string
  podcastId: string
  episodeId?: string
  content: string
  rating: number
  createdAt: string
  updatedAt: string
}

const podcasts = new Map<string, Podcast>()
const playlists = new Map<string, Playlist>()
const notes = new Map<string, Note>()

const seedPodcasts: Omit<Podcast, 'id'>[] = [
  {
    title: '声东击西',
    author: '徐涛 & 肖文杰',
    description: '一档探讨科技、商业、文化和生活方式的播客节目。两位主播用轻松幽默的方式，分享他们对这个快速变化世界的观察与思考。',
    coverImage: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop',
    category: '科技商业',
    episodes: [
      {
        id: uuidv4(),
        title: 'AI 时代，我们还需要学习编程吗？',
        description: '随着大语言模型的普及，编程能力的定义正在被重新书写。我们聊聊未来的程序员会是什么样子。',
        duration: 3240,
        publishedAt: '2026-06-15',
        audioUrl: 'https://example.com/audio/ep1.mp3',
      },
      {
        id: uuidv4(),
        title: '远程办公三年后，我们学到了什么',
        description: '从疫情被迫远程到现在的混合办公模式，企业和员工都经历了巨大的变化。',
        duration: 2880,
        publishedAt: '2026-06-08',
        audioUrl: 'https://example.com/audio/ep2.mp3',
      },
      {
        id: uuidv4(),
        title: '中国互联网公司的下一个十年',
        description: '从流量红利到技术驱动，中国互联网正在经历一场深刻的转型。',
        duration: 3600,
        publishedAt: '2026-06-01',
        audioUrl: 'https://example.com/audio/ep3.mp3',
      },
      {
        id: uuidv4(),
        title: '创业者的心理健康',
        description: '创业是一场马拉松，如何在高压下保持心理健康，是每个创业者都需要面对的课题。',
        duration: 2520,
        publishedAt: '2026-05-25',
        audioUrl: 'https://example.com/audio/ep4.mp3',
      },
    ],
  },
  {
    title: '故事 FM',
    author: '寇爱哲',
    description: '用你的声音，讲述你的故事。这是一档专注于真实故事的播客，每一期都邀请一位讲述者，分享他们的人生经历。',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
    category: '真实故事',
    episodes: [
      {
        id: uuidv4(),
        title: '我在南极的一百天',
        description: '一位科考队员讲述他在南极越冬的经历，极夜、极昼，以及那些让人终生难忘的瞬间。',
        duration: 2700,
        publishedAt: '2026-06-18',
        audioUrl: 'https://example.com/audio/ep5.mp3',
      },
      {
        id: uuidv4(),
        title: '从大厂辞职开咖啡馆，我后悔了吗？',
        description: '一位前互联网产品经理分享她裸辞创业的酸甜苦辣。',
        duration: 3060,
        publishedAt: '2026-06-11',
        audioUrl: 'https://example.com/audio/ep6.mp3',
      },
      {
        id: uuidv4(),
        title: '我的抑郁症康复之路',
        description: '一段与抑郁症共处五年的真实经历，从确诊到康复，从黑暗到光明。',
        duration: 3420,
        publishedAt: '2026-06-04',
        audioUrl: 'https://example.com/audio/ep7.mp3',
      },
    ],
  },
  {
    title: '忽左忽右',
    author: '程衍樑 & 杨一',
    description: '一档文化沙龙类播客节目，邀请学术界、文化界、艺术界的嘉宾，讨论历史、政治、文化等话题。',
    coverImage: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=400&h=400&fit=crop',
    category: '文化历史',
    episodes: [
      {
        id: uuidv4(),
        title: '二十世纪的巴黎知识分子圈',
        description: '萨特、波伏娃、加缪……那个黄金时代的巴黎，是如何成为世界思想中心的？',
        duration: 4320,
        publishedAt: '2026-06-20',
        audioUrl: 'https://example.com/audio/ep8.mp3',
      },
      {
        id: uuidv4(),
        title: '丝绸之路的前世今生',
        description: '从张骞出使西域到今天的一带一路，这条古老的商路见证了多少文明的交融。',
        duration: 3960,
        publishedAt: '2026-06-13',
        audioUrl: 'https://example.com/audio/ep9.mp3',
      },
      {
        id: uuidv4(),
        title: '中国近代翻译史漫谈',
        description: '严复、林纾、傅雷……那些改变了中国的翻译家们。',
        duration: 3600,
        publishedAt: '2026-06-06',
        audioUrl: 'https://example.com/audio/ep10.mp3',
      },
      {
        id: uuidv4(),
        title: '日本战后文学的黄金时代',
        description: '三岛由纪夫、川端康成、太宰治，他们的作品如何影响了世界文学。',
        duration: 3240,
        publishedAt: '2026-05-30',
        audioUrl: 'https://example.com/audio/ep11.mp3',
      },
    ],
  },
  {
    title: '疯投圈',
    author: '黄海 & Rio',
    description: '专注于消费和科技领域的投资播客，两位投资人从行业视角出发，深度剖析新消费品牌的崛起与衰落。',
    coverImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
    category: '商业投资',
    episodes: [
      {
        id: uuidv4(),
        title: '新消费品牌的生死存亡',
        description: '过去三年，大量新消费品牌经历了从爆红到沉寂的过程，问题到底出在哪里？',
        duration: 3420,
        publishedAt: '2026-06-17',
        audioUrl: 'https://example.com/audio/ep12.mp3',
      },
      {
        id: uuidv4(),
        title: '中国咖啡市场的终局之战',
        description: '瑞幸、库迪、Manner、星巴克，谁能笑到最后？',
        duration: 3060,
        publishedAt: '2026-06-10',
        audioUrl: 'https://example.com/audio/ep13.mp3',
      },
      {
        id: uuidv4(),
        title: '跨境电商的下一个十年',
        description: '从 Shein 到 Temu，中国跨境电商正在重塑全球零售格局。',
        duration: 2880,
        publishedAt: '2026-06-03',
        audioUrl: 'https://example.com/audio/ep14.mp3',
      },
    ],
  },
  {
    title: '知行小酒馆',
    author: '有知有行',
    description: '一档关于投资、理财和个人成长的播客节目。用轻松的方式，聊严肃的话题。',
    coverImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=400&fit=crop',
    category: '投资理财',
    episodes: [
      {
        id: uuidv4(),
        title: '普通人如何做好资产配置？',
        description: '没有专业的金融知识，也能做好理财。聊聊适合普通人的资产配置方法。',
        duration: 3240,
        publishedAt: '2026-06-19',
        audioUrl: 'https://example.com/audio/ep15.mp3',
      },
      {
        id: uuidv4(),
        title: '基金定投到底是不是骗局？',
        description: '基金定投被很多人奉为圭臬，也有人说是营销骗局。我们用数据说话。',
        duration: 3600,
        publishedAt: '2026-06-12',
        audioUrl: 'https://example.com/audio/ep16.mp3',
      },
      {
        id: uuidv4(),
        title: '保险怎么买才不被坑？',
        description: '市面上的保险产品五花八门，普通人如何挑选适合自己的？',
        duration: 3060,
        publishedAt: '2026-06-05',
        audioUrl: 'https://example.com/audio/ep17.mp3',
      },
      {
        id: uuidv4(),
        title: '投资中的心理学陷阱',
        description: '为什么我们总是追涨杀跌？聊聊投资中常见的认知偏差。',
        duration: 2700,
        publishedAt: '2026-05-29',
        audioUrl: 'https://example.com/audio/ep18.mp3',
      },
      {
        id: uuidv4(),
        title: '三十岁前，我建议你存下第一桶金',
        description: '第一桶金为什么重要？如何存下第一桶金？',
        duration: 2880,
        publishedAt: '2026-05-22',
        audioUrl: 'https://example.com/audio/ep19.mp3',
      },
    ],
  },
  {
    title: '随机波动',
    author: '三位女性媒体人',
    description: '一档由三位女性媒体人创办的播客节目，以女性视角观察和讨论这个世界。',
    coverImage: 'https://images.unsplash.com/photo-1528283648649-33347faa5d9e?w=400&h=400&fit=crop',
    category: '社会文化',
    episodes: [
      {
        id: uuidv4(),
        title: '职场中的性别困境',
        description: '从招聘歧视到生育压力，职场女性面临哪些看不见的障碍？',
        duration: 3600,
        publishedAt: '2026-06-16',
        audioUrl: 'https://example.com/audio/ep20.mp3',
      },
      {
        id: uuidv4(),
        title: '女性友谊的力量',
        description: '被低估的女性友谊，是如何支撑我们走过人生低谷的？',
        duration: 3240,
        publishedAt: '2026-06-09',
        audioUrl: 'https://example.com/audio/ep21.mp3',
      },
      {
        id: uuidv4(),
        title: '母职不是理所当然',
        description: '成为母亲意味着什么？我们需要重新审视母职这个话题。',
        duration: 3420,
        publishedAt: '2026-06-02',
        audioUrl: 'https://example.com/audio/ep22.mp3',
      },
    ],
  },
]

seedPodcasts.forEach((podcast) => {
  const id = uuidv4()
  podcasts.set(id, { ...podcast, id })
})

const seedPlaylist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '我的收藏',
  podcastIds: [...podcasts.keys()].slice(0, 3),
}

const now = new Date().toISOString()
const firstPlaylistId = uuidv4()
playlists.set(firstPlaylistId, {
  ...seedPlaylist,
  id: firstPlaylistId,
  createdAt: now,
  updatedAt: now,
})

const firstPodcastId = [...podcasts.keys()][0]
const firstEpisodeId = podcasts.get(firstPodcastId)!.episodes[0].id

const seedNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
  podcastId: firstPodcastId,
  episodeId: firstEpisodeId,
  content: '这期节目讲得太好了！关于 AI 和编程的关系，让我重新思考了自己的职业规划。特别是主播提到的"学会提问比学会写代码更重要"这个观点，非常有启发。',
  rating: 5,
}

const firstNoteId = uuidv4()
notes.set(firstNoteId, {
  ...seedNote,
  id: firstNoteId,
  createdAt: now,
  updatedAt: now,
})

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.get('/api/podcasts', (req: Request, res: Response): void => {
  const search = req.query.search as string | undefined
  let result = [...podcasts.values()]

  if (search && search.trim()) {
    const query = search.trim().toLowerCase()
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.author.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query),
    )
  }

  res.status(200).json({
    success: true,
    data: result.map(({ episodes, ...podcast }) => podcast),
  })
})

app.get('/api/podcasts/:id', (req: Request, res: Response): void => {
  const podcast = podcasts.get(req.params.id)

  if (!podcast) {
    res.status(404).json({ success: false, error: 'Podcast not found' })
    return
  }

  res.status(200).json({ success: true, data: podcast })
})

app.get('/api/playlists', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: [...playlists.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  })
})

app.post('/api/playlists', (req: Request, res: Response): void => {
  const { name } = req.body as { name?: string }

  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: 'Name is required' })
    return
  }

  const timestamp = new Date().toISOString()
  const id = uuidv4()
  const playlist: Playlist = {
    id,
    name: name.trim(),
    podcastIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  playlists.set(id, playlist)
  res.status(201).json({ success: true, data: playlist })
})

app.put('/api/playlists/:id', (req: Request, res: Response): void => {
  const playlist = playlists.get(req.params.id)

  if (!playlist) {
    res.status(404).json({ success: false, error: 'Playlist not found' })
    return
  }

  const { name, podcastIds } = req.body as { name?: string; podcastIds?: string[] }

  if (name !== undefined && !name.trim()) {
    res.status(400).json({ success: false, error: 'Name cannot be empty' })
    return
  }

  if (podcastIds !== undefined && !Array.isArray(podcastIds)) {
    res.status(400).json({ success: false, error: 'podcastIds must be an array' })
    return
  }

  const updated: Playlist = {
    ...playlist,
    name: name?.trim() ?? playlist.name,
    podcastIds: podcastIds ?? playlist.podcastIds,
    updatedAt: new Date().toISOString(),
  }

  playlists.set(playlist.id, updated)
  res.status(200).json({ success: true, data: updated })
})

app.delete('/api/playlists/:id', (req: Request, res: Response): void => {
  const deleted = playlists.delete(req.params.id)

  if (!deleted) {
    res.status(404).json({ success: false, error: 'Playlist not found' })
    return
  }

  res.status(200).json({ success: true, message: 'Playlist deleted' })
})

app.get('/api/notes', (req: Request, res: Response): void => {
  const podcastId = req.query.podcastId as string | undefined

  let result = [...notes.values()]

  if (podcastId) {
    result = result.filter((n) => n.podcastId === podcastId)
  }

  result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  res.status(200).json({ success: true, data: result })
})

app.post('/api/notes', (req: Request, res: Response): void => {
  const body = req.body as Partial<Note>
  const { podcastId, content, rating } = body

  if (!podcastId) {
    res.status(400).json({ success: false, error: 'podcastId is required' })
    return
  }

  if (!content || !content.trim()) {
    res.status(400).json({ success: false, error: 'content is required' })
    return
  }

  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    res.status(400).json({ success: false, error: 'rating must be a number between 1 and 5' })
    return
  }

  const timestamp = new Date().toISOString()
  const id = uuidv4()
  const note: Note = {
    id,
    podcastId,
    episodeId: body.episodeId,
    content: content.trim(),
    rating: rating ?? 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  notes.set(id, note)
  res.status(201).json({ success: true, data: note })
})

app.put('/api/notes/:id', (req: Request, res: Response): void => {
  const note = notes.get(req.params.id)

  if (!note) {
    res.status(404).json({ success: false, error: 'Note not found' })
    return
  }

  const body = req.body as Partial<Note>
  const { content, rating } = body

  if (content !== undefined && !content.trim()) {
    res.status(400).json({ success: false, error: 'content cannot be empty' })
    return
  }

  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    res.status(400).json({ success: false, error: 'rating must be a number between 1 and 5' })
    return
  }

  const updated: Note = {
    ...note,
    podcastId: body.podcastId ?? note.podcastId,
    episodeId: body.episodeId !== undefined ? body.episodeId : note.episodeId,
    content: content?.trim() ?? note.content,
    rating: rating ?? note.rating,
    updatedAt: new Date().toISOString(),
  }

  notes.set(note.id, updated)
  res.status(200).json({ success: true, data: updated })
})

app.delete('/api/notes/:id', (req: Request, res: Response): void => {
  const deleted = notes.delete(req.params.id)

  if (!deleted) {
    res.status(404).json({ success: false, error: 'Note not found' })
    return
  }

  res.status(200).json({ success: true, message: 'Note deleted' })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

const PORT = 3001

app.listen(PORT, () => {
  console.log(`🚀 Server ready on http://localhost:${PORT}`)
  console.log(`📻 ${podcasts.size} podcasts seeded`)
  console.log(`📋 ${playlists.size} playlists seeded`)
  console.log(`📝 ${notes.size} notes seeded`)
})

export default app
