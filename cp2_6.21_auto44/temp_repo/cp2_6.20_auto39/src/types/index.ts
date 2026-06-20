export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  summary: string;
  description: string;
  images: string[];
  createdAt: number;
}

export interface TimelineState {
  events: TimelineEvent[];
  expandedIds: Set<string>;
  addEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt'>) => void;
  toggleExpand: (id: string) => void;
}
