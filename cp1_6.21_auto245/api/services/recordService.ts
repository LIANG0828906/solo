import { v4 as uuidv4 } from 'uuid'
import type { WatchRecord, CreateRecordRequest } from '../types'
import { getAllRecords, saveAllRecords, getAllShows } from '../data/store'

export async function getRecordsByShowId(showId: string): Promise<WatchRecord[]> {
  const records = await getAllRecords()
  return records
    .filter(r => r.showId === showId)
    .sort((a, b) => {
      const seasonDiff = a.season - b.season
      if (seasonDiff !== 0) return seasonDiff
      return a.episode - b.episode
    })
}

export async function createRecord(showId: string, data: CreateRecordRequest): Promise<WatchRecord | null> {
  const shows = await getAllShows()
  const show = shows.find(s => s.id === showId)
  
  if (!show) {
    return null
  }

  const records = await getAllRecords()
  
  const existingRecord = records.find(
    r => r.showId === showId && r.season === data.season && r.episode === data.episode
  )
  
  if (existingRecord) {
    return existingRecord
  }

  const now = new Date().toISOString()
  const newRecord: WatchRecord = {
    id: uuidv4(),
    showId,
    season: data.season,
    episode: data.episode,
    rating: data.rating || 0,
    comment: data.comment || '',
    watchedAt: now
  }

  records.push(newRecord)
  await saveAllRecords(records)

  return newRecord
}

export async function deleteRecord(id: string): Promise<boolean> {
  const records = await getAllRecords()
  const index = records.findIndex(r => r.id === id)
  
  if (index === -1) {
    return false
  }

  records.splice(index, 1)
  await saveAllRecords(records)

  return true
}
