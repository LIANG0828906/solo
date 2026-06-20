import { create } from 'zustand'

export type Mood = 'happy' | 'calm' | 'sad' | 'nostalgic' | 'energetic'

export interface Song {
  id: string
  title: string
  artist: string
  coverUrl: string
  lyricSnippet: string
  frequency: number
}

export interface DiaryEntry {
  id: string
  date: string
  mood: Mood
  song: Song
  note: string
}

export interface WeeklyCapsule {
  startDate: string
  endDate: string
  entries: DiaryEntry[]
  moodCounts: Record<Mood, number>
}

interface DiaryState {
  entries: DiaryEntry[]
  songs: Song[]
  weeklyCapsule: WeeklyCapsule | null
  searchKeyword: string
  latestEntryId: string | null
  addEntry: (entry: Omit<DiaryEntry, 'id'>) => void
  deleteEntry: (id: string) => void
  setSearchKeyword: (kw: string) => void
  filterSongs: () => Song[]
  generateWeeklyCapsule: () => WeeklyCapsule | null
  clearLatestEntryId: () => void
}

const PRESET_SONGS: Song[] = [
  { id: 's1', title: '晴天', artist: '周杰伦', coverUrl: 'https://picsum.photos/seed/song1/200', lyricSnippet: '故事的小黄花\n从出生那年就飘着', frequency: 329.63 },
  { id: 's2', title: '起风了', artist: '买辣椒也用券', coverUrl: 'https://picsum.photos/seed/song2/200', lyricSnippet: '这一路上走走停停\n顺着少年漂流的痕迹', frequency: 392.00 },
  { id: 's3', title: '海阔天空', artist: 'Beyond', coverUrl: 'https://picsum.photos/seed/song3/200', lyricSnippet: '原谅我这一生不羁放纵爱自由', frequency: 440.00 },
  { id: 's4', title: '夜曲', artist: '周杰伦', coverUrl: 'https://picsum.photos/seed/song4/200', lyricSnippet: '一群嗜血的蚂蚁被腐肉所吸引', frequency: 349.23 },
  { id: 's5', title: '光年之外', artist: 'G.E.M.邓紫棋', coverUrl: 'https://picsum.photos/seed/song5/200', lyricSnippet: '感受停在我发端的指尖', frequency: 523.25 },
  { id: 's6', title: '稻香', artist: '周杰伦', coverUrl: 'https://picsum.photos/seed/song6/200', lyricSnippet: '随着稻香河流继续奔跑', frequency: 293.66 },
  { id: 's7', title: '富士山下', artist: '陈奕迅', coverUrl: 'https://picsum.photos/seed/song7/200', lyricSnippet: '拦路雨偏似雪花 饮泣的你冻吗', frequency: 311.13 },
  { id: 's8', title: '演员', artist: '薛之谦', coverUrl: 'https://picsum.photos/seed/song8/200', lyricSnippet: '简单点 说话的方式简单点', frequency: 369.99 },
  { id: 's9', title: '小幸运', artist: '田馥甄', coverUrl: 'https://picsum.photos/seed/song9/200', lyricSnippet: '我听见雨滴落在青青草地', frequency: 415.30 },
  { id: 's10', title: '追光者', artist: '岑宁儿', coverUrl: 'https://picsum.photos/seed/song10/200', lyricSnippet: '如果说你是海上的烟火', frequency: 493.88 },
  { id: 's11', title: '匆匆那年', artist: '王菲', coverUrl: 'https://picsum.photos/seed/song11/200', lyricSnippet: '匆匆那年我们 究竟说了几遍', frequency: 277.18 },
  { id: 's12', title: '平凡之路', artist: '朴树', coverUrl: 'https://picsum.photos/seed/song12/200', lyricSnippet: '我曾经跨过山和大海', frequency: 329.63 },
  { id: 's13', title: '七里香', artist: '周杰伦', coverUrl: 'https://picsum.photos/seed/song13/200', lyricSnippet: '窗外的麻雀 在电线杆上多嘴', frequency: 392.00 },
  { id: 's14', title: '修炼爱情', artist: '林俊杰', coverUrl: 'https://picsum.photos/seed/song14/200', lyricSnippet: '修炼爱情的心酸', frequency: 440.00 },
  { id: 's15', title: '后来', artist: '刘若英', coverUrl: 'https://picsum.photos/seed/song15/200', lyricSnippet: '后来 我总算学会了如何去爱', frequency: 349.23 },
  { id: 's16', title: '遇见', artist: '孙燕姿', coverUrl: 'https://picsum.photos/seed/song16/200', lyricSnippet: '我听见风来自地铁和人海', frequency: 523.25 },
  { id: 's17', title: '夏天的风', artist: '温岚', coverUrl: 'https://picsum.photos/seed/song17/200', lyricSnippet: '夏天的风 正暖暖吹过', frequency: 293.66 },
  { id: 's18', title: '蒲公英的约定', artist: '周杰伦', coverUrl: 'https://picsum.photos/seed/song18/200', lyricSnippet: '小学篱笆旁的蒲公英', frequency: 311.13 },
  { id: 's19', title: '成都', artist: '赵雷', coverUrl: 'https://picsum.photos/seed/song19/200', lyricSnippet: '让我掉下眼泪的 不止昨夜的酒', frequency: 369.99 },
  { id: 's20', title: '蓝莲花', artist: '许巍', coverUrl: 'https://picsum.photos/seed/song20/200', lyricSnippet: '没有什么能够阻挡\n你对自由的向往', frequency: 415.30 },
]

const SEED_ENTRIES: DiaryEntry[] = [
  { id: 'e1', date: getDateOffset(-1), mood: 'happy', song: PRESET_SONGS[0], note: '今天阳光很好，和朋友一起出去散步了' },
  { id: 'e2', date: getDateOffset(-2), mood: 'calm', song: PRESET_SONGS[5], note: '一杯咖啡，一本书，安静的下午' },
  { id: 'e3', date: getDateOffset(-3), mood: 'nostalgic', song: PRESET_SONGS[14], note: '突然想起高中时候的那些事' },
  { id: 'e4', date: getDateOffset(-4), mood: 'sad', song: PRESET_SONGS[10], note: '有些遗憾，只能藏在心里' },
  { id: 'e5', date: getDateOffset(-5), mood: 'energetic', song: PRESET_SONGS[2], note: '项目终于完成了，感觉整个人都轻松了' },
  { id: 'e6', date: getDateOffset(-6), mood: 'happy', song: PRESET_SONGS[16], note: '夏天的风，吹动了裙摆和心情' },
  { id: 'e7', date: getDateOffset(-7), mood: 'calm', song: PRESET_SONGS[19], note: '开车在路上，蓝莲花一直在循环' },
]

function getDateOffset(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAgo)
  return d.toISOString().slice(0, 10)
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getWeekRange(today: Date): { start: string; end: string } {
  const day = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: formatDate(monday), end: formatDate(sunday) }
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: SEED_ENTRIES,
  songs: PRESET_SONGS,
  weeklyCapsule: null,
  searchKeyword: '',
  latestEntryId: null,

  addEntry: (entry) => {
    const id = `e${Date.now()}`
    set((state) => ({
      entries: [{ ...entry, id }, ...state.entries].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
      latestEntryId: id,
    }))
  },

  deleteEntry: (id) => {
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }))
  },

  setSearchKeyword: (kw) => {
    set({ searchKeyword: kw })
  },

  filterSongs: () => {
    const { songs, searchKeyword } = get()
    const kw = searchKeyword.trim().toLowerCase()
    if (!kw) return songs
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(kw) ||
        s.artist.toLowerCase().includes(kw),
    )
  },

  generateWeeklyCapsule: () => {
    const { entries } = get()
    const { start, end } = getWeekRange(new Date())
    const weekEntries = entries.filter((e) => e.date >= start && e.date <= end)
    const moodCounts: Record<Mood, number> = {
      happy: 0, calm: 0, sad: 0, nostalgic: 0, energetic: 0,
    }
    weekEntries.forEach((e) => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1
    })
    const capsule: WeeklyCapsule = {
      startDate: start,
      endDate: end,
      entries: weekEntries,
      moodCounts,
    }
    set({ weeklyCapsule: capsule })
    return capsule
  },

  clearLatestEntryId: () => {
    set({ latestEntryId: null })
  },
}))
