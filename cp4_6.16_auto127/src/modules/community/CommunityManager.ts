import { v4 as uuidv4 } from 'uuid';
import { useEventStore } from '../../store/eventStore';
import type { CommunityEvent } from '../../types';

export interface CreateEventInput {
  title: string;
  description: string;
  date: number;
  location: string;
  maxAttendees: number;
}

export async function createEvent(input: CreateEventInput): Promise<CommunityEvent> {
  const event: CommunityEvent = {
    eventId: uuidv4(),
    title: input.title,
    description: input.description,
    date: input.date,
    location: input.location,
    maxAttendees: Math.max(1, input.maxAttendees),
    registeredIds: [],
    createdAt: Date.now(),
  };
  await useEventStore.getState().createEvent(event);
  return event;
}

export async function registerEvent(eventId: string, userId: string): Promise<boolean> {
  return useEventStore.getState().registerEvent(eventId, userId);
}

export async function cancelRegistration(eventId: string, userId: string): Promise<void> {
  await useEventStore.getState().cancelRegistration(eventId, userId);
}

export function getAllEvents(): CommunityEvent[] {
  return [...useEventStore.getState().events].sort((a, b) => a.date - b.date);
}

export function getUpcomingEvents(): CommunityEvent[] {
  return useEventStore.getState().getUpcomingEvents();
}

export function getEventById(eventId: string): CommunityEvent | undefined {
  return useEventStore.getState().getEventById(eventId);
}

export function getThisMonthEventsCount(): number {
  return useEventStore.getState().getThisMonthEventsCount();
}

export function getRegisteredCount(event: CommunityEvent): number {
  return event.registeredIds.length;
}

export function getRemainingSpots(event: CommunityEvent): number {
  return Math.max(0, event.maxAttendees - event.registeredIds.length);
}

export function isFull(event: CommunityEvent): boolean {
  return event.registeredIds.length >= event.maxAttendees;
}

export function isRegistered(event: CommunityEvent, userId: string): boolean {
  return event.registeredIds.includes(userId);
}

export function getFillPercentage(event: CommunityEvent): number {
  if (event.maxAttendees <= 0) return 100;
  return Math.min(100, (event.registeredIds.length / event.maxAttendees) * 100);
}

export function formatEventDate(date: number): string {
  const d = new Date(date);
  const now = new Date();
  const diff = date - Date.now();
  const days = Math.ceil(diff / 86400000);

  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`;
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  let relative = '';
  if (days < 0) relative = '已结束';
  else if (days === 0) relative = '今天';
  else if (days === 1) relative = '明天';
  else if (days < 7) relative = `${days}天后`;
  else if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) relative = '本月';

  return `${dateStr} ${timeStr}${relative ? ` · ${relative}` : ''}`;
}
