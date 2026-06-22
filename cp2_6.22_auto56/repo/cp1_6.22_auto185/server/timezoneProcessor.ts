import type { TeamMember, TimeSlot, Recommendation } from './types';

export const TIMEZONE_OFFSETS: { [key: string]: number } = {
  'UTC-12': -12, 'UTC-11': -11, 'UTC-10': -10, 'UTC-9:30': -9.5,
  'UTC-9': -9, 'UTC-8': -8, 'UTC-7': -7, 'UTC-6': -6, 'UTC-5': -5,
  'UTC-4': -4, 'UTC-3:30': -3.5, 'UTC-3': -3, 'UTC-2': -2, 'UTC-1': -1,
  'UTC+0': 0, 'UTC+1': 1, 'UTC+2': 2, 'UTC+3': 3, 'UTC+3:30': 3.5,
  'UTC+4': 4, 'UTC+4:30': 4.5, 'UTC+5': 5, 'UTC+5:30': 5.5, 'UTC+5:45': 5.75,
  'UTC+6': 6, 'UTC+6:30': 6.5, 'UTC+7': 7, 'UTC+8': 8, 'UTC+8:45': 8.75,
  'UTC+9': 9, 'UTC+9:30': 9.5, 'UTC+10': 10, 'UTC+10:30': 10.5, 'UTC+11': 11,
  'UTC+12': 12, 'UTC+12:45': 12.75, 'UTC+13': 13, 'UTC+14': 14,
};

export const ALL_TIMEZONES = Object.keys(TIMEZONE_OFFSETS);

export function getTimezoneOffset(timezone: string): number {
  return TIMEZONE_OFFSETS[timezone] ?? 0;
}

export function localHourToUTC(localHour: number, timezone: string): number {
  const offset = getTimezoneOffset(timezone);
  let utcHour = localHour - offset;
  while (utcHour < 0) utcHour += 24;
  while (utcHour >= 24) utcHour -= 24;
  return Math.floor(utcHour);
}

export function utcHourToLocal(utcHour: number, timezone: string): number {
  const offset = getTimezoneOffset(timezone);
  let localHour = utcHour + offset;
  while (localHour < 0) localHour += 24;
  while (localHour >= 24) localHour -= 24;
  return Math.floor(localHour);
}

export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getUTCDay();
}

export function isMemberAvailableAtHour(
  member: TeamMember,
  utcHour: number,
  dateStr: string
): boolean {
  const dayOfWeek = getDayOfWeek(dateStr);
  const availableHours = member.availability[dayOfWeek] || [];
  const localHour = utcHourToLocal(utcHour, member.timezone);
  return availableHours.includes(localHour);
}

export function buildHourlyAvailabilityMatrix(
  members: TeamMember[],
  dateStr: string
): { [utcHour: number]: string[] } {
  const matrix: { [utcHour: number]: string[] } = {};
  for (let hour = 0; hour < 24; hour++) {
    matrix[hour] = [];
    for (const member of members) {
      if (isMemberAvailableAtHour(member, hour, dateStr)) {
        matrix[hour].push(member.id);
      }
    }
  }
  return matrix;
}

export function findContiguousAvailableSlots(
  members: TeamMember[],
  dateStr: string
): TimeSlot[] {
  const matrix = buildHourlyAvailabilityMatrix(members, dateStr);
  const slots: TimeSlot[] = [];
  const totalMembers = members.length;

  let startHour = 0;
  let currentMembers: string[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const hourMembers = matrix[hour];
    const commonMembers = currentMembers.length === 0
      ? hourMembers
      : currentMembers.filter(id => hourMembers.includes(id));

    if (commonMembers.length >= Math.max(1, Math.floor(totalMembers * 0.5))) {
      if (currentMembers.length === 0) {
        startHour = hour;
      }
      currentMembers = commonMembers;
    } else {
      if (currentMembers.length > 0 && hour - startHour >= 1) {
        slots.push({
          startHourUTC: startHour,
          endHourUTC: hour,
          durationHours: hour - startHour,
          availableMemberIds: [...currentMembers],
          unavailableMemberIds: members.map(m => m.id).filter(id => !currentMembers.includes(id)),
        });
      }
      startHour = hour;
      currentMembers = hourMembers.length >= Math.max(1, Math.floor(totalMembers * 0.5)) ? hourMembers : [];
    }
  }

  if (currentMembers.length > 0 && 24 - startHour >= 1) {
    slots.push({
      startHourUTC: startHour,
      endHourUTC: 24,
      durationHours: 24 - startHour,
      availableMemberIds: [...currentMembers],
      unavailableMemberIds: members.map(m => m.id).filter(id => !currentMembers.includes(id)),
    });
  }

  return slots;
}

export function getTopRecommendations(
  members: TeamMember[],
  dateStr: string,
  topN: number = 5
): Recommendation[] {
  const slots = findContiguousAvailableSlots(members, dateStr);
  const totalMembers = members.length;

  const scored = slots.map(slot => ({
    startHourUTC: slot.startHourUTC,
    endHourUTC: slot.endHourUTC,
    availableMemberIds: slot.availableMemberIds,
    score: (slot.availableMemberIds.length / totalMembers) * 100 + slot.durationHours * 10,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

export function timeSlotsIntersect(
  startA: number, endA: number,
  startB: number, endB: number
): boolean {
  return startA < endB && startB < endA;
}

export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function formatHourRange(startHour: number, endHour: number): string {
  return `${formatHour(startHour)}-${formatHour(endHour)}`;
}
