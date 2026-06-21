import { v4 as uuidv4 } from 'uuid'
import type { Show, ShowStatus, ShowStats, WatchRecord, ShowDetail, CreateShowRequest } from '../types'
import { getAllShows, saveAllShows, getAllRecords } from '../data/store'

function calculateStats(show: Show, records: WatchRecord[]): ShowStats {
  const showRecords = records.filter(r => r.showId === show.id)
  const watchedEpisodes = showRecords.length
  
  const ratedRecords = showRecords.filter(r => r.rating > 0)
  const averageRating = ratedRecords.length > 0
    ? ratedRecords.reduce((sum, r) => sum + r.rating, 0) / ratedRecords.length
    : 0

  const daysTracked = show.addedAt
    ? Math.ceil((Date.now() - new Date(show.addedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  let currentSeason = 0
  let currentEpisode = 0

  if (showRecords.length > 0) {
    const sortedRecords = [...showRecords].sort((a, b) => {
      const seasonDiff = b.season - a.season
      if (seasonDiff !== 0) return seasonDiff
      return b.episode - a.episode
    })
    currentSeason = sortedRecords[0].season
    currentEpisode = sortedRecords[0].episode
  }

  return {
    totalEpisodes: show.totalEpisodes,
    watchedEpisodes,
    averageRating: Math.round(averageRating * 100) / 100,
    daysTracked,
    currentSeason,
    currentEpisode
  }
}

export async function getShows(): Promise<Show[]> {
  const shows = await getAllShows()
  return shows.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
}

export async function getShowById(id: string): Promise<ShowDetail | null> {
  const shows = await getAllShows()
  const show = shows.find(s => s.id === id)
  
  if (!show) {
    return null
  }

  const records = await getAllRecords()
  const showRecords = records
    .filter(r => r.showId === id)
    .sort((a, b) => {
      const seasonDiff = a.season - b.season
      if (seasonDiff !== 0) return seasonDiff
      return a.episode - b.episode
    })

  const stats = calculateStats(show, records)

  return {
    ...show,
    records: showRecords,
    stats
  }
}

export async function createShow(data: CreateShowRequest): Promise<Show> {
  const shows = await getAllShows()
  
  const existingShow = shows.find(s => s.tmdbId === data.tmdbId)
  if (existingShow) {
    return existingShow
  }

  const now = new Date().toISOString()
  const newShow: Show = {
    id: uuidv4(),
    tmdbId: data.tmdbId,
    name: data.name,
    posterPath: data.posterPath,
    firstAirDate: data.firstAirDate,
    overview: data.overview,
    genres: data.genres,
    totalEpisodes: data.totalEpisodes,
    totalSeasons: data.totalSeasons,
    status: 'watching',
    addedAt: now,
    lastUpdatedAt: now
  }

  shows.push(newShow)
  await saveAllShows(shows)

  return newShow
}

export async function deleteShow(id: string): Promise<boolean> {
  const shows = await getAllShows()
  const index = shows.findIndex(s => s.id === id)
  
  if (index === -1) {
    return false
  }

  shows.splice(index, 1)
  await saveAllShows(shows)

  return true
}

export async function updateShowStatus(id: string, status: ShowStatus): Promise<Show | null> {
  const shows = await getAllShows()
  const show = shows.find(s => s.id === id)
  
  if (!show) {
    return null
  }

  show.status = status
  show.lastUpdatedAt = new Date().toISOString()
  
  await saveAllShows(shows)

  return show
}
