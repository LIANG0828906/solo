export interface Song {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  fileUrl: string;
  fileName: string;
}

export interface Playlist {
  id: string;
  name: string;
  coverGradient: string;
  songs: Song[];
  createdAt: string;
}
