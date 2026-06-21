import { Activity, Participation } from './types';
import { v4 as uuidv4 } from 'uuid';

export const activities: Activity[] = [];
export const participations: Participation[] = [];

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateActivityCode(): string {
  let code: string;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
  } while (activities.some(a => a.code === code));
  return code;
}

export function generateId(): string {
  return uuidv4();
}
