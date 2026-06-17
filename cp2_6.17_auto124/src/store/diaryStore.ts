import { create } from 'zustand'
import { DiaryEntry, PageType, SearchFilters } from '../types'

interface DiaryState {
  currentDate: string
  currentPage: PageType
  currentDiary: DiaryEntry | null
  monthDiaries: DiaryEntry[]
  searchResults: DiaryEntry[]
  searchFilters: SearchFilters
  setCurrentDate: (date: string) => void
  setCurrentPage: (page: PageType) => void
  setCurrentDiary: (diary: DiaryEntry | null) => void
  setMonthDiaries: (diaries: DiaryEntry[]) => void
  setSearchResults: (diaries: DiaryEntry[]) => void
  setSearchFilters: (filters: SearchFilters) => void
}

const formatDate = (d: Date): string => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const useDiaryStore = create<DiaryState>((set) => ({
  currentDate: formatDate(new Date()),
  currentPage: 'diary',
  currentDiary: null,
  monthDiaries: [],
  searchResults: [],
  searchFilters: { keyword: '', tags: [] },
  setCurrentDate: (date) => set({ currentDate: date }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setCurrentDiary: (diary) => set({ currentDiary: diary }),
  setMonthDiaries: (diaries) => set({ monthDiaries: diaries }),
  setSearchResults: (diaries) => set({ searchResults: diaries }),
  setSearchFilters: (filters) => set({ searchFilters: filters }),
}))
