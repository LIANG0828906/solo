import axios from 'axios';
import type { ApiResponse, Trip, TripEvent, TripDay } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export async function getTrip(tripId: string): Promise<Trip> {
  const res = await api.get<ApiResponse<Trip>>(`/trips/${tripId}`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || '获取行程失败');
  }
  return res.data.data;
}

export async function createEvent(
  tripId: string,
  date: string,
  event: Omit<TripEvent, 'id' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<{ event: TripEvent; day: TripDay }> {
  const res = await api.post<ApiResponse<{ event: TripEvent; day: TripDay }>>(
    `/trips/${tripId}/events`,
    { date, event }
  );
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || '创建事件失败');
  }
  return res.data.data;
}

export async function updateEvent(
  tripId: string,
  eventId: string,
  updates: Partial<TripEvent> & { date?: string }
): Promise<{ event: TripEvent; day: TripDay }> {
  const res = await api.put<ApiResponse<{ event: TripEvent; day: TripDay }>>(
    `/trips/${tripId}/events/${eventId}`,
    updates
  );
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || '更新事件失败');
  }
  return res.data.data;
}

export async function deleteEvent(
  tripId: string,
  eventId: string
): Promise<{ day: TripDay }> {
  const res = await api.delete<ApiResponse<{ day: TripDay }>>(
    `/trips/${tripId}/events/${eventId}`
  );
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error || '删除事件失败');
  }
  return res.data.data;
}
