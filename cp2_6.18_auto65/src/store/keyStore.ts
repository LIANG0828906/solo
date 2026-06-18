import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Key, UsageRecord, KeyRole, KeyStats, DailyStat } from '../types';
import { generateRandomKey, encryptKey, decryptKey } from '../utils/crypto';
import { loadKeys, saveKeys, loadUsageLogs, saveUsageLogs } from '../utils/storage';

interface KeyStoreState {
  keys: Key[];
  usageLogs: UsageRecord[];
  addKey: (name: string, role: KeyRole) => string;
  revokeKey: (id: string) => void;
  logUsage: (keyId: string) => void;
  getStats: (keyId?: string) => KeyStats;
  decryptKey: (encryptedKey: string) => string;
  hideReveal: (id: string) => void;
}

const REVEAL_DURATION = 15 * 1000;

function initializeKeys(): Key[] {
  const stored = loadKeys() as Key[];
  const now = Date.now();
  return stored.map((key) => {
    if (key.revealVisible && key.revealExpiresAt && key.revealExpiresAt <= now) {
      return { ...key, revealVisible: false, plainKey: undefined };
    }
    return { ...key, plainKey: undefined };
  });
}

function persistKeys(keys: Key[]): void {
  const toSave = keys.map((key) => {
    const { plainKey, ...rest } = key;
    return rest;
  });
  saveKeys(toSave);
}

export const useKeyStore = create<KeyStoreState>((set, get) => ({
  keys: initializeKeys(),
  usageLogs: loadUsageLogs() as UsageRecord[],

  addKey: (name: string, role: KeyRole) => {
    const plainKey = generateRandomKey(32);
    const encrypted = encryptKey(plainKey);
    const now = new Date().toISOString();
    const newKey: Key = {
      id: uuidv4(),
      name,
      keyPrefix: plainKey.substring(0, 8),
      encryptedKey: encrypted,
      role,
      status: 'active',
      createdAt: now,
      revealVisible: true,
      revealExpiresAt: Date.now() + REVEAL_DURATION,
      plainKey,
    };

    set((state) => {
      const newKeys = [newKey, ...state.keys];
      setTimeout(() => persistKeys(newKeys), 0);
      return { keys: newKeys };
    });

    setTimeout(() => {
      set((state) => ({
        keys: state.keys.map((k) =>
          k.id === newKey.id ? { ...k, revealVisible: false, plainKey: undefined } : k
        ),
      }));
    }, REVEAL_DURATION);

    return plainKey;
  },

  revokeKey: (id: string) => {
    set((state) => {
      const newKeys = state.keys.map((k) =>
        k.id === id ? { ...k, status: 'revoked' as const } : k
      );
      setTimeout(() => persistKeys(newKeys), 0);
      return { keys: newKeys };
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
      const newLogs = [record, ...state.usageLogs];
      setTimeout(() => saveUsageLogs(newLogs), 0);
      return { usageLogs: newLogs };
    });
  },

  getStats: (keyId?: string): KeyStats => {
    const { keys, usageLogs } = get();
    const filteredLogs = keyId
      ? usageLogs.filter((log) => log.keyId === keyId)
      : usageLogs;

    const activeKeys = keys.filter((k) => k.status === 'active').length;

    const dailyMap = new Map<string, number>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, 0);
    }

    filteredLogs.forEach((log) => {
      const dateStr = log.timestamp.split('T')[0];
      if (dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
      }
    });

    const dailyData: DailyStat[] = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      total: filteredLogs.length,
      activeKeys,
      dailyData,
    };
  },

  decryptKey: (encryptedKey: string) => {
    return decryptKey(encryptedKey);
  },

  hideReveal: (id: string) => {
    set((state) => ({
      keys: state.keys.map((k) =>
        k.id === id ? { ...k, revealVisible: false, plainKey: undefined } : k
      ),
    }));
  },
}));
