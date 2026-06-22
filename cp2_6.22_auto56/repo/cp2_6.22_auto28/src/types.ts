export interface Activity {
  id: string;
  time: string;
  place: string;
  description: string;
  notes: string;
  lat: number;
  lng: number;
}

export interface DayPlan {
  date: string;
  activities: Activity[];
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  description: string;
  days: DayPlan[];
}

export type ViewType = 'board' | 'detail' | 'map';
