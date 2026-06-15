import axios from 'axios';
import { MenuItem, Booking, BookingStatus, PurchaseList } from '../../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  const response = await api.get<MenuItem[]>('/menu');
  return response.data;
};

export const createMenuItem = async (
  item: Omit<MenuItem, 'id' | 'remaining'>
): Promise<MenuItem> => {
  const response = await api.post<MenuItem>('/menu', item);
  return response.data;
};

export const updateMenuItem = async (
  id: string,
  updates: Partial<MenuItem>
): Promise<MenuItem> => {
  const response = await api.put<MenuItem>(`/menu/${id}`, updates);
  return response.data;
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  await api.delete(`/menu/${id}`);
};

export const fetchBookings = async (date?: string): Promise<Booking[]> => {
  const response = await api.get<Booking[]>('/booking', {
    params: date ? { date } : undefined,
  });
  return response.data;
};

export const createBooking = async (
  booking: Omit<Booking, 'id' | 'status' | 'createdAt'>
): Promise<Booking> => {
  const response = await api.post<Booking>('/booking', booking);
  return response.data;
};

export const updateBookingStatus = async (
  id: string,
  status: BookingStatus
): Promise<Booking> => {
  const response = await api.patch<Booking>(`/booking/${id}/status`, { status });
  return response.data;
};

export const generatePurchaseList = async (date: string): Promise<PurchaseList> => {
  const response = await api.post<PurchaseList>('/purchase', { date });
  return response.data;
};
