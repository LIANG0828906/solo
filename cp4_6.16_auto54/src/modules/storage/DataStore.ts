import { get, set } from 'idb-keyval';
import { v4 } from 'uuid';
import {
  deriveKey,
  generateSalt,
  generateIV,
  encrypt,
  decrypt,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from '../crypto/CryptoService';

export type Category = 'social' | 'finance' | 'work' | 'other';

export interface VaultEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  category: Category;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

interface StoredEntry {
  id: string;
  encryptedData: string;
  iv: string;
  category: Category;
  createdAt: number;
  updatedAt: number;
}

interface VerificationData {
  encrypted: string;
  iv: string;
}

export async function init(): Promise<void> {}

export async function hasMasterKey(): Promise<boolean> {
  const salt = await get('master_salt');
  return salt !== undefined && salt !== null;
}

export async function saveSalt(salt: Uint8Array): Promise<void> {
  const base64 = arrayBufferToBase64(salt.buffer);
  await set('master_salt', base64);
}

export async function getSalt(): Promise<Uint8Array | null> {
  const base64 = await get<string>('master_salt');
  if (!base64) return null;
  return new Uint8Array(base64ToArrayBuffer(base64));
}

export async function saveVerificationData(encrypted: ArrayBuffer, iv: Uint8Array): Promise<void> {
  const data: VerificationData = {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
  await set('verification_data', data);
}

export async function verifyMasterKey(key: CryptoKey): Promise<boolean> {
  try {
    const data = await get<VerificationData>('verification_data');
    if (!data) return false;
    const ciphertext = base64ToArrayBuffer(data.encrypted);
    const iv = new Uint8Array(base64ToArrayBuffer(data.iv));
    const plaintext = await decrypt(ciphertext, key, iv);
    return plaintext === 'VAULTPASS_VERIFY';
  } catch {
    return false;
  }
}

export async function setupMasterPassword(password: string): Promise<CryptoKey> {
  const salt = generateSalt();
  const key = await deriveKey(password, salt);
  const iv = generateIV();
  const encrypted = await encrypt('VAULTPASS_VERIFY', key, iv);
  await saveSalt(salt);
  await saveVerificationData(encrypted, iv);
  return key;
}

export async function unlockWithMasterPassword(password: string): Promise<CryptoKey | null> {
  const salt = await getSalt();
  if (!salt) return null;
  const key = await deriveKey(password, salt);
  const valid = await verifyMasterKey(key);
  return valid ? key : null;
}

export async function saveEntry(entry: VaultEntry, key: CryptoKey): Promise<void> {
  const id = entry.id || v4();
  const iv = generateIV();
  const sensitiveData = JSON.stringify({
    title: entry.title,
    username: entry.username,
    password: entry.password,
    notes: entry.notes,
  });
  const encryptedData = await encrypt(sensitiveData, key, iv);
  const stored: StoredEntry = {
    id,
    encryptedData: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv.buffer),
    category: entry.category,
    createdAt: entry.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  const entries = (await get<StoredEntry[]>('vault_entries')) || [];
  entries.push(stored);
  await set('vault_entries', entries);
}

export async function getAllEntries(key: CryptoKey): Promise<VaultEntry[]> {
  const entries = (await get<StoredEntry[]>('vault_entries')) || [];
  const result: VaultEntry[] = [];
  for (const stored of entries) {
    try {
      const ciphertext = base64ToArrayBuffer(stored.encryptedData);
      const iv = new Uint8Array(base64ToArrayBuffer(stored.iv));
      const plaintext = await decrypt(ciphertext, key, iv);
      const sensitiveData = JSON.parse(plaintext);
      result.push({
        id: stored.id,
        title: sensitiveData.title,
        username: sensitiveData.username,
        password: sensitiveData.password,
        category: stored.category,
        notes: sensitiveData.notes,
        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
      });
    } catch {
      continue;
    }
  }
  return result;
}

export async function updateEntry(entry: VaultEntry, key: CryptoKey): Promise<void> {
  const entries = (await get<StoredEntry[]>('vault_entries')) || [];
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index === -1) return;
  const iv = generateIV();
  const sensitiveData = JSON.stringify({
    title: entry.title,
    username: entry.username,
    password: entry.password,
    notes: entry.notes,
  });
  const encryptedData = await encrypt(sensitiveData, key, iv);
  entries[index] = {
    id: entry.id,
    encryptedData: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv.buffer),
    category: entry.category,
    createdAt: entries[index].createdAt,
    updatedAt: Date.now(),
  };
  await set('vault_entries', entries);
}

export async function deleteEntry(id: string): Promise<void> {
  const entries = (await get<StoredEntry[]>('vault_entries')) || [];
  const filtered = entries.filter((e) => e.id !== id);
  await set('vault_entries', filtered);
}
