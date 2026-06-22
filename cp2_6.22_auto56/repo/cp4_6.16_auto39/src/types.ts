export interface Playlist {
  id: string;
  title: string;
  coverColor: string;
  description: string;
  creator: string;
  songCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Song {
  id: string;
  playlistId: string;
  songId: string;
  title: string;
  artist: string;
  reason: string;
  order: number;
}

export interface Comment {
  id: string;
  playlistId: string;
  nickname: string;
  content: string;
  createdAt: number;
}

export interface MockSong {
  id: string;
  title: string;
  artist: string;
  album: string;
}

export type SortType = 'createdAt' | 'songCount';

export interface PlaylistSummary {
  id: string;
  title: string;
  coverColor: string;
  description: string;
  creator: string;
  songCount: number;
  commentCount: number;
  updatedAt: number;
}

export interface PlaylistWithStats extends Playlist {
  songCount: number;
  commentCount: number;
}
