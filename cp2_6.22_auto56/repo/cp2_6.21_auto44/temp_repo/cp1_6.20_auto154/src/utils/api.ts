import type {
  HeatmapResponse,
  ScheduleResponse,
  ScheduleItem,
  ConflictInfo,
  BookingData,
  StatsSummary,
  CourseRankingItem,
  TIME_SLOTS,
} from './types';

const BASE_URL = '/api';

export async function fetchHeatmap(period: 'week' | 'month'): Promise<HeatmapResponse> {
  const response = await fetch(`${BASE_URL}/heatmap?period=${period}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch heatmap: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSchedule(): Promise<ScheduleResponse> {
  const response = await fetch(`${BASE_URL}/schedule`);
  if (!response.ok) {
    throw new Error(`Failed to fetch schedule: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchBookings(): Promise<BookingData[]> {
  const response = await fetch(`${BASE_URL}/bookings`);
  if (!response.ok) {
    throw new Error(`Failed to fetch bookings: ${response.statusText}`);
  }
  return response.json();
}

export async function updateSchedule(
  itemId: string,
  newDate: string,
  newTimeSlot: number
): Promise<{ success: boolean; schedule: ScheduleItem[]; conflicts: ConflictInfo[] }> {
  const response = await fetch(`${BASE_URL}/schedule/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itemId,
      newDate,
      newTimeSlot,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update schedule: ${response.statusText}`);
  }
  return response.json();
}

export async function refreshData(): Promise<void> {
  const response = await fetch(`${BASE_URL}/refresh`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to refresh data: ${response.statusText}`);
  }
}

export function calculateStats(bookings: BookingData[], conflicts: ConflictInfo[], timeSlots: typeof TIME_SLOTS): StatsSummary {
  const totalBookings = bookings.reduce((sum, b) => sum + b.bookings, 0);
  
  const avgAttendance = bookings.length > 0
    ? Math.round((totalBookings / (bookings.length * 20)) * 100)
    : 0;

  const timeSlotCounts = new Map<number, number>();
  bookings.forEach(b => {
    const current = timeSlotCounts.get(b.timeSlot) || 0;
    timeSlotCounts.set(b.timeSlot, current + b.bookings);
  });

  let peakTimeSlotId = 0;
  let maxCount = 0;
  timeSlotCounts.forEach((count, id) => {
    if (count > maxCount) {
      maxCount = count;
      peakTimeSlotId = id;
    }
  });

  const peakTimeSlot = timeSlots.find(t => t.id === peakTimeSlotId)?.label || '09:00-10:00';
  const conflictCount = conflicts.length;

  return {
    totalBookings,
    avgAttendance,
    peakTimeSlot,
    conflictCount,
  };
}

export function calculateCourseRankings(bookings: BookingData[]): CourseRankingItem[] {
  const courseCounts = new Map<string, number>();
  bookings.forEach(b => {
    const current = courseCounts.get(b.courseType) || 0;
    courseCounts.set(b.courseType, current + b.bookings);
  });

  return Array.from(courseCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
