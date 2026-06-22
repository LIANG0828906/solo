import { parseISO, addMinutes, startOfDay, addDays, isBefore, isAfter, differenceInMinutes, setHours, setMinutes } from 'date-fns';
import type { Facility, Booking, TimeSlot, ConflictResult } from './types';

export function checkConflict(
  bookings: Booking[],
  facilityId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): ConflictResult {
  const conflictingBookings = bookings.filter((b) => {
    if (b.facilityId !== facilityId) return false;
    if (b.status === 'rejected') return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;

    const bStart = parseISO(b.startTime);
    const bEnd = parseISO(b.endTime);

    return isBefore(startTime, bEnd) && isAfter(endTime, bStart);
  });

  return {
    hasConflict: conflictingBookings.length > 0,
    conflictingBookings,
  };
}

export function findFreeSlots(
  bookings: Booking[],
  facility: Facility,
  desiredStart: Date,
  durationMinutes: number,
  count: number = 3
): TimeSlot[] {
  const results: TimeSlot[] = [];
  const now = new Date();
  if (desiredStart < now) {
    desiredStart = addMinutes(now, 30);
    desiredStart.setSeconds(0, 0);
  }

  const facilityBookings = bookings
    .filter((b) => b.facilityId === facility.id && b.status !== 'rejected')
    .map((b) => ({ start: parseISO(b.startTime), end: parseISO(b.endTime) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  let current = startOfDay(desiredStart);

  for (let dayOffset = 0; dayOffset < 14 && results.length < count; dayOffset++) {
    const dayStart = addDays(current, dayOffset);
    let slotStart = setHours(setMinutes(dayStart, 0), facility.openHour);
    const dayEnd = setHours(setMinutes(dayStart, 0), facility.closeHour);

    if (isBefore(dayEnd, now)) continue;
    if (isBefore(slotStart, now)) {
      slotStart = addMinutes(now, 30 - (now.getMinutes() % 30));
      slotStart.setSeconds(0, 0);
    }

    const dayBookings = facilityBookings.filter(
      (b) =>
        isAfter(b.end, dayStart) && isBefore(b.start, addDays(dayStart, 1))
    );

    while (
      isBefore(slotStart, dayEnd) &&
      isBefore(addMinutes(slotStart, durationMinutes), dayEnd) &&
      results.length < count
    ) {
      const slotEnd = addMinutes(slotStart, durationMinutes);

      const conflicts = dayBookings.some(
        (b) => isBefore(slotStart, b.end) && isAfter(slotEnd, b.start)
      );

      if (!conflicts) {
        results.push({ start: slotStart, end: slotEnd });
      }

      slotStart = addMinutes(slotStart, 30);
    }
  }

  return results;
}

export function validateBookingTime(
  facility: Facility,
  startTime: Date,
  endTime: Date
): { valid: boolean; error?: string } {
  if (isBefore(endTime, startTime)) {
    return { valid: false, error: '结束时间必须晚于开始时间' };
  }

  if (differenceInMinutes(endTime, startTime) < 30) {
    return { valid: false, error: '预约时长至少30分钟' };
  }

  if (differenceInMinutes(endTime, startTime) > 240) {
    return { valid: false, error: '单次预约最长4小时' };
  }

  const startHour = startTime.getHours() + startTime.getMinutes() / 60;
  const endHour = endTime.getHours() + endTime.getMinutes() / 60;

  if (startHour < facility.openHour || endHour > facility.closeHour) {
    return {
      valid: false,
      error: `预约时间必须在 ${facility.openHour}:00 - ${facility.closeHour}:00 之间`,
    };
  }

  if (startTime < new Date()) {
    return { valid: false, error: '不能预约过去的时间' };
  }

  return { valid: true };
}

export function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function toDateTimeString(date: Date): string {
  return date.toISOString();
}

export function parseDateTime(str: string): Date {
  return parseISO(str);
}
