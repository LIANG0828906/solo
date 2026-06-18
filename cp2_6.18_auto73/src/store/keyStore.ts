import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'keyvault-enc-2024';

export interface Key {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'reader';
  encryptedValue: string;
  prefix: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revealUntil: number;
}

export interface UsageRecord {
  id: string;
  keyId: string;
  keyName: string;
  timestamp: string;
}

interface KeyState {
  keys: Key[];
  usageLogs: UsageRecord[];
  addKey: (name: string, role: 'admin' | 'editor' | 'reader') => string;
  revokeKey: (id: string) => void;
  logUsage: (keyId: string) => void;
  getStats: (filterKeyId?: string) => { date: string; count: number }[];
  getActiveKeyCount: () => number;
  getTotalUsage: () => number;
}

function generateRandomKey(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

function encryptValue(value: string): string {
  return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
}

function decryptValue(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const useKeyStore = create<KeyState>((set, get) => ({
  keys: loadFromStorage<Key[]>('keyvault-keys', []),
  usageLogs: loadFromStorage<UsageRecord[]>('keyvault-usage', []),

  addKey: (name: string, role: 'admin' | 'editor' | 'reader') => {
    const rawKey = generateRandomKey(32);
    const encryptedValue = encryptValue(rawKey);
    const prefix = rawKey.substring(0, 8);
    const newKey: Key = {
      id: uuidv4(),
      name,
      role,
      encryptedValue,
      prefix,
      status: 'active',
      createdAt: new Date().toISOString(),
      revealUntil: Date.now() + 15000,
    };

    set((state) => {
      const updatedKeys = [newKey, ...state.keys];
      saveToStorage('keyvault-keys', updatedKeys);
      return { keys: updatedKeys };
    });

    return rawKey;
  },

  revokeKey: (id: string) => {
    set((state) => {
      const updatedKeys = state.keys.map((k) =>
        k.id === id ? { ...k, status: 'revoked' as const } : k
      );
      saveToStorage('keyvault-keys', updatedKeys);
      return { keys: updatedKeys };
    });
  },

  logUsage: (keyId: string) => {
    const key = get().keys.find((k) => k.id === keyId);
    if (!key) return;
    const record: UsageRecord = {
      id: uuidv4(),
      keyId,
      keyName: key.name,
      timestamp: new Date().toISOString(),
    };
    set((state) => {
      const updatedLogs = [...state.usageLogs, record];
      saveToStorage('keyvault-usage', updatedLogs);
      return { usageLogs: updatedLogs };
    });
  },

  getStats: (filterKeyId?: string) => {
    const logs = get().usageLogs;
    const now = new Date();
    const days: { date: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, count: 0 });
    }

    const filtered = filterKeyId
      ? logs.filter((l) => l.keyId === filterKeyId)
      : logs;

    for (const log of filtered) {
      const logDate = log.timestamp.split('T')[0];
      const dayEntry = days.find((d) => d.date === logDate);
      if (dayEntry) {
        dayEntry.count++;
      }
    }

    return days;
  },

  getActiveKeyCount: () => {
    return get().keys.filter((k) => k.status === 'active').length;
  },

  getTotalUsage: () => {
    return get().usageLogs.length;
  },
}));

export { decryptValue };
