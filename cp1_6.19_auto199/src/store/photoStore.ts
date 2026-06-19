import { create } from 'zustand'

export type ColorFilter = 'all' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'gray'

export type EmojiType = 'surprised' | 'moved' | 'funny' | 'peaceful' | 'happy'

export interface Photo {
  id: string
  url: string
  thumbnailUrl: string
  width: number
  height: number
  dominantColor: {
    h: number
    s: number
    l: number
    hex: string
    name: ColorFilter
  }
  diary: string
  username: string
  createdAt: string
  emojiCounts: Record<EmojiType, number>
  lightLeakCount: number
  lastLightLeakDate: string | null
}

interface PhotoState {
  photos: Photo[]
  activeFilter: ColorFilter
  selectedPhotoId: string | null
  isModalOpen: boolean
  isUploadOpen: boolean

  setFilter: (filter: ColorFilter) => void
  selectPhoto: (id: string | null) => void
  openModal: () => void
  closeModal: () => void
  openUpload: () => void
  closeUpload: () => void
  addPhoto: (photo: Photo) => void
  updateDiary: (id: string, diary: string) => void
  addEmoji: (id: string, type: EmojiType) => void
  triggerLightLeak: (id: string) => boolean
  getFilteredPhotos: () => Photo[]
  getFilterName: () => string
}

const COLOR_NAMES: Record<ColorFilter, string> = {
  all: '全部',
  red: '红色',
  orange: '橙色',
  yellow: '黄色',
  green: '绿色',
  blue: '蓝色',
  purple: '紫色',
  pink: '粉色',
  gray: '灰色',
}

const generateMockPhotos = (): Photo[] => {
  const colors: ColorFilter[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray']
  const hexColors: Record<ColorFilter, string> = {
    all: '#4A3728',
    red: '#D32F2F',
    orange: '#FF6F00',
    yellow: '#FBC02D',
    green: '#388E3C',
    blue: '#1976D2',
    purple: '#7B1FA2',
    pink: '#C2185B',
    gray: '#616161',
  }
  const diaries = [
    '傍晚的阳光穿过弄堂，在老墙上留下金色的斑纹。',
    '雨后的街道映着霓虹，像一幅流动的油画。',
    '清晨的薄雾中，老人的背影显得格外宁静。',
    '午后三点的阳光，穿过树叶的缝隙洒在地面上。',
    '街角的咖啡店，暖黄色的灯光总是让人感到温暖。',
    '孩子们的笑声在巷子里回荡，简单而纯粹的快乐。',
  ]
  const usernames = ['光影猎人', '街角诗人', '胶片行者', '时光记录者', '城市漫游者']

  const photos: Photo[] = []
  for (let i = 0; i < 20; i++) {
    const color = colors[i % colors.length]
    const w = 240
    const h = 240 + Math.floor(Math.random() * 200)
    const seed = 1000 + i
    photos.push({
      id: `mock-${i}`,
      url: `https://picsum.photos/seed/${seed}/800/${Math.round(800 * h / w)}`,
      thumbnailUrl: `https://picsum.photos/seed/${seed}/240/${h}`,
      width: w,
      height: h,
      dominantColor: {
        h: (i * 45) % 360,
        s: 60 + Math.random() * 20,
        l: 40 + Math.random() * 20,
        hex: hexColors[color],
        name: color,
      },
      diary: diaries[i % diaries.length],
      username: usernames[i % usernames.length],
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      emojiCounts: {
        surprised: Math.floor(Math.random() * 10),
        moved: Math.floor(Math.random() * 10),
        funny: Math.floor(Math.random() * 10),
        peaceful: Math.floor(Math.random() * 10),
        happy: Math.floor(Math.random() * 10),
      },
      lightLeakCount: Math.floor(Math.random() * 5),
      lastLightLeakDate: null,
    })
  }
  return photos
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  photos: generateMockPhotos(),
  activeFilter: 'all',
  selectedPhotoId: null,
  isModalOpen: false,
  isUploadOpen: false,

  setFilter: (filter) => set({ activeFilter: filter }),

  selectPhoto: (id) => set({ selectedPhotoId: id }),

  openModal: () => set({ isModalOpen: true }),

  closeModal: () => set({ isModalOpen: false, selectedPhotoId: null }),

  openUpload: () => set({ isUploadOpen: true }),

  closeUpload: () => set({ isUploadOpen: false }),

  addPhoto: (photo) => set((state) => ({ photos: [photo, ...state.photos] })),

  updateDiary: (id, diary) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? { ...p, diary } : p)),
    })),

  addEmoji: (id, type) =>
    set((state) => ({
      photos: state.photos.map((p) =>
        p.id === id
          ? { ...p, emojiCounts: { ...p.emojiCounts, [type]: p.emojiCounts[type] + 1 } }
          : p
      ),
    })),

  triggerLightLeak: (id) => {
    const today = new Date().toDateString()
    const photo = get().photos.find((p) => p.id === id)
    if (!photo || photo.lastLightLeakDate === today) {
      return false
    }
    set((state) => ({
      photos: state.photos.map((p) =>
        p.id === id
          ? { ...p, lightLeakCount: p.lightLeakCount + 1, lastLightLeakDate: today }
          : p
      ),
    }))
    return true
  },

  getFilteredPhotos: () => {
    const { photos, activeFilter } = get()
    if (activeFilter === 'all') return photos
    return photos.filter((p) => p.dominantColor.name === activeFilter)
  },

  getFilterName: () => {
    return COLOR_NAMES[get().activeFilter]
  },
}))
