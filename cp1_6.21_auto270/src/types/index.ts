export type InspirationType = 'text' | 'drawing' | 'voice';

export interface Inspiration {
  id: string;
  type: InspirationType;
  content: string;
  tags: string[];
  createdAt: number;
  thumbnail?: string;
  duration?: number;
  audioUrl?: string;
  drawingData?: string;
}

export interface Filters {
  tags: string[];
  types: InspirationType[];
  dateRange: { start: number; end: number } | null;
}

export type RecordMode = InspirationType | null;
