import { Plant, CareEvent, Reminder, CareType } from './types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

export const plantApi = {
  getAllPlants: (): Promise<Plant[]> => 
    request<Plant[]>('/plants'),
  
  getPlant: (id: string): Promise<Plant> => 
    request<Plant>(`/plants/${id}`),
  
  createPlant: (plant: Omit<Plant, 'id' | 'events' | 'nextWaterDate' | 'nextFertilizeDate'>): Promise<Plant> =>
    request<Plant>('/plants', {
      method: 'POST',
      body: JSON.stringify(plant)
    }),
  
  updatePlant: (id: string, plant: Partial<Plant>): Promise<Plant> =>
    request<Plant>(`/plants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plant)
    }),
  
  deletePlant: (id: string): Promise<void> =>
    request<void>(`/plants/${id}`, {
      method: 'DELETE'
    }),
  
  getEvents: (plantId: string): Promise<CareEvent[]> =>
    request<CareEvent[]>(`/plants/${plantId}/events`),
  
  addEvent: (plantId: string, event: { type: CareType; date?: string; note?: string }): Promise<{ event: CareEvent; plant: Plant }> =>
    request<{ event: CareEvent; plant: Plant }>(`/plants/${plantId}/events`, {
      method: 'POST',
      body: JSON.stringify(event)
    }),
  
  deleteEvent: (plantId: string, eventId: string): Promise<{ plant: Plant }> =>
    request<{ plant: Plant }>(`/plants/${plantId}/events/${eventId}`, {
      method: 'DELETE'
    }),
  
  getReminders: (): Promise<Reminder[]> =>
    request<Reminder[]>('/reminders')
};
