export interface Show {
  id: string;
  tmdbId: number;
  name: string;
  posterPath: string;
  firstAirDate: string;
  overview: string;
  genres: string[];
  totalEpisodes: number;
  totalSeasons: number;
  status: 'watching' | 'completed' | 'dropped';
  addedAt: string;
  lastUpdatedAt: string;
}

export interface WatchRecord {
  id: string;
  showId: string;
  season: number;
  episode: number;
  rating: number;
  comment: string;
  watchedAt: string;
}

export interface SearchResult {
  tmdbId: number;
  name: string;
  posterPath: string;
  firstAirDate: string;
  overview: string;
}

export interface ShowStats {
  totalEpisodes: number;
  watchedEpisodes: number;
  averageRating: number;
  daysTracked: number;
  currentSeason: number;
  currentEpisode: number;
}

export interface ShowDetail extends Show {
  records: WatchRecord[];
  stats: ShowStats;
}

export type FilterStatus = 'all' | 'watching' | 'completed' | 'dropped';

export type SortBy = 'rating' | 'addedAt' | 'lastUpdatedAt';
