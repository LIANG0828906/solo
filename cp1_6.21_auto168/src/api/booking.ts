import { apiClient } from './client';
import type { Booking, TimeSlot, Review } from '@/types';

export interface FetchBookingsParams {
  teacherId?: string;
  skillId?: string;
}

export interface CreateBookingData {
  skillId: string;
  studentId: string;
  startTime: string;
  endTime: string;
}

export interface EvaluateBookingData {
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  averageRating: number;
  reviewCount: number;
  skillCount: number;
}

export async function fetchBookings(params?: FetchBookingsParams): Promise<Booking[]> {
  const response = await apiClient.get<Booking[]>('/bookings', { params });
  return response.data;
}

export async function fetchTimeSlots(teacherId: string, skillId: string): Promise<TimeSlot[]> {
  const response = await apiClient.get<TimeSlot[]>(`/teachers/${teacherId}/skills/${skillId}/timeslots`);
  return response.data;
}

export async function createBooking(data: CreateBookingData): Promise<Booking> {
  const response = await apiClient.post<Booking>('/bookings', data);
  return response.data;
}

export async function evaluateBooking(data: EvaluateBookingData): Promise<Review> {
  const response = await apiClient.post<Review>('/reviews', data);
  return response.data;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await apiClient.get<LeaderboardEntry[]>('/leaderboard');
  return response.data;
}
