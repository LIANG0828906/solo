import * as fs from 'fs';
import * as path from 'path';

export interface EventData {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  maxCapacity: number;
  roleLimits: Record<string, number>;
  createdAt: string;
}

export interface ParticipantData {
  id: string;
  eventId: string;
  name: string;
  contact: string;
  role: string;
  checkInCode: string;
  checkedIn: boolean;
  checkInTime: string | null;
  registeredAt: string;
}

const EVENTS_FILE = path.join(__dirname, '..', 'data', 'events.json');
const PARTICIPANTS_FILE = path.join(__dirname, '..', 'data', 'participants.json');

async function ensureFileExists(filePath: string, defaultContent: string): Promise<void> {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        const dir = path.dirname(filePath);
        fs.mkdir(dir, { recursive: true }, () => {
          fs.writeFile(filePath, defaultContent, () => resolve());
        });
      } else {
        resolve();
      }
    });
  });
}

export async function getEvents(): Promise<EventData[]> {
  await ensureFileExists(EVENTS_FILE, '[]');
  return new Promise((resolve, reject) => {
    fs.readFile(EVENTS_FILE, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data || '[]'));
    });
  });
}

export async function saveEvents(events: EventData[]): Promise<void> {
  await ensureFileExists(EVENTS_FILE, '[]');
  return new Promise((resolve, reject) => {
    fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function getParticipants(): Promise<ParticipantData[]> {
  await ensureFileExists(PARTICIPANTS_FILE, '[]');
  return new Promise((resolve, reject) => {
    fs.readFile(PARTICIPANTS_FILE, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data || '[]'));
    });
  });
}

export async function saveParticipants(participants: ParticipantData[]): Promise<void> {
  await ensureFileExists(PARTICIPANTS_FILE, '[]');
  return new Promise((resolve, reject) => {
    fs.writeFile(PARTICIPANTS_FILE, JSON.stringify(participants, null, 2), 'utf8', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
