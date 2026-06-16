import { create } from 'zustand'
import type { MoodRecord, MoodStore, MoodType } from './types'
import { get, set } from 'idb-keyval'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'mood_records'

const getTodayString = (): string => {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

export const useMoodStore = create<MoodStore>((set, get) => ({
  records: [],
  selectedDate: getTodayString(),
  isLoading: false,

  setRecords: (records: MoodRecord[]) => set({ records }),

  addRecord: async (record: MoodRecord) => {
    const currentRecords = get().records
    const existingIndex = currentRecords.findIndex(r => r.date === record.date)
    
    let newRecords: MoodRecord[]
    if (existingIndex >= 0) {
      newRecords = [...currentRecords]
      newRecords[existingIndex] = {
        ...record,
        updatedAt: Date.now(),
      }
    } else {
      newRecords = [...currentRecords, record]
    }
    
    set({ records: newRecords })
    await saveRecordsToDB(newRecords)
  },

  updateRecord: async (record: MoodRecord) => {
    const currentRecords = get().records
    const index = currentRecords.findIndex(r => r.id === record.id)
    
    if (index >= 0) {
      const newRecords = [...currentRecords]
      newRecords[index] = {
        ...record,
        updatedAt: Date.now(),
      }
      set({ records: newRecords })
      await saveRecordsToDB(newRecords)
    }
  },

  deleteRecord: async (id: string) => {
    const currentRecords = get().records
    const newRecords = currentRecords.filter(r => r.id !== id)
    set({ records: newRecords })
    await saveRecordsToDB(newRecords)
  },

  setSelectedDate: (date: string) => set({ selectedDate: date }),

  getRecordByDate: (date: string): MoodRecord | undefined => {
    return get().records.find(r => r.date === date)
  },
}))

async function saveRecordsToDB(records: MoodRecord[]): Promise<void> {
  try {
    await set(STORAGE_KEY, records)
  } catch (error) {
    console.error('Failed to save records to IndexedDB:', error)
  }
}

export async function loadRecordsFromDB(): Promise<MoodRecord[]> {
  try {
    const records = await get<MoodRecord[]>(STORAGE_KEY)
    return records || []
  } catch (error) {
    console.error('Failed to load records from IndexedDB:', error)
    return []
  }
}

export function createMoodRecord(
  date: string,
  moodType: MoodType,
  text: string
): MoodRecord {
  const now = Date.now()
  return {
    id: uuidv4(),
    date,
    moodType,
    text,
    createdAt: now,
    updatedAt: now,
  }
}

export function getMonthRecords(
  records: MoodRecord[],
  year: number,
  month: number
): MoodRecord[] {
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  return records.filter(r => r.date.startsWith(monthStr))
}

export function getRecentRecords(
  records: MoodRecord[],
  days: number
): MoodRecord[] {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days + 1)
  
  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]
  
  return records
    .filter(r => r.date >= startStr && r.date <= endStr)
    .sort((a, b) => a.date.localeCompare(b.date))
}
