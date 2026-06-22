import type { Booking, Team, Event, Seat } from '../types';
import { parseTime, getWeekDates } from './dateUtils';

export const calculateRoomUtilizationRate = (
  bookings: Booking[],
  date: string,
  startHour: number = 8,
  endHour: number = 22
): number => {
  const totalMinutes = (endHour - startHour) * 60;
  const dayBookings = bookings.filter(b => b.date === date);
  
  const bookedMinutes = dayBookings.reduce((total, booking) => {
    const start = parseTime(booking.startTime);
    const end = parseTime(booking.endTime);
    return total + (end - start);
  }, 0);
  
  return totalMinutes > 0 ? Math.round((bookedMinutes / totalMinutes) * 100) : 0;
};

export const calculateTeamSeatUtilization = (
  teams: Team[],
  seats: Seat[]
): Record<string, number> => {
  const utilization: Record<string, number> = {};
  
  teams.forEach(team => {
    const teamSeats = seats.filter(s => s.teamId === team.id);
    const assignedSeats = teamSeats.length;
    utilization[team.id] = assignedSeats > 0 
      ? Math.round((team.memberCount / assignedSeats) * 100) 
      : 0;
  });
  
  return utilization;
};

export const calculateWeeklyEventRegistrations = (events: Event[]): number[] => {
  const weekDates = getWeekDates();
  const dailyCounts: number[] = Array(7).fill(0);
  
  events.forEach(event => {
    const dayIndex = weekDates.indexOf(event.date);
    if (dayIndex !== -1) {
      dailyCounts[dayIndex] += event.registeredTeamIds.length;
    }
  });
  
  return dailyCounts;
};

export const calculateOverallSpaceUtilization = (
  seats: Seat[],
  totalSeats: number = 60
): number => {
  const occupiedSeats = seats.filter(s => s.teamId !== null).length;
  return totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
};

export const calculateTeamActivity = (
  teamId: string,
  bookings: Booking[],
  events: Event[]
): { bookings: number; events: number; score: number } => {
  const teamBookings = bookings.filter(b => b.teamId === teamId).length;
  const teamEvents = events.filter(e => e.registeredTeamIds.includes(teamId)).length;
  const score = teamBookings * 10 + teamEvents * 5;
  
  return { bookings: teamBookings, events: teamEvents, score };
};

export const getPeakBookingHours = (bookings: Booking[], date: string): number[] => {
  const hourCounts: number[] = Array(24).fill(0);
  const dayBookings = bookings.filter(b => b.date === date);
  
  dayBookings.forEach(booking => {
    const startHour = parseInt(booking.startTime.split(':')[0]);
    const endHour = parseInt(booking.endTime.split(':')[0]);
    for (let h = startHour; h < endHour; h++) {
      hourCounts[h]++;
    }
  });
  
  return hourCounts;
};

export const formatPercentage = (value: number): string => {
  return `${value}%`;
};

export const getTrendDirection = (current: number, previous: number): 'up' | 'down' | 'stable' => {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
};
