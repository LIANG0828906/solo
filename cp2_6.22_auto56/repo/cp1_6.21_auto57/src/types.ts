export interface KeywordWeight {
  id: string;
  word: string;
  weight: number;
  color: string;
}

export interface HistoryDayData {
  date: string;
  keywords: KeywordWeight[];
}

export interface TrendsResponse {
  topic: string;
  keywords: KeywordWeight[];
  timestamp: number;
}

export interface HistoryResponse {
  topic: string;
  history: HistoryDayData[];
}

export interface NoteItem {
  id: string;
  word: string;
  weight: number;
  color: string;
}

export interface PresetTagsResponse {
  tags: string[];
}
