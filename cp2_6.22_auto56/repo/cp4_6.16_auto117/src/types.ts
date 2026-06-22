export interface Team {
  id: string;
  name: string;
  memberCount: number;
  seatDemand: number;
  color: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  facilities: string[];
  imageUrl: string;
  status: 'available' | 'occupied' | 'maintenance';
  floor: number;
}

export interface Booking {
  id: string;
  roomId: string;
  teamId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxParticipants: number;
  registeredTeamIds: string[];
  createdAt: string;
}

export interface Seat {
  id: string;
  row: string;
  column: number;
  teamId: string | null;
  status: 'available' | 'occupied' | 'pending';
  tempTeamId: string | null;
}

export interface SeatSwapRequest {
  id: string;
  fromSeatId: string;
  toSeatId: string;
  teamId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Stats {
  roomUtilizationRate: number;
  teamSeatUtilization: Record<string, number>;
  weeklyEventRegistrations: number[];
  overallSpaceUtilization: number;
}

export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type SeatStatus = 'available' | 'occupied' | 'pending';
export type SwapRequestStatus = 'pending' | 'approved' | 'rejected';
