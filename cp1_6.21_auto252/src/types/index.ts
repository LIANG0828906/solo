export interface Tour {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  members: string[];
}

export interface Show {
  id: string;
  tourId: string;
  venue: string;
  date: string;
  notes: string;
}

export interface Song {
  id: string;
  showId: string;
  name: string;
  duration: string;
  order: number;
}

export interface TourStats {
  totalShows: number;
  totalSongs: number;
  totalDuration: string;
  avgSongsPerShow: number;
  uniqueVenues: number;
}
