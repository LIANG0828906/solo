export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  coverUrl: string;
}

export interface Participant {
  id: string;
  name: string;
  playlist: Song[];
  color: string;
}

export interface Room {
  id: string;
  name: string;
  participants: Participant[];
  progress: number;
  generatedPlaylist: { song: Song; matchScore: number }[] | null;
}

export interface ScoredSong {
  song: Song;
  matchScore: number;
}
