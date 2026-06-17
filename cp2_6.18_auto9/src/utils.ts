export const STORAGE_KEY = 'cloudcanvas_last_save';

export function saveToLocalStorage(data: unknown): void {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.error('保存到localStorage失败:', e);
  }
}

export function loadFromLocalStorage<T>(): T | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('从localStorage加载失败:', e);
    return null;
  }
}

export function generateTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export function generateFileName(): string {
  return `CloudCanvas_${generateTimestamp()}.json`;
}

export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
