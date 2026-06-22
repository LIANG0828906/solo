export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteDB {
  notes: Note[];
}

export interface TagDistribution {
  tag: string;
  count: number;
}

export interface DailyNewNotes {
  date: string;
  count: number;
}
