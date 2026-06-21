import { Show, Song, TourStats } from '../types';

function parseDuration(duration: string): number {
  const [minutes, seconds] = duration.split(':').map(Number);
  return minutes * 60 + seconds;
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h ${minutes}m`;
}

export function calculateTourStats(tourId: string, shows: Show[], songs: Song[]): TourStats {
  const tourShows = shows.filter(s => s.tourId === tourId);
  const totalShows = tourShows.length;

  let totalSongs = 0;
  let totalSeconds = 0;
  const venueSet = new Set<string>();

  for (const show of tourShows) {
    venueSet.add(show.venue);
    const showSongs = songs.filter(sg => sg.showId === show.id);
    totalSongs += showSongs.length;
    for (const song of showSongs) {
      totalSeconds += parseDuration(song.duration);
    }
  }

  const totalMinutes = totalSeconds / 60;
  const avgSongsPerShow = totalShows > 0 ? Math.round((totalSongs / totalShows) * 10) / 10 : 0;

  return {
    totalShows,
    totalSongs,
    totalDuration: formatDuration(totalMinutes),
    avgSongsPerShow,
    uniqueVenues: venueSet.size,
  };
}
