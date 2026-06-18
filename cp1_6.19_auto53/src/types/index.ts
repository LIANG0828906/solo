export type GameCategory = '围棋' | '象棋' | '国际象棋' | '桌游';

export type ReservationStatus = 'pending' | 'completed' | 'overdue';

export interface Game {
  id: string;
  name: string;
  category: GameCategory;
  description: string;
  players: string;
  popularity: number;
  image: string;
  avgRating: number;
  totalRatings: number;
  available: boolean;
}

export interface Reservation {
  id: string;
  userId: string;
  gameId: string;
  gameName: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  createdAt: string;
  rating?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
}

export interface DashboardStats {
  totalReservations: number;
  todayReservations: number;
  overdueRate: number;
}
