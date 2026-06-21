import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface MapLocation {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  time: string;
  location: string;
  description: string;
  notes: string;
  mapLocation: MapLocation | null;
}

export interface DayPlan {
  date: string;
  activities: Activity[];
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  days: DayPlan[];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function fetchTrips(): Promise<Trip[]> {
  const response = await api.get<Trip[]>('/trips');
  return response.data;
}

export async function fetchTrip(id: string): Promise<Trip> {
  const response = await api.get<Trip>(`/trips/${id}`);
  return response.data;
}

export async function createTrip(trip: Omit<Trip, 'id'>): Promise<Trip> {
  const response = await api.post<Trip>('/trips', trip);
  return response.data;
}

export async function updateTrip(trip: Trip): Promise<Trip> {
  const response = await api.put<Trip>(`/trips/${trip.id}`, trip);
  return response.data;
}

export async function deleteTrip(id: string): Promise<void> {
  await api.delete(`/trips/${id}`);
}
