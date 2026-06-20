export type BookingStatus = 'pending' | 'confirmed' | 'rejected';

export type UserRole = 'admin' | 'resident';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  roomNumber?: string;
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  maxCapacity: number;
  openHour: number;
  closeHour: number;
  feePerHour: number;
  icon?: string;
}

export interface Booking {
  id: string;
  facilityId: string;
  userId: string;
  userName: string;
  userRoom?: string;
  purpose: string;
  peopleCount: number;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  rejectReason?: string;
  rejectSuggestion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingBookings: Booking[];
}

export interface FacilityStats {
  facilityId: string;
  facilityName: string;
  totalBookings: number;
  utilizationRate: number;
}

export interface DailyStats {
  date: string;
  count: number;
}
