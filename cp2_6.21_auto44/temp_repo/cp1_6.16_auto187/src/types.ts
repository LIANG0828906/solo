export type EventStatus = 'upcoming' | 'live' | 'finished';

export interface BetOption {
  id: string;
  name: string;
  odds: number;
}

export interface SportEvent {
  id: string;
  name: string;
  startTime: number;
  status: EventStatus;
  options: BetOption[];
  result?: string;
}

export interface Bet {
  id: string;
  userId: string;
  eventId: string;
  optionId: string;
  amount: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  points: number;
  wins: number;
  totalBets: number;
  avatar?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PlaceBetRequest {
  userId: string;
  eventId: string;
  optionId: string;
  amount: number;
}
