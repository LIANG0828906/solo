import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { getCityCoords } from './utils'

export interface PhenologyRecord {
  id: string
  solarTermName: string
  city: string
  description: string
  imageDataUrl?: string
  createdAt: number
  coords: { x: number; y: number }
}

interface RecordState {
  records: PhenologyRecord[]
  addRecord: (data: Omit<PhenologyRecord, 'id' | 'createdAt' | 'coords'>) => void
  getRecordsBySolarTerm: (solarTermName: string) => PhenologyRecord[]
  deleteRecord: (id: string) => void
  getAllRecords: () => PhenologyRecord[]
}

const STORAGE_KEY = 'phenology_records'

const loadRecords = (): PhenologyRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveRecords = (records: PhenologyRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    console.warn('Failed to save records to localStorage')
  }
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: loadRecords(),

  addRecord: (data) => {
    const newRecord: PhenologyRecord = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
      coords: getCityCoords(data.city)
    }
    const newRecords = [newRecord, ...get().records]
    set({ records: newRecords })
    saveRecords(newRecords)
  },

  getRecordsBySolarTerm: (solarTermName) => {
    return get().records.filter(r => r.solarTermName === solarTermName)
  },

  deleteRecord: (id) => {
    const newRecords = get().records.filter(r => r.id !== id)
    set({ records: newRecords })
    saveRecords(newRecords)
  },

  getAllRecords: () => {
    return get().records
  }
}))
