import { useCallback } from 'react'
import { DiaryEntry } from '../types'
import {
  getDiary as storageGetDiary,
  saveDiary as storageSaveDiary,
  deleteDiary as storageDeleteDiary,
  listDiaryByMonth as storageListDiaryByMonth,
  searchDiaries as storageSearchDiaries,
  calculateScore as storageCalculateScore,
} from '../utils/storage'

export function useDiaryApi() {
  const getDiary = useCallback(async (date: string): Promise<DiaryEntry | null> => {
    return storageGetDiary(date)
  }, [])

  const saveDiary = useCallback(
    async (date: string, content: string, tags: string[]): Promise<DiaryEntry> => {
      return storageSaveDiary(date, content, tags)
    },
    []
  )

  const deleteDiary = useCallback(async (date: string): Promise<void> => {
    return storageDeleteDiary(date)
  }, [])

  const listDiaryByMonth = useCallback(
    async (year: number, month: number): Promise<DiaryEntry[]> => {
      return storageListDiaryByMonth(year, month)
    },
    []
  )

  const searchDiaries = useCallback(
    async (keyword: string, tags: string[]): Promise<DiaryEntry[]> => {
      return storageSearchDiaries(keyword, tags)
    },
    []
  )

  const calculateScore = useCallback((tags: string[]): number => {
    return storageCalculateScore(tags)
  }, [])

  return {
    getDiary,
    saveDiary,
    deleteDiary,
    listDiaryByMonth,
    searchDiaries,
    calculateScore,
  }
}
