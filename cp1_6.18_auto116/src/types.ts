export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  coverColor: string;
  sessions: Session[];
}

export interface Session {
  id: string;
  bookId: string;
  date: string;
  startPage: number;
  endPage: number;
  duration: number;
}

export interface DailyPagesData {
  date: string;
  pages: number;
}

export interface RadarData {
  dimension: string;
  value: number;
}

export interface TimeSlotData {
  slot: string;
  duration: number;
}

export interface HeatmapData {
  date: string;
  pages: number;
}

export interface ChartData {
  dailyPages: DailyPagesData[];
  radarData: RadarData[];
  timeSlots: TimeSlotData[];
  heatmapData: HeatmapData[];
}

export interface DayDetail {
  bookTitle: string;
  pages: number;
  duration: number;
}
