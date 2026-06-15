import { v4 as uuidv4 } from 'uuid';
import { differenceInDays, format } from 'date-fns';

export interface Storyboard {
  id: string;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  shareCode: string;
  authorNickname: string;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  storyboardId: string;
  type: 'upload' | 'url';
  imageUrl: string;
  note: string;
  order: number;
  createdAt: string;
}

const GRADIENT_PAIRS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
  ['#f5576c', '#ff9a9e'],
  ['#667eea', '#43e97b'],
];

export function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateId(): string {
  return uuidv4();
}

export function getRandomGradient(): [string, string] {
  const pair = GRADIENT_PAIRS[Math.floor(Math.random() * GRADIENT_PAIRS.length)];
  return [pair[0], pair[1]];
}

export function getDaysSince(dateStr: string): number {
  return differenceInDays(new Date(), new Date(dateStr));
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'yyyy-MM-dd HH:mm');
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), 'MM/dd');
}

export async function exportAsImage(elementId: string, fileName: string): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const element = document.getElementById(elementId);
  if (!element) return;
  const canvas = await html2canvas(element, {
    backgroundColor: '#0f0f1a',
    scale: 2,
    useCORS: true,
    allowTaint: true,
  });
  const link = document.createElement('a');
  link.download = `${fileName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function createStoryboard(title: string, description: string): Storyboard {
  const [gradientFrom, gradientTo] = getRandomGradient();
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title,
    description,
    gradientFrom,
    gradientTo,
    shareCode: generateShareCode(),
    authorNickname: '创作者',
    createdAt: now,
    updatedAt: now,
  };
}

export function createMaterial(
  storyboardId: string,
  type: 'upload' | 'url',
  imageUrl: string,
  order: number
): Material {
  return {
    id: generateId(),
    storyboardId,
    type,
    imageUrl,
    note: '',
    order,
    createdAt: new Date().toISOString(),
  };
}
