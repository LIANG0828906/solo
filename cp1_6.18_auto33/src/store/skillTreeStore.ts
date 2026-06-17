import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { SkillNode, TaskCategory, TaskDifficulty, WeeklyDataPoint, CategoryDistribution } from '@/types'
import { fetchInitialSkillTree, DIFFICULTY_XP, getCategoryColor, getCategoryName } from '@/utils/mockApi'

const xpToNextLevel = (level: number): number => 100 * level

interface SkillTreeState {
  nodes: SkillNode[]
  loading: boolean
  xp: number
  level: number
  currentLevelXp: number
  xpToNext: number
  initialized: boolean
  highlightedNode: string | null

  initData: () => Promise<void>
  toggleNode: (nodeId: string) => void
  addTask: (nodeId: string, title: string, dueDate: string, difficulty: TaskDifficulty) => void
  completeTask: (nodeId: string, taskId: string) => void
  deleteTask: (nodeId: string, taskId: string) => void
  editTask: (nodeId: string, taskId: string, title: string, dueDate: string, difficulty: TaskDifficulty) => void
  addXP: (amount: number) => void
  setHighlightedNode: (nodeId: string | null) => void

  getTodayCompletedCount: () => number
  getWeeklyData: () => WeeklyDataPoint[]
  getCategoryDistribution: () => CategoryDistribution[]
}

export const useSkillTreeStore = create<SkillTreeState>((set, get) => ({
  nodes: [],
  loading: false,
  xp: 0,
  level: 1,
  currentLevelXp: 0,
  xpToNext: 100,
  initialized: false,
  highlightedNode: null,

  initData: async () => {
    set({ loading: true })
    const nodes = await fetchInitialSkillTree()
    const initialLevel = 1
    set({
      nodes,
      loading: false,
      initialized: true,
      level: initialLevel,
      xpToNext: xpToNextLevel(initialLevel),
    })
  },

  toggleNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, expanded: !n.expanded } : n)),
    })),

  addTask: (nodeId, title, dueDate, difficulty) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              tasks: [
                ...n.tasks,
                {
                  id: uuidv4(),
                  title,
                  dueDate,
                  category: n.category,
                  difficulty,
                  completed: false,
                },
              ],
            }
          : n
      ),
    })),

  completeTask: (nodeId, taskId) => {
    const state = get()
    const node = state.nodes.find((n) => n.id === nodeId)
    const task = node?.tasks.find((t) => t.id === taskId)
    if (!task || task.completed) return

    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              tasks: n.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
              ),
            }
          : n
      ),
    }))
    const xpGain = DIFFICULTY_XP[task.difficulty]
    get().addXP(xpGain)
    get().setHighlightedNode(nodeId)
    setTimeout(() => get().setHighlightedNode(null), 1500)
  },

  deleteTask: (nodeId, taskId) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, tasks: n.tasks.filter((t) => t.id !== taskId) } : n
      ),
    })),

  editTask: (nodeId, taskId, title, dueDate, difficulty) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              tasks: n.tasks.map((t) =>
                t.id === taskId ? { ...t, title, dueDate, difficulty } : t
              ),
            }
          : n
      ),
    })),

  addXP: (amount) =>
    set((state) => {
      let { xp, level, currentLevelXp, xpToNext } = state
      xp += amount
      currentLevelXp += amount
      while (currentLevelXp >= xpToNext) {
        currentLevelXp -= xpToNext
        level += 1
        xpToNext = xpToNextLevel(level)
      }
      return { xp, level, currentLevelXp, xpToNext }
    }),

  setHighlightedNode: (nodeId) => set({ highlightedNode: nodeId }),

  getTodayCompletedCount: () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()
    let count = 0
    for (const node of get().nodes) {
      for (const task of node.tasks) {
        if (task.completed && task.completedAt && task.completedAt >= todayStr) {
          count++
        }
      }
    }
    return count
  },

  getWeeklyData: (): WeeklyDataPoint[] => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const result: WeeklyDataPoint[] = days.map((day) => ({ day, count: 0 }))
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek)
    monday.setHours(0, 0, 0, 0)

    for (const node of get().nodes) {
      for (const task of node.tasks) {
        if (task.completed && task.completedAt) {
          const completed = new Date(task.completedAt)
          if (completed >= monday) {
            const idx = completed.getDay() === 0 ? 6 : completed.getDay() - 1
            if (idx >= 0 && idx < 7) result[idx].count++
          }
        }
      }
    }
    return result
  },

  getCategoryDistribution: (): CategoryDistribution[] => {
    const categories: TaskCategory[] = ['work', 'study', 'health']
    return categories.map((cat) => {
      let count = 0
      for (const node of get().nodes) {
        if (node.category === cat) {
          count += node.tasks.filter((t) => t.completed).length
        }
      }
      return {
        category: cat,
        name: getCategoryName(cat),
        count,
        color: getCategoryColor(cat),
      }
    })
  },
}))
