export interface TimelineEvent {
  id: string;
  date: Date;
  dateString: string;
  eventName: string;
  description?: string;
  [key: string]: unknown;
}

export interface Annotation {
  id: string;
  x: number;
  y: number;
  date: Date;
  text: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface TimelineData {
  events: TimelineEvent[];
  annotations: Annotation[];
  dateColumn: string;
  eventColumn: string;
  descriptionColumn?: string;
}

export interface CSVParseResult {
  success: boolean;
  data: TimelineEvent[];
  dateColumn: string;
  eventColumn: string;
  descriptionColumn?: string;
  error?: string;
}
