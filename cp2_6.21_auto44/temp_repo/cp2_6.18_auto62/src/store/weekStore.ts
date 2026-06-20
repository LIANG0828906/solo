import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { WeekData, WeekItem, TemplateType, TemplateStyles } from '../types'

export const TEMPLATES: Record<TemplateType, TemplateStyles> = {
  professional: {
    colors: {
      title: '#1E3A5F',
      body: '#333333',
      listMarker: '#4A90D9',
      divider: '#E0E0E0',
      accent: '#1E3A5F',
      background: '#ffffff',
      subtitle: '#666666',
      sectionTitle: '#1E3A5F',
    },
    fontFamily: "'Georgia', 'Times New Roman', 'Songti SC', 'SimSun', serif",
    titleFontSize: '28px',
    sectionTitleFontSize: '18px',
    bodyFontSize: '14px',
    lineHeight: '1.8',
    paragraphSpacing: '16px',
    listItemSpacing: '10px',
    borderRadius: '4px',
    dividerStyle: 'solid',
    dividerHeight: '1px',
    listMarker: '•',
    paperShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  creative: {
    colors: {
      title: '#7B2D8E',
      body: '#444444',
      listMarker: '#28A745',
      divider: 'linear-gradient(90deg, #7B2D8E 0%, #28A745 50%, #FFB800 100%)',
      accent: '#7B2D8E',
      background: '#fdfcff',
      subtitle: '#7B2D8E',
      sectionTitle: '#7B2D8E',
    },
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif",
    titleFontSize: '26px',
    sectionTitleFontSize: '17px',
    bodyFontSize: '15px',
    lineHeight: '1.7',
    paragraphSpacing: '14px',
    listItemSpacing: '12px',
    borderRadius: '12px',
    dividerStyle: 'gradient',
    dividerHeight: '3px',
    listMarker: '✓',
    paperShadow: '0 8px 30px rgba(123, 45, 142, 0.15)',
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

const parseWeekKey = (key: string): { year: number; weekNumber: number } => {
  const [yearStr, weekStr] = key.split('-W')
  return { year: parseInt(yearStr, 10), weekNumber: parseInt(weekStr, 10) }
}

const weekKeyToSortValue = (key: string): number => {
  const { year, weekNumber } = parseWeekKey(key)
  return year * 100 + weekNumber
}

const pruneOldWeeks = (weeks: Map<string, WeekData>, keepKey: string): Map<string, WeekData> => {
  if (weeks.size <= MAX_WEEKS) return weeks

  const sortedKeys = Array.from(weeks.keys()).sort(
    (a, b) => weekKeyToSortValue(b) - weekKeyToSortValue(a)
  )

  const result = new Map<string, WeekData>()
  let keptCount = 0
  let keepKeyIncluded = false

  for (const key of sortedKeys) {
    if (keptCount < MAX_WEEKS) {
      result.set(key, weeks.get(key)!)
      keptCount++
      if (key === keepKey) keepKeyIncluded = true
    } else if (key === keepKey) {
      const oldestKey = Array.from(result.keys()).sort(
        (a, b) => weekKeyToSortValue(a) - weekKeyToSortValue(b)
      )[0]
      result.delete(oldestKey)
      result.set(key, weeks.get(key)!)
      keepKeyIncluded = true
    }
  }

  if (!keepKeyIncluded && weeks.has(keepKey)) {
    if (result.size >= MAX_WEEKS) {
      const oldestKey = Array.from(result.keys()).sort(
        (a, b) => weekKeyToSortValue(a) - weekKeyToSortValue(b)
      )[0]
      result.delete(oldestKey)
    }
    result.set(keepKey, weeks.get(keepKey)!)
  }

  return result
}

export const useWeekStore = create<WeekState>((set, get) => ({
  weeks: new Map(),
  currentWeekKey: '',
  template: 'professional',

  initWeek: () => {
    const now = new Date()
    const { year, weekNumber } = getWeekNumber(now)
    const key = getWeekKey(year, weekNumber)

    set((state) => {
      if (state.currentWeekKey && state.weeks.size > 0) {
        return state
      }
      const initialData = createInitialWeekData(year, weekNumber)
      const weeks = new Map<string, WeekData>()
      weeks.set(key, initialData)
      return { weeks, currentWeekKey: key }
    })
  },

  switchWeek: (direction: -1 | 1) => {
    const { currentWeekKey, weeks } = get()
    if (!currentWeekKey) return

    const { year: currentYear, weekNumber: currentWeekNum } = parseWeekKey(currentWeekKey)
    let year = currentYear
    let weekNumber = currentWeekNum + direction

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

    const prunedWeeks = pruneOldWeeks(newWeeks, newKey)
    set({ weeks: prunedWeeks, currentWeekKey: newKey })
  },

  setTemplate: (template: TemplateType) => set({ template }),

  updateDateRange: (dateRange: string) => {
    const { currentWeekKey, weeks } = get()
    const current = weeks.get(currentWeekKey)
    if (!current) return
    const newWeeks = new Map(weeks)
    newWeeks.set(currentWeekKey, { ...current, dateRange: dateRange.slice(0, 100) })
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
        item.id === id ? { ...item, content: content.slice(0, 500) } : item
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
