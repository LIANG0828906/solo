export type EmotionCategory = 'warm' | 'cool' | 'neutral'

export type AnimationType = 'pulse' | 'float' | 'breathe' | 'flow' | null

export interface WordBlock {
  id: string
  text: string
  x: number
  y: number
  color: string
  fontSize: number
  fontWeight: number
  animation: AnimationType
  emotionCategory: EmotionCategory
}

export interface CanvasTransform {
  scale: number
  rotation: number
  offsetX: number
  offsetY: number
}

export interface PresetWord {
  text: string
  category: EmotionCategory
}

export const EMOTION_COLORS: Record<EmotionCategory, string> = {
  warm: '#F3A683',
  cool: '#78D1E1',
  neutral: '#A5B1C2',
}

export const PRESET_WORDS: PresetWord[] = [
  { text: '涟漪', category: 'cool' },
  { text: '温存', category: 'warm' },
  { text: '风暴', category: 'warm' },
  { text: '静谧', category: 'cool' },
  { text: '微光', category: 'neutral' },
  { text: '潮汐', category: 'cool' },
  { text: '暖阳', category: 'warm' },
  { text: '沉吟', category: 'neutral' },
  { text: '破晓', category: 'warm' },
  { text: '深渊', category: 'cool' },
  { text: '迷雾', category: 'neutral' },
  { text: '悸动', category: 'warm' },
  { text: '流淌', category: 'cool' },
  { text: '静默', category: 'neutral' },
  { text: '炽烈', category: 'warm' },
  { text: '幽蓝', category: 'cool' },
  { text: '恍惚', category: 'neutral' },
  { text: '缱绻', category: 'warm' },
  { text: '澄澈', category: 'cool' },
  { text: '空濛', category: 'neutral' },
]
