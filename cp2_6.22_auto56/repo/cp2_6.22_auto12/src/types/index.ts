export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dayIndex: number;
  activityId?: string;
}

export interface Activity {
  id: string;
  dayIndex: number;
  time: string;
  location: string;
  description: string;
  notes: string;
  locationId?: string;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  activities: Activity[];
  locations: Location[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripData {
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
}

export interface CreateActivityData {
  dayIndex: number;
  time: string;
  location: string;
  description: string;
  notes: string;
  locationId?: string;
}

export interface CreateLocationData {
  name: string;
  lat: number;
  lng: number;
  dayIndex: number;
  activityId?: string;
}

export interface SearchFilters {
  keyword: string;
  startDate?: string;
  endDate?: string;
}
