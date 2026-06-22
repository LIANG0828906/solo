export type ContractStatus = 'settled' | 'pending';

export interface Song {
  id: string;
  name: string;
  playCount: number;
  duration: number;
}

export interface Contract {
  id: string;
  date: string;
  venue: string;
  fee: number;
  splitRatio: number;
  status: ContractStatus;
  songs: Song[];
}

export interface SongAllocation {
  song: Song;
  revenue: number;
  weight: number;
  percentage: number;
}

export interface SongSummary {
  songId: string;
  songName: string;
  totalRevenue: number;
  totalPlayCount: number;
  totalDuration: number;
  performanceCount: number;
}
