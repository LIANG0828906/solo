import { v4 as uuidv4 } from 'uuid';

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function generateId(): string {
  return uuidv4();
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function arraysEqual<T>(a: T[], b: T[], comparator: (x: T, y: T) => boolean = (x, y) => x === y): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!comparator(a[i], b[i])) return false;
  }
  return true;
}

export function cellsEqual(cell1: { x: number; y: number }, cell2: { x: number; y: number }): boolean {
  return cell1.x === cell2.x && cell1.y === cell2.y;
}

export function includesCell(cells: { x: number; y: number }[], target: { x: number; y: number }): boolean {
  return cells.some(cell => cellsEqual(cell, target));
}

export function getDistance(cell1: { x: number; y: number }, cell2: { x: number; y: number }): number {
  return Math.max(Math.abs(cell1.x - cell2.x), Math.abs(cell1.y - cell2.y));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
