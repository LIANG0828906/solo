export type KeyRole = 'admin' | 'editor' | 'reader';
export type KeyStatus = 'active' | 'revoked';

export interface Key {
  id: string;
  name: string;
  keyPrefix: string;
  encryptedKey: string;
  role: KeyRole;
  status: KeyStatus;
  createdAt: string;
  revealVisible: boolean;
  revealExpiresAt: number;
  plainKey?: string;
}

export interface UsageRecord {
  id: string;
  keyId: string;
  keyName: string;
  timestamp: string;
}

export interface DailyStat {
  date: string;
  count: number;
}

export interface KeyStats {
  total: number;
  activeKeys: number;
  dailyData: DailyStat[];
}

export interface KeyStore {
  keys: Key[];
  usageLogs: UsageRecord[];
  addKey: (name: string, role: KeyRole) => string;
  revokeKey: (id: string) => void;
  logUsage: (keyId: string) => void;
  getStats: (keyId?: string) => KeyStats;
  decryptKey: (encryptedKey: string) => string;
  hideReveal: (id: string) => void;
}
