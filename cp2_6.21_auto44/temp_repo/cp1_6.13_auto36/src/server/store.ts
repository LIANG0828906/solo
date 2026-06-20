import { v4 as uuidv4 } from 'uuid';

export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  code: string;
  qrCode: string;
  createdAt: string;
}

export interface CheckInRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  participantName: string;
  checkInTime: string;
}

const events = new Map<string, Event>();
const checkIns = new Map<string, CheckInRecord>();
const eventCheckInsMap = new Map<string, Set<string>>();

export function generateEventCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateUniqueEventCode(): string {
  let code: string;
  do {
    code = generateEventCode();
  } while (isCodeUsed(code));
  return code;
}

export function isCodeUsed(code: string): boolean {
  for (const event of events.values()) {
    if (event.code === code) return true;
  }
  return false;
}

export function createEvent(data: Omit<Event, 'id' | 'code' | 'qrCode' | 'createdAt'>): Event {
  const id = uuidv4();
  const code = generateUniqueEventCode();
  const now = new Date().toISOString();
  const event: Event = {
    ...data,
    id,
    code,
    qrCode: `eventsnap://checkin?code=${code}`,
    createdAt: now,
  };
  events.set(id, event);
  eventCheckInsMap.set(id, new Set());
  return event;
}

export function getEventById(id: string): Event | undefined {
  return events.get(id);
}

export function getEventByCode(code: string): Event | undefined {
  for (const event of events.values()) {
    if (event.code === code) return event;
  }
  return undefined;
}

export function getAllEvents(): Event[] {
  return Array.from(events.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getEventStatus(event: Event): 'upcoming' | 'ongoing' | 'ended' {
  const now = Date.now();
  const start = new Date(event.startTime).getTime();
  const end = new Date(event.endTime).getTime();
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'ongoing';
}

export function getCheckInCount(eventId: string): number {
  return eventCheckInsMap.get(eventId)?.size || 0;
}

export function hasParticipantCheckedIn(eventId: string, participantName: string): boolean {
  const checkIns = getEventCheckIns(eventId);
  const normalizedName = participantName.trim().toLowerCase();
  return checkIns.some(
    r => r.participantName.trim().toLowerCase() === normalizedName
  );
}

export function createCheckIn(
  eventId: string,
  participantName: string
): CheckInRecord {
  const event = events.get(eventId)!;
  const id = uuidv4();
  const record: CheckInRecord = {
    id,
    eventId,
    eventTitle: event.title,
    participantName: participantName.trim(),
    checkInTime: new Date().toISOString(),
  };
  checkIns.set(id, record);
  eventCheckInsMap.get(eventId)?.add(id);
  return record;
}

export function getEventCheckIns(eventId: string): CheckInRecord[] {
  const ids = eventCheckInsMap.get(eventId);
  if (!ids) return [];
  return Array.from(ids)
    .map(id => checkIns.get(id)!)
    .filter(Boolean)
    .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
}

export function getAllCheckIns(limit?: number): CheckInRecord[] {
  const all = Array.from(checkIns.values()).sort(
    (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
  );
  if (limit) return all.slice(0, limit);
  return all;
}
