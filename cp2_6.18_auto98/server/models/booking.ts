import { v4 as uuidv4 } from 'uuid';

export interface Booking {
  id: string;
  resourceType: 'desk' | 'room';
  resourceId: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
}

let bookings: Booking[] = [];

export interface CreateBookingData {
  resourceType: 'desk' | 'room';
  resourceId: string;
  userName: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

export interface ConflictInfo {
  conflict: true;
  message: string;
}

export function create(data: CreateBookingData): Booking | ConflictInfo {
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  const conflictBooking = bookings.find(
    (b) =>
      b.resourceType === data.resourceType &&
      b.resourceId === data.resourceId &&
      startTime < new Date(b.endTime) &&
      endTime > new Date(b.startTime)
  );

  if (conflictBooking) {
    const formatDate = (d: Date) => {
      const date = new Date(d);
      return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    return {
      conflict: true,
      message: `资源冲突：该${data.resourceType === 'desk' ? '工位' : '会议室'}在 ${formatDate(conflictBooking.startTime)} - ${formatDate(conflictBooking.endTime)} 已被预订`,
    };
  }

  const booking: Booking = {
    id: uuidv4(),
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    userName: data.userName,
    startTime,
    endTime,
    purpose: data.purpose,
  };

  bookings.push(booking);
  return booking;
}

export function list(): Booking[] {
  return [...bookings];
}

export function remove(id: string): boolean {
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return false;
  bookings.splice(index, 1);
  return true;
}
