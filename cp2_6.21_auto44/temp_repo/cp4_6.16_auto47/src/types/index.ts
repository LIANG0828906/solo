export type DeskStatus = 'free' | 'booked' | 'checked-in';

export type TimeSlot = 'morning' | 'afternoon' | 'full';

export interface Desk {
  id: string;
  row: number;
  col: number;
  status: DeskStatus;
  bookedBy: string | null;
  timeSlot: TimeSlot | null;
  bookedDate: string | null;
  checkinTime: string | null;
}

export type OperationType = 'checkin' | 'checkout';

export interface CheckinRecord {
  id: string;
  userId: string;
  deskId: string;
  date: string;
  checkinTime: string | null;
  checkoutTime: string | null;
  workMinutes: number;
  operationType: OperationType;
  timestamp: string;
}

export interface DailyWorkHours {
  day: string;
  dayLabel: string;
  hours: number;
}

export interface WeeklyAttendanceRate {
  week: string;
  weekLabel: string;
  rate: number;
}
