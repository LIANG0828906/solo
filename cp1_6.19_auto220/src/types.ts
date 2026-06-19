export type EmotionType = 'calm' | 'joy' | 'sadness' | 'anger' | 'peace';

export interface EmotionPalette {
  type: EmotionType;
  name: string;
  color: string;
}

export interface InkPoint {
  x: number;
  y: number;
  pressure: number;
  velocity: number;
  timestamp: number;
  color: string;
  size: number;
  opacity: number;
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  emotion: EmotionType;
  inkPoints: InkPoint[];
  thumbnail: string;
  createdAt: number;
}

export interface DiaryState {
  entries: DiaryEntry[];
  currentEntry: Partial<DiaryEntry> | null;
  selectedEmotion: EmotionType;
  searchQuery: string;
  filterEmotion: EmotionType | null;
  view: 'editor' | 'timeline';
  selectedEntryId: string | null;
}

export const EMOTION_PALETTES: EmotionPalette[] = [
  { type: 'calm', name: '宁静', color: '#8FBFFF' },
  { type: 'joy', name: '喜悦', color: '#FFB347' },
  { type: 'sadness', name: '忧伤', color: '#A0A0A0' },
  { type: 'anger', name: '愤怒', color: '#6B4226' },
  { type: 'peace', name: '平静', color: '#5A7A5A' },
];
