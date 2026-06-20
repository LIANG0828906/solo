export type MoodType = 'happy' | 'calm' | 'sad' | 'angry' | 'anxious' | 'tired'

export interface DiaryEntry {
  id: string
  date: string
  mood: MoodType
  intensity: number
  description: string
}

export const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; value: number }> = {
  happy: { emoji: '😊', label: '快乐', value: 6 },
  calm: { emoji: '😌', label: '平静', value: 5 },
  sad: { emoji: '😢', label: '悲伤', value: 3 },
  angry: { emoji: '😡', label: '愤怒', value: 2 },
  anxious: { emoji: '😰', label: '焦虑', value: 1 },
  tired: { emoji: '😩', label: '疲惫', value: 4 },
}

const DESCRIPTIONS = [
  '今天阳光明媚，心情格外舒畅。',
  '工作压力有点大，需要放松一下。',
  '和朋友聚了聚，聊得很开心。',
  '读了一本好书，内心很平静。',
  '有些事情让我感到焦虑不安。',
  '身体有点累，需要好好休息。',
  '完成了一个重要的项目，很有成就感。',
  '遇到了一些小挫折，但我会坚持。',
  '享受了一顿美味的晚餐，心情愉悦。',
  '思考了很多关于未来的事情。',
  '家人陪伴的时光总是那么温馨。',
  '运动了一会儿，感觉好多了。',
]

const MOODS: MoodType[] = ['happy', 'calm', 'sad', 'angry', 'anxious', 'tired']

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function generateMockData(count: number = 30): DiaryEntry[] {
  const entries: DiaryEntry[] = []
  const today = new Date()

  for (let i = 0; i < count; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = formatDate(date)
    const mood = MOODS[Math.floor(Math.random() * MOODS.length)]
    const intensity = Math.floor(Math.random() * 5) + 1
    const description = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)]

    entries.push({
      id: `entry-${dateStr}`,
      date: dateStr,
      mood,
      intensity,
      description,
    })
  }

  return entries
}

export function calculateMoodScore(entry: DiaryEntry): number {
  return MOOD_CONFIG[entry.mood].value * entry.intensity
}
