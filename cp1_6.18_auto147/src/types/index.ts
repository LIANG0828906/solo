export interface VinylRecord {
  id: string;
  title: string;
  artist: string;
  year: number;
  coverColor: string;
  genre: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  style: CoverStyle;
  keyword: CoverKeyword;
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  currentRecord: VinylRecord | null;
  frequencyData: number[];
}

export type CoverStyle = '爵士暖调' | '电子冷感' | '民谣清新' | '古典典雅';

export type CoverKeyword = '慵懒' | '深邃' | '明亮' | '忧郁';

export interface Note {
  id: string;
  recordId: string;
  recordTitle: string;
  content: string;
  timestamp: number;
}

export interface GeneratedCover {
  id: string;
  svg: string;
  style: string;
  keyword: string;
  timestamp: number;
}

export interface PlayHistoryItem {
  recordId: string;
  timestamp: number;
}
