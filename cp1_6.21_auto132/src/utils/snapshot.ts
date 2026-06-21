import { v4 as uuidv4 } from 'uuid';
import type { WorkspaceComponent } from '../context/AppContext';

export interface Snapshot {
  id: string;
  createdAt: number;
  components: WorkspaceComponent[];
  theme: 'light' | 'dark';
}

export function createSnapshot(
  components: WorkspaceComponent[],
  theme: 'light' | 'dark'
): Snapshot {
  return {
    id: uuidv4(),
    createdAt: Date.now(),
    components,
    theme,
  };
}

export function serializeSnapshot(snapshot: Snapshot): string {
  const json = JSON.stringify(snapshot);
  return encodeBase64(json);
}

export function deserializeSnapshot(encoded: string): Snapshot | null {
  try {
    const json = decodeBase64(encoded);
    const parsed = JSON.parse(json);
    if (validateSnapshot(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function validateSnapshot(obj: unknown): obj is Snapshot {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.createdAt === 'number' &&
    Array.isArray(s.components) &&
    (s.theme === 'light' || s.theme === 'dark')
  );
}

export function encodeBase64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return encodeURIComponent(btoa(unescape(encodeURIComponent(str))));
  }
}

export function decodeBase64(encoded: string): string {
  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return decodeURIComponent(escape(atob(encoded)));
  }
}

export function setSnapshotToURL(snapshot: Snapshot): string {
  const encoded = serializeSnapshot(snapshot);
  const url = new URL(window.location.href);
  url.searchParams.set('config', encoded);
  window.history.replaceState({}, '', url.toString());
  return url.toString();
}

export function getSnapshotFromURL(): Snapshot | null {
  const params = new URLSearchParams(window.location.search);
  const config = params.get('config');
  if (!config) return null;
  return deserializeSnapshot(config);
}
