import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface TimeEntry {
  id: string
  description: string
  startTime: number
  endTime: number
  duration: number
  tag: string
}

export interface Project {
  id: string
  name: string
  color: string
  entries: TimeEntry[]
}

interface TimerState {
  isRunning: boolean
  startTime: number | null
}

interface AppState {
  projects: Project[]
  currentProjectId: string
  timer: TimerState
  showReport: boolean
  reportContent: string
  showEntryModal: boolean
  pendingEntry: { startTime: number; endTime: number } | null

  setCurrentProject: (projectId: string) => void
  startTimer: () => void
  stopTimer: () => void
  addEntry: (projectId: string, entry: Omit<TimeEntry, 'id'>) => void
  generateReport: (projectId: string) => void
  toggleReport: () => void
  closeEntryModal: () => void
  saveEntry: (description: string, tag: string, startTime: number, endTime: number) => void
  sendBill: () => boolean
  loadFromStorage: () => void
}

const STORAGE_KEY = 'freelance-time-tracker'

const defaultProjects: Project[] = [
  {
    id: uuidv4(),
    name: 'Web开发',
    color: '#6C63FF',
    entries: [],
  },
  {
    id: uuidv4(),
    name: '设计',
    color: '#F59E0B',
    entries: [],
  },
  {
    id: uuidv4(),
    name: '咨询',
    color: '#10B981',
    entries: [],
  },
]

export const useAppStore = create<AppState>((set, get) => ({
  projects: defaultProjects,
  currentProjectId: defaultProjects[0].id,
  timer: {
    isRunning: false,
    startTime: null,
  },
  showReport: false,
  reportContent: '',
  showEntryModal: false,
  pendingEntry: null,

  setCurrentProject: (projectId: string) => {
    set({ currentProjectId: projectId })
  },

  startTimer: () => {
    set({
      timer: {
        isRunning: true,
        startTime: Date.now(),
      },
    })
  },

  stopTimer: () => {
    const { timer } = get()
    if (!timer.startTime) return

    const endTime = Date.now()
    set({
      timer: {
        isRunning: false,
        startTime: null,
      },
      showEntryModal: true,
      pendingEntry: {
        startTime: timer.startTime,
        endTime,
      },
    })
  },

  closeEntryModal: () => {
    set({
      showEntryModal: false,
      pendingEntry: null,
    })
  },

  saveEntry: (description: string, tag: string, startTime: number, endTime: number) => {
    const { currentProjectId } = get()
    const duration = Math.round((endTime - startTime) / 60000)

    const entry: Omit<TimeEntry, 'id'> = {
      description,
      startTime,
      endTime,
      duration,
      tag,
    }

    get().addEntry(currentProjectId, entry)
    set({
      showEntryModal: false,
      pendingEntry: null,
    })
  },

  addEntry: (projectId: string, entry: Omit<TimeEntry, 'id'>) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: uuidv4(),
    }

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, entries: [newEntry, ...p.entries].sort((a, b) => b.startTime - a.startTime) }
          : p
      ),
    }))

  },

  generateReport: (projectId: string) => {
    const { projects } = get()
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const recentEntries = project.entries.filter(
      (e) => new Date(e.startTime) >= sevenDaysAgo
    )

    const totalMinutes = recentEntries.reduce((sum, e) => sum + e.duration, 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60

    const tagStats: Record<string, number> = {}
    recentEntries.forEach((e) => {
      tagStats[e.tag] = (tagStats[e.tag] || 0) + e.duration
    })

    const dateGroups: Record<string, TimeEntry[]> = {}
    recentEntries.forEach((e) => {
      const dateStr = new Date(e.startTime).toLocaleDateString('zh-CN')
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = []
      }
      dateGroups[dateStr].push(e)
    })

    let report = `# ${project.name} - 工作日报\n\n`
    report += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`
    report += `## 总工时\n\n`
    report += `${totalHours}小时${remainingMinutes}分钟（最近7天）\n\n`
    report += `## 任务摘要\n\n`

    const sortedDates = Object.keys(dateGroups).sort().reverse()
    sortedDates.forEach((date) => {
      report += `### ${date}\n\n`
      dateGroups[date].forEach((e) => {
        const startStr = new Date(e.startTime).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })
        const endStr = new Date(e.endTime).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })
        report += `- **${e.description}** (${startStr} - ${endStr}, ${e.duration}分钟) \`${e.tag}\`\n`
      })
      report += '\n'
    })

    report += `## 标签统计\n\n`
    report += `| 标签 | 工时（分钟） | 占比 |\n`
    report += `|------|-------------|------|\n`
    Object.entries(tagStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tag, minutes]) => {
        const percent = totalMinutes > 0 ? ((minutes / totalMinutes) * 100).toFixed(1) : '0'
        report += `| ${tag} | ${minutes} | ${percent}% |\n`
      })

    set({
      reportContent: report,
      showReport: true,
    })
  },

  toggleReport: () => {
    set((state) => ({ showReport: !state.showReport }))
  },

  sendBill: () => {
    const { projects, currentProjectId } = get()
    const project = projects.find((p) => p.id === currentProjectId)
    if (!project) return false

    const totalMinutes = project.entries.reduce((sum, e) => sum + e.duration, 0)
    const totalHours = totalMinutes / 60

    return totalHours > 10
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.projects && data.projects.length > 0) {
          set({
            projects: data.projects,
            currentProjectId: data.currentProjectId || data.projects[0].id,
          })
        }
      }
    } catch (e) {
      console.error('Failed to load from storage:', e)
    }
  },
}))

useAppStore.subscribe((state) => {
  try {
    const data = {
      projects: state.projects,
      currentProjectId: state.currentProjectId,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to storage:', e)
  }
})
