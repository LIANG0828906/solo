import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import { v4 as uuidv4 } from 'uuid'

export interface Writing {
  id: string
  date: string
  content: string
  wordCount: number
  createdAt: number
  updatedAt: number
}

export interface Idea {
  id: string
  content: string
  gradient: string
  createdAt: number
}

interface WritingState {
  writings: Record<string, Writing>
  ideas: Idea[]
  currentDate: string
  isLoaded: boolean
  loadData: () => Promise<void>
  saveTodayWriting: (content: string) => Promise<void>
  getTodayWriting: () => Writing | null
  addIdea: (content: string) => Promise<void>
  deleteIdea: (id: string) => Promise<void>
  appendIdeaToWriting: (ideaId: string) => Promise<void>
  getMonthTotalWords: () => number
  getStreakDays: () => number
  getWeekData: () => { date: string; words: number; dayName: string }[]
  exportAllWritings: () => Promise<string>
}

const GRADIENTS = [
  'linear-gradient(180deg, #FF6B6B, #FFE66D)',
  'linear-gradient(180deg, #4ECDC4, #44A08D)',
  'linear-gradient(180deg, #667eea, #764ba2)',
  'linear-gradient(180deg, #f093fb, #f5576c)',
  'linear-gradient(180deg, #4facfe, #00f2fe)',
  'linear-gradient(180deg, #43e97b, #38f9d7)',
  'linear-gradient(180deg, #fa709a, #fee140)',
  'linear-gradient(180deg, #a8edea, #fed6e3)',
]

function getTodayDateString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getDayName(dateStr: string): string {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const d = new Date(dateStr)
  return days[d.getDay()]
}

export const useWritingStore = create<WritingState>((set, get) => ({
  writings: {},
  ideas: [],
  currentDate: getTodayDateString(),
  isLoaded: false,

  loadData: async () => {
    try {
      const [writings, ideas] = await Promise.all([
        idbGet('writings') as Promise<Record<string, Writing> | undefined>,
        idbGet('ideas') as Promise<Idea[] | undefined>,
      ])
      set({
        writings: writings || {},
        ideas: ideas || [],
        isLoaded: true,
      })
    } catch (e) {
      console.error('加载数据失败:', e)
      set({ isLoaded: true })
    }
  },

  saveTodayWriting: async (content: string) => {
    const date = getTodayDateString()
    const state = get()
    const existing = state.writings[date]
    const wordCount = content.replace(/\s/g, '').length

    const writing: Writing = existing
      ? {
          ...existing,
          content,
          wordCount,
          updatedAt: Date.now(),
        }
      : {
          id: uuidv4(),
          date,
          content,
          wordCount,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

    const newWritings = { ...state.writings, [date]: writing }
    set({ writings: newWritings, currentDate: date })
    await idbSet('writings', newWritings)
  },

  getTodayWriting: () => {
    const state = get()
    return state.writings[state.currentDate] || null
  },

  addIdea: async (content: string) => {
    if (content.length > 140) content = content.slice(0, 140)
    const idea: Idea = {
      id: uuidv4(),
      content,
      gradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
      createdAt: Date.now(),
    }
    const state = get()
    const newIdeas = [idea, ...state.ideas]
    set({ ideas: newIdeas })
    await idbSet('ideas', newIdeas)
  },

  deleteIdea: async (id: string) => {
    const state = get()
    const newIdeas = state.ideas.filter((i) => i.id !== id)
    set({ ideas: newIdeas })
    await idbSet('ideas', newIdeas)
  },

  appendIdeaToWriting: async (ideaId: string) => {
    const state = get()
    const idea = state.ideas.find((i) => i.id === ideaId)
    if (!idea) return

    const today = state.getTodayWriting()
    const newContent = today ? `${today.content}\n\n${idea.content}` : idea.content
    await state.saveTodayWriting(newContent)
  },

  getMonthTotalWords: () => {
    const state = get()
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const prefix = `${year}-${month}`

    return Object.values(state.writings)
      .filter((w) => w.date.startsWith(prefix))
      .reduce((sum, w) => sum + w.wordCount, 0)
  },

  getStreakDays: () => {
    const state = get()
    let streak = 0
    const d = new Date()

    while (true) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const writing = state.writings[dateStr]
      if (writing && writing.wordCount >= 500) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        if (streak === 0) {
          d.setDate(d.getDate() - 1)
          const prevStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          const prev = state.writings[prevStr]
          if (prev && prev.wordCount >= 500) {
            streak++
            d.setDate(d.getDate() - 1)
            continue
          }
        }
        break
      }
    }
    return streak
  },

  getWeekData: () => {
    const result: { date: string; words: number; dayName: string }[] = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const writing = get().writings[dateStr]
      result.push({
        date: dateStr,
        words: writing ? writing.wordCount : 0,
        dayName: getDayName(dateStr),
      })
    }
    return result
  },

  exportAllWritings: async () => {
    const state = get()
    const sorted = Object.values(state.writings).sort((a, b) => a.date.localeCompare(b.date))

    let md = '# 我的写作记录\n\n'
    md += `> 导出时间：${new Date().toLocaleString('zh-CN')}\n\n`
    md += `> 共 ${sorted.length} 篇，总字数：${sorted.reduce((s, w) => s + w.wordCount, 0)} 字\n\n---\n\n`

    for (const w of sorted) {
      md += `## ${w.date}\n\n`
      md += `**字数：${w.wordCount}**\n\n`
      md += w.content + '\n\n---\n\n'
    }

    return md
  },
}))
