export interface RoomStyleState {
  wallColor: string;
  floorColor: string;
  furnitureColor: string;
  styleId: string;
}

export interface SchemeData {
  name: string;
  timestamp: number;
  roomStyles: Record<string, RoomStyleState>;
  thumbnail: string;
}

const STORAGE_PREFIX = 'easydeco_scheme_';

export function saveScheme(scheme: SchemeData): void {
  try {
    const key = STORAGE_PREFIX + scheme.name;
    localStorage.setItem(key, JSON.stringify(scheme));
  } catch (e) {
    console.error('Failed to save scheme:', e);
  }
}

export function loadScheme(name: string): SchemeData | null {
  try {
    const key = STORAGE_PREFIX + name;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as SchemeData;
  } catch (e) {
    console.error('Failed to load scheme:', e);
    return null;
  }
}

export function deleteScheme(name: string): void {
  try {
    const key = STORAGE_PREFIX + name;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to delete scheme:', e);
  }
}

export function listSchemes(): SchemeData[] {
  const schemes: SchemeData[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          schemes.push(JSON.parse(data) as SchemeData);
        }
      }
    }
    schemes.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error('Failed to list schemes:', e);
  }
  return schemes;
}
