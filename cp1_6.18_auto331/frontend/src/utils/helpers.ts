import { VOWEL_COLORS, FAMILY_COLORS } from '../types';

export function getVowelColor(ipa: string): string {
  const ipaClean = ipa.replace(/[/\[\]]/g, '');
  
  const vowels = ['i:', 'ɪ', 'i', 'e', 'ɛ', 'æ', 'a:', 'a', 'ʌ', 'ə', 'ɜ:', 'u:', 'ʊ', 'u', 'o', 'ɔ:', 'ɔ', '3', 'y', 'ø', 'œ'];
  
  for (const vowel of vowels) {
    if (ipaClean.includes(vowel) && VOWEL_COLORS[vowel]) {
      return VOWEL_COLORS[vowel];
    }
  }
  
  return '#7C4DFF';
}

export function getFamilyColor(family: string): string {
  return FAMILY_COLORS[family] || '#78909C';
}

export function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeWaveform(data: number[], targetLength: number): number[] {
  if (data.length === 0) return new Array(targetLength).fill(0);
  if (data.length === targetLength) return [...data];
  
  const result: number[] = [];
  const step = data.length / targetLength;
  
  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    let sum = 0;
    let count = 0;
    
    for (let j = start; j < end && j < data.length; j++) {
      sum += data[j];
      count++;
    }
    
    result.push(count > 0 ? sum / count : 0);
  }
  
  return result;
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  if (!c1 || !c2) return color1;
  
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
