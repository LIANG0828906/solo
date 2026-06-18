import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { WeekData, WeekItem, TemplateType, TemplateColors } from '../types'

export const TEMPLATES: Record<TemplateType, TemplateColors> = {
  professional: {
    title: '#1E3A5F',
    body: '#333333',
    listMarker: '#4A90D9',
    divider: '#E0E0E0',
    accent: '#1E3A5F',
  },
  creative: {
    title: '#7B2D8E',
    body: '#444444',
    listMarker: '#28A745',
    divider: 'linear-gradient(90deg, #7B2D8E 0%, #28A745 100%)',
    accent: '#7B2D8E',
  },
}

const getWeekNumber = (date: Date): { weekNumber: number; year: number } => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { weekNumber, year: d.getUTCFullYear() }
}

const getDateRange = (year: number, weekNumber: number): string => {
  const firstDayOfYear = new Date(Date.UTC(year, 0, 1))
  const daysOffset = (weekNumber - 1) * 7
  const monday = new Date(firstDayOfYear)
  const dayOfWeek = firstDayOfYear.getUTCDay() || 7
  monday.setUTCDate(firstDayOfYear.getUTCDate() - dayOfWeek + 1 + daysOffset)
  const friday = new Date(monday)
  friday.setUTCDate(monday.getUTCDate() + 4)
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`
  return `${fmt(monday)} - ${fmt(friday)}`
}

const createInitialWeekData = (year: number, weekNumber: number): WeekData => ({
  year,
  weekNumber,
  dateRange: getDateRange(year, weekNumber),
  currentWork: [
    { id: uuidv4(), content: '' },
    { id: uuidv4(), content: '' },
    { id: uuidv4(), content: '' },
    { id: uuidv4(), content: '' },
    { id: uuidv4(), content: '' },
  ],
  nextPlan: [
    { id: uuidv4(), content: '' },
    { id: uuidv4(), content: '' },
    { id: uuidv4(), content: '' },
  ],
  reflection: '',
})

interface WeekState {
  weeks: Map<string, WeekData>
  currentWeekKey: string
  template: TemplateType
  initWeek: () => void
  switchWeek: (direction: -1 | 1) => void
  setTemplate: (template: TemplateType) => void
  updateDateRange: (dateRange: string) => void
  addCurrentWorkItem: () => void
  removeCurrentWorkItem: (id: string) => void
  updateCurrentWorkItem: (id: string, content: string) => void
  reorderCurrentWork: (fromIndex: number, toIndex: number) => void
  addNextPlanItem: () => void
  removeNextPlanItem: (id: string) => void
  updateNextPlanItem: (id: string, content: string) => void
  reorderNextPlan: (fromIndex: number, toIndex: number) => void
  updateReflection: (content: string) => void
  getCurrentWeek: () => WeekData | undefined
}

const MAX_WEEKS = 5

const getWeekKey = (year: number, weekNumber: number) => `${year}-W${weekNumber}`

export const useWeekStore = create<WeekState>((set, get) => ({
  weeks: new Map(),
  currentWeekKey: '',
  template: 'professional',

  initWeek: () => {
    const now = new Date()
    const { year, weekNumber } = getWeekNumber(now)
    const key = getWeekKey(year, weekNumber)
    const initialData = createInitialWeekData(year, weekNumber)
    const weeks = new Map<string, WeekData>()
    weeks.set(key, initialData)
    set({ weeks, currentWeekKey: key })
  },

  switchWeek: (direction: -1 | 1) => {
    const { currentWeekKey, weeks } = get()
    if (!currentWeekKey) return

    const [yearStr, weekStr] = currentWeekKey.split('-W')
    let year = parseInt(yearStr, 10)
    let weekNumber = parseInt(weekStr, 10) + direction

    if (weekNumber < 1) {
      year -= 1
      weekNumber = 52
    } else if (weekNumber > 52) {
      year += 1
      weekNumber = 1
    }

    const newKey = getWeekKey(year, weekNumber)
    const newWeeks = new Map(weeks)

    if (!newWeeks.has(newKey)) {
      newWeeks.set(newKey, createInitialWeekData(year, weekNumber))
    }

    const keys = Array.from(newWeeks.keys()).sort()
    while (newWeeks.size > MAX_WEEKS) {
      const oldestKey = keys.shift()
      if (oldestKey && oldestKey !== newKey) {
        newWeeks.delete(oldestKey)
      } else if (oldestKey) {
        keys.push(oldestKey)
        break
      }
    }

    set({ weeks: newWeeks, currentWeekKey: newKey })
  },

  setTemplate: (template: TemplateType) => set({ template }),

  updateDateRange: (dateRange: string) => {
    const { currentWeekKey, weeks } = get()
    const current = weeks.get(currentWeekKey)
    if (!current) return
    const newWeeks = new Map(weeks)
    newWeeks.set(currentWeekKey, { ...current, dateRange })
    set({ weeks: newWeeks })
  },

  addCurrentWorkItem: () => {
    const { currentWeekKey, weeks } = get()
    const current = weeks.get(currentWeekKey)
    if (!current) return
    const newItem: WeekItem = { id: uuidv4(), content: '' }
    const newWeeks = new Map(weeks)
    newWeeks.set(currentWeekKey, {
      ...current,
      currentWork: [...current.currentWork, newItem],
    })
    set({ weeks: newWeeks })
  },

  removeCurrentWorkItem: (id: string) => {
    const { currentWeekKey, weeks } = get()
    const current = weeks.get(currentWeekKey)
    if (!current || current.currentWork.length <= 1) return
    const newWeeks = new Map(weeks)
    newWeeks.set(currentWeekKey, {
      ...current,
      currentWork: current.currentWork.filter((item) => item.id !== id),
    })
    set({ weeks: newWeeks })
  },

  updateCurrentWorkItem: (id: string, content: string) => {
    const { currentWeekKey, weeks } = get()
    const current = weeks.get(currentWeekKey)
    if (!current) return
    const newWeeks = new Map(weeks)
    newWeeks.set(currentWeekKey, {
      ...current,
      currentWork: current.currentWork.map((item) =>
        item.id === id ? { ...item, content: content.slice(0, 500) } : item
      ),
    })
    set({ weeks: newWeeks })
  },

  reorderCurrentWork: (fromIndex: number, toIndex: number) => {
    const { currentWeekKey, weeks } = get()
    const current = weeks.get(currentWeekKey)
    if (!current) return
    const list = [...current.currentWork]
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)
    const newWeeks = new Map(weeks)
    newWeeks.set(currentWeekKey, { ...current, currentWork: list })
    set({ weeks: newWeeks })
  },

  addNextPlanItem: () => {
    const { currentWeekKey, weeks } = get()
    const current = weeks.get(currentWeekKey)
    if (!current) return
    const newItem: WeekItem = { id: uuidv4(), content: '' }
    const newWeeks = new Map(weeks)
    newWeeks.set(currentWeekKey, {
      ...current,
      nextPlan: [...current.nextPlan, newItem],
    })
    set({ weeks: newWeeks })
  },

  removeNextPlanItem: (id: string) => {
    const { currentWeekKey, weeks } = get()
    const current = weeks.get(currentWeekKey)
    if (!current || current.nextPlan.length <= 1) return
    const newWeeks = new Map(weeks)
    newWeeks.set(currentWeekKey, {
      ...current,
      nextPlan: current.nextPlan.filter((item) => item.id !== id),
    })
    set({ weeks: newWeeks })
  },

  updateNextPlanItem: (id: string, content: string) => {
    const { currentWeekKey, weeks } = get()
    const current = weeks.get(currentWeekKey)
    if (!current) return
    const newWeeks = new Map(weeks)
    newWeeks.set(currentWeekKey, {
      ...current,
      nextPlan: current.nextPlan.map((item) =>
        item.id === id ? { ...item, content } : item
      ),
    })
    set({ weeks: newWeeks })
  },

  reorderNextPlan: (fromIndex: number, toIndex: number) => {
    const { currentWeekKey, weeks } = get()
    const current = weeks.get(currentWeekKey)
    if (!current) return
    const list = [...current.nextPlan]
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)
    const newWeeks = new Map(weeks)
    newWeeks.set(currentWeekKey, { ...current, nextPlan: list })
    set({ weeks: newWeeks })
  },

  updateReflection: (content: string) => {
    const { currentWeekKey, weeks } = get()
    const current = weeks.get(currentWeekKey)
    if (!current) return
    const newWeeks = new Map(weeks)
    newWeeks.set(currentWeekKey, {
      ...current,
      reflection: content.slice(0, 1000),
    })
    set({ weeks: newWeeks })
  },

  getCurrentWeek: () => {
    const { currentWeekKey, weeks } = get()
    return weeks.get(currentWeekKey)
  },
}))
