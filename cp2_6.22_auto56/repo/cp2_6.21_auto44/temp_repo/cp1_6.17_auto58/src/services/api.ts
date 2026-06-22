import type { Work, Booking, BookingRequest, Category } from '../types';

const API_BASE_URL = '/api';

export async function fetchWorks(category: Category): Promise<Work[]> {
  const url = category === 'all' 
    ? `${API_BASE_URL}/works` 
    : `${API_BASE_URL}/works?category=${category}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch works');
  const data = await response.json();
  return data.data || data;
}

export async function fetchBookings(): Promise<Booking[]> {
  const response = await fetch(`${API_BASE_URL}/bookings`);
  if (!response.ok) throw new Error('Failed to fetch bookings');
  const data = await response.json();
  return data.data || data;
}

export async function createBooking(data: BookingRequest): Promise<Booking> {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create booking');
  const result = await response.json();
  return result.data || result;
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update booking status');
  const result = await response.json();
  return result.data || result;
}
