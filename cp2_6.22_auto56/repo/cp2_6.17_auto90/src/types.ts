export interface Timeline {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  timelineId: string;
  title: string;
  date: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineWithEvents extends Timeline {
  events: Event[];
}
