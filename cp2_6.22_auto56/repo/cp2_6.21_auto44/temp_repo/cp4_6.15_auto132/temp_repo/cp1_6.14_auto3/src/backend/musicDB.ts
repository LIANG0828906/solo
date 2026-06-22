export type EmotionTag =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'calm'
  | 'excited'
  | 'romantic'
  | 'tired'
  | 'anxious'

export interface Song {
  id: string
  title: string
  artist: string
  album: string
  cover: string
  previewUrl: string
  duration: number
  emotions: EmotionTag[]
}

export const EMOTION_LABELS: Record<EmotionTag, { cn: string; emoji: string; color: string }> = {
  happy:     { cn: '开心',  emoji: '😊', color: '#FFD93D' },
  sad:       { cn: '悲伤',  emoji: '😢', color: '#6EC1E4' },
  angry:     { cn: '愤怒',  emoji: '😠', color: '#FF4757' },
  calm:      { cn: '平静',  emoji: '😌', color: '#7BED9F' },
  excited:   { cn: '兴奋',  emoji: '🤩', color: '#FF6B9D' },
  romantic:  { cn: '浪漫',  emoji: '🥰', color: '#C56CF0' },
  tired:     { cn: '疲惫',  emoji: '😴', color: '#A4B0BE' },
  anxious:   { cn: '焦虑',  emoji: '😰', color: '#FFA502' }
}

export const ALL_EMOTIONS: EmotionTag[] = [
  'happy', 'sad', 'angry', 'calm', 'excited', 'romantic', 'tired', 'anxious'
]

const COVERS = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&q=80',
  'https://images.unsplash.com/photo-1446057032654-9d8885db76c6?w=400&q=80',
  'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=400&q=80',
  'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
  'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&q=80',
  'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&q=80',
  'https://images.unsplash.com/photo-1501612780327-45045538702b?w=400&q=80'
]

const buildPreview = (seed: string) =>
  `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${seed}.mp3`

const SONGS: Song[] = [
  { id: 's01', title: 'Sunshine Highway',   artist: '霓虹旅人',   album: '光之旅',     cover: COVERS[0],  previewUrl: buildPreview('1'),  duration: 225, emotions: ['happy', 'excited'] },
  { id: 's02', title: 'Midnight Drive',     artist: 'Lo-Fi 宇宙', album: '夜航',       cover: COVERS[1],  previewUrl: buildPreview('2'),  duration: 198, emotions: ['calm', 'tired'] },
  { id: 's03', title: 'Electric Dreams',    artist: 'SynthWave X',album: '电压',       cover: COVERS[2],  previewUrl: buildPreview('3'),  duration: 267, emotions: ['excited', 'romantic'] },
  { id: 's04', title: '雨后的街',           artist: '陈暮雪',     album: '雨季',       cover: COVERS[3],  previewUrl: buildPreview('4'),  duration: 243, emotions: ['sad', 'calm'] },
  { id: 's05', title: 'Breaking Storm',     artist: 'Iron Pulse', album: '雷暴',       cover: COVERS[4],  previewUrl: buildPreview('5'),  duration: 312, emotions: ['angry', 'excited'] },
  { id: 's06', title: 'Candlelight Waltz',  artist: '夜曲乐团',   album: '烛光',       cover: COVERS[5],  previewUrl: buildPreview('6'),  duration: 278, emotions: ['romantic', 'calm'] },
  { id: 's07', title: 'Ocean Breeze',       artist: 'Calm Labs',  album: '潮汐',       cover: COVERS[6],  previewUrl: buildPreview('7'),  duration: 301, emotions: ['calm', 'anxious'] },
  { id: 's08', title: '霓虹狂欢夜',         artist: 'DJ ECHO',    album: '霓虹',       cover: COVERS[7],  previewUrl: buildPreview('8'),  duration: 234, emotions: ['happy', 'excited'] },
  { id: 's09', title: 'Floating Away',      artist: 'Dreamer',    album: '漂浮',       cover: COVERS[8],  previewUrl: buildPreview('9'),  duration: 289, emotions: ['tired', 'calm'] },
  { id: 's10', title: 'First Kiss',         artist: '苏糖',       album: '初恋',       cover: COVERS[9],  previewUrl: buildPreview('10'), duration: 215, emotions: ['romantic', 'happy'] },
  { id: 's11', title: 'Tears in Silence',   artist: 'Void',       album: '静默',       cover: COVERS[10], previewUrl: buildPreview('11'), duration: 256, emotions: ['sad', 'anxious'] },
  { id: 's12', title: 'Thunder Heart',      artist: '狂想者',     album: '雷霆',       cover: COVERS[11], previewUrl: buildPreview('12'), duration: 287, emotions: ['angry', 'excited'] },
  { id: 's13', title: 'Morning Coffee',     artist: 'Jazz Cat',   album: '清晨',       cover: COVERS[0],  previewUrl: buildPreview('1'),  duration: 198, emotions: ['happy', 'calm'] },
  { id: 's14', title: 'Deep Breath',        artist: '冥想实验室', album: '呼吸',       cover: COVERS[1],  previewUrl: buildPreview('2'),  duration: 421, emotions: ['calm', 'anxious', 'tired'] },
  { id: 's15', title: 'Love in the Air',    artist: '浪漫电波',   album: '信号',       cover: COVERS[2],  previewUrl: buildPreview('3'),  duration: 230, emotions: ['romantic', 'happy'] },
  { id: 's16', title: 'Endless Rain',       artist: '灰色花园',   album: '雨幕',       cover: COVERS[3],  previewUrl: buildPreview('4'),  duration: 342, emotions: ['sad', 'tired'] },
  { id: 's17', title: 'Rise Up',            artist: 'Phoenix',    album: '涅槃',       cover: COVERS[4],  previewUrl: buildPreview('5'),  duration: 265, emotions: ['excited', 'angry'] },
  { id: 's18', title: 'Starlight Serenade', artist: '银河弦乐',   album: '星河',       cover: COVERS[5],  previewUrl: buildPreview('6'),  duration: 298, emotions: ['romantic', 'calm'] },
  { id: 's19', title: 'Summer Pop',         artist: '阳光乐队',   album: '夏日',       cover: COVERS[6],  previewUrl: buildPreview('7'),  duration: 211, emotions: ['happy', 'excited'] },
  { id: 's20', title: 'Quiet Mind',         artist: '静思',       album: '冥想',       cover: COVERS[7],  previewUrl: buildPreview('8'),  duration: 356, emotions: ['calm', 'tired', 'anxious'] }
]

export function queryByEmotions(tags: EmotionTag[], limit = 8): Song[] {
  if (!tags || tags.length === 0) {
    return SONGS.slice(0, limit)
  }
  const scored = SONGS.map(song => {
    const score = song.emotions.reduce((acc, e) => acc + (tags.includes(e) ? 2 : 0), 0)
    return { song, score: score + Math.random() * 0.5 }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(x => x.song)
}

export function findSongById(id: string): Song | undefined {
  return SONGS.find(s => s.id === id)
}

export function allSongs(): Song[] {
  return SONGS
}
