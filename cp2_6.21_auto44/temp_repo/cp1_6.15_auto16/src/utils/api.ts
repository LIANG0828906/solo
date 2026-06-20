import type { Artist, Slot, Booking } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || '请求失败') as Error & { suggestion?: string };
    error.suggestion = data.suggestion;
    throw error;
  }

  return data as T;
}

export function getArtists(): Promise<Artist[]> {
  return request<Artist[]>('/artists');
}

export function getSlots(artistId?: string, date?: string): Promise<Slot[]> {
  const params = new URLSearchParams();
  if (artistId) params.append('artistId', artistId);
  if (date) params.append('date', date);
  const query = params.toString();
  return request<Slot[]>(`/slots${query ? `?${query}` : ''}`);
}

export function createBooking(params: {
  artistId: string;
  date: string;
  startHour: number;
  userName: string;
  userPhone?: string;
}): Promise<Booking> {
  return request<Booking>('/booking', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function getBookings(): Promise<Booking[]> {
  return request<Booking[]>('/bookings');
}

export function cancelBooking(id: string): Promise<Booking> {
  return request<Booking>(`/bookings/${id}/cancel`, {
    method: 'PUT',
  });
}
