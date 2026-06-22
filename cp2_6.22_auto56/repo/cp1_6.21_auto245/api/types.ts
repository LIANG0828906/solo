export type ShowStatus = 'watching' | 'completed' | 'dropped'

export interface Show {
  id: string
  tmdbId: number
  name: string
  posterPath: string
  firstAirDate: string
  overview: string
  genres: string[]
  totalEpisodes: number
  totalSeasons: number
  status: ShowStatus
  addedAt: string
  lastUpdatedAt: string
}

export interface WatchRecord {
  id: string
  showId: string
  season: number
  episode: number
  rating: number
  comment: string
  watchedAt: string
}

export interface ShowStats {
  totalEpisodes: number
  watchedEpisodes: number
  averageRating: number
  daysTracked: number
  currentSeason: number
  currentEpisode: number
}

export interface SearchResult {
  tmdbId: number
  name: string
  posterPath: string
  firstAirDate: string
  overview: string
}

export interface ShowDetail extends Show {
  records: WatchRecord[]
  stats: ShowStats
}

export interface CreateShowRequest {
  tmdbId: number
  name: string
  posterPath: string
  firstAirDate: string
  overview: string
  genres: string[]
  totalEpisodes: number
  totalSeasons: number
}

export interface UpdateShowStatusRequest {
  status: ShowStatus
}

export interface CreateRecordRequest {
  season: number
  episode: number
  rating: number
  comment: string
}
