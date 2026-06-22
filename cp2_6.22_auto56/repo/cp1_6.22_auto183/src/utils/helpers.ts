export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'steam' | 'lava';

export const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#FF4500',
  water: '#1E90FF',
  wind: '#32CD32',
  earth: '#8B4513',
  steam: '#87CEEB',
  lava: '#FF6347'
};

export const ELEMENT_GRADIENTS: Record<ElementType, [string, string]> = {
  fire: ['#FF4500', '#FF8C00'],
  water: ['#1E90FF', '#00BFFF'],
  wind: ['#32CD32', '#90EE90'],
  earth: ['#8B4513', '#A0522D'],
  steam: ['#87CEEB', '#E0FFFF'],
  lava: ['#FF6347', '#FF4500']
};

export function getElementColor(element: ElementType): string {
  return ELEMENT_COLORS[element];
}

export function generateSequence(length: number, elements: ElementType[]): ElementType[] {
  const sequence: ElementType[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(elements[Math.floor(Math.random() * elements.length)]);
  }
  return sequence;
}

export function encryptSequence(sequence: ElementType[]): string {
  return btoa(JSON.stringify(sequence));
}

export function decryptSequence(encrypted: string): ElementType[] {
  return JSON.parse(atob(encrypted));
}
