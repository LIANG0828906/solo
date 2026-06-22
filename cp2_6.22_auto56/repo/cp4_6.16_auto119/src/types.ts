export interface MoodRecord {
  id: string
  date: string
  moodType: MoodType
  text: string
  createdAt: number
  updatedAt: number
}

export type MoodType = 
  | 'happy'
  | 'sad'
  | 'angry'
  | 'excited'
  | 'calm'
  | 'anxious'
  | 'grateful'
  | 'tired'
  | 'neutral'

export interface MoodConfig {
  type: MoodType
  color: string
  emoji: string
  label: string
}

export interface ColorPalette {
  primary: string
  secondary: string
  background: string
  accent: string
}

export interface MoodStore {
  records: MoodRecord[]
  selectedDate: string
  isLoading: boolean
  setRecords: (records: MoodRecord[]) => void
  addRecord: (record: MoodRecord) => void
  updateRecord: (record: MoodRecord) => void
  deleteRecord: (id: string) => void
  setSelectedDate: (date: string) => void
  getRecordByDate: (date: string) => MoodRecord | undefined
}

export const MOOD_CONFIGS: MoodConfig[] = [
  { type: 'happy', color: '#FFD93D', emoji: '😊', label: '快乐' },
  { type: 'sad', color: '#4D96FF', emoji: '😢', label: '悲伤' },
  { type: 'angry', color: '#FF6B6B', emoji: '😠', label: '愤怒' },
  { type: 'excited', color: '#FF9F45', emoji: '🤩', label: '兴奋' },
  { type: 'calm', color: '#6BCB77', emoji: '😌', label: '平静' },
  { type: 'anxious', color: '#9B59B6', emoji: '😰', label: '焦虑' },
  { type: 'grateful', color: '#F7B731', emoji: '🙏', label: '感恩' },
  { type: 'tired', color: '#8395A7', emoji: '😴', label: '疲惫' },
  { type: 'neutral', color: '#A4B0BE', emoji: '😐', label: '一般' },
]

export const MOOD_MAP: Record<MoodType, MoodConfig> = MOOD_CONFIGS.reduce(
  (acc, config) => {
    acc[config.type] = config
    return acc
  },
  {} as Record<MoodType, MoodConfig>
)
