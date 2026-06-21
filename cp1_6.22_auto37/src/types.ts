export interface Stage {
  id: string;
  name: string;
  plannedDuration: number;
  notes: string;
  actualDuration?: number;
}

export interface SpeechRecord {
  id: string;
  date: string;
  totalDuration: number;
  totalWordCount: number;
  stages: Stage[];
}
