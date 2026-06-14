import { StorageUnit } from './types';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const calculateUnitVolume = (unit: StorageUnit): number => {
  return unit.width * unit.depth * unit.height;
};

export const calculateUsedVolume = (unit: StorageUnit): number => {
  return unit.items.reduce((sum, item) => sum + item.estimatedVolume * item.quantity, 0);
};

export const calculateUtilization = (unit: StorageUnit): number => {
  const total = calculateUnitVolume(unit);
  if (total === 0) return 0;
  return Math.min(100, (calculateUsedVolume(unit) / total) * 100);
};

export const getUtilizationColor = (utilization: number): string => {
  if (utilization <= 40) {
    const t = utilization / 40;
    return interpolateColor('#4CAF50', '#8BC34A', t);
  } else if (utilization <= 70) {
    const t = (utilization - 40) / 30;
    return interpolateColor('#8BC34A', '#FFC107', t);
  } else {
    const t = (utilization - 70) / 30;
    return interpolateColor('#FFC107', '#F44336', t);
  }
};

const interpolateColor = (color1: string, color2: string, t: number): string => {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
};

export const getEditorColor = (utilization: number, baseColor: string): string => {
  const alpha = 0.3 + (utilization / 100) * 0.6;
  return baseColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
};

export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const saveToLocalStorage = (key: string, data: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item) as T;
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return defaultValue;
};

export const exportToJSON = (data: unknown): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storage-plan-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};
