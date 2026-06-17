import { v4 as uuidv4 } from 'uuid'
import { DiaryEntry, POSITIVE_TAGS, NEGATIVE_TAGS } from '../types'

const STORAGE_KEY = 'emodiary_entries'

export function calculateScore(tags: string[]): number {
  let score = 0
  const positiveNames = POSITIVE_TAGS.map(t => t.name)
  const negativeNames = NEGATIVE_TAGS.map(t => t.name)

  for (const tag of tags) {
    if (positiveNames.includes(tag)) {
      score += 1
    } else if (negativeNames.includes(tag)) {
      score -= 1
    }
  }

  return Math.max(-3, Math.min(3, score))
}

export function getAllDiaries(): DiaryEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveAllDiaries(diaries: DiaryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries))
}

export function getDiary(date: string): DiaryEntry | null {
  const diaries = getAllDiaries()
  return diaries.find(d => d.date === date) || null
}

export function saveDiary(date: string, content: string, tags: string[]): DiaryEntry {
  const diaries = getAllDiaries()
  const existingIndex = diaries.findIndex(d => d.date === date)
  const now = Date.now()
  const score = calculateScore(tags)

  if (existingIndex >= 0) {
    diaries[existingIndex] = {
      ...diaries[existingIndex],
      content,
      tags,
      score,
      updatedAt: now,
    }
    saveAllDiaries(diaries)
    return diaries[existingIndex]
  } else {
    const entry: DiaryEntry = {
      id: uuidv4(),
      date,
      content,
      tags,
      score,
      createdAt: now,
      updatedAt: now,
    }
    diaries.push(entry)
    saveAllDiaries(diaries)
    return entry
  }
}

export function deleteDiary(date: string): void {
  const diaries = getAllDiaries()
  const filtered = diaries.filter(d => d.date !== date)
  saveAllDiaries(filtered)
}

export function listDiaryByMonth(year: number, month: number): DiaryEntry[] {
  const diaries = getAllDiaries()
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  return diaries
    .filter(d => d.date.startsWith(monthStr))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function searchDiaries(keyword: string, tags: string[]): DiaryEntry[] {
  const diaries = getAllDiaries()
  let filtered = diaries

  if (keyword.trim()) {
    const kw = keyword.toLowerCase()
    filtered = filtered.filter(d => d.content.toLowerCase().includes(kw))
  }

  if (tags.length > 0) {
    filtered = filtered.filter(d => tags.some(t => d.tags.includes(t)))
  }

  return filtered.sort((a, b) => b.date.localeCompare(a.date))
}
