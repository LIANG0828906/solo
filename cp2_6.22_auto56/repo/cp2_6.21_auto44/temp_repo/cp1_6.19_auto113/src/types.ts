export type EmotionType = 'anger' | 'calm' | 'achievement' | 'frustration' | 'excitement'

export interface EmotionBlock {
  id: string
  type: EmotionType
}

export interface EmotionConfig {
  type: EmotionType
  color: string
  label: string
  labelCN: string
}

export const EMOTIONS: EmotionConfig[] = [
  { type: 'anger', color: '#E74C3C', label: 'Anger', labelCN: '生气' },
  { type: 'calm', color: '#3498DB', label: 'Calm', labelCN: '平静' },
  { type: 'achievement', color: '#2ECC71', label: 'Achievement', labelCN: '成就' },
  { type: 'frustration', color: '#9B59B6', label: 'Frustration', labelCN: '挫败' },
  { type: 'excitement', color: '#F39C12', label: 'Excitement', labelCN: '兴奋' },
]

export const getEmotionConfig = (type: EmotionType): EmotionConfig => {
  return EMOTIONS.find(e => e.type === type)!
}
