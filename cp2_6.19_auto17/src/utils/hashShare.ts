import { v4 as uuidv4 } from 'uuid';
import type { EmotionValues } from './colorMapper';

const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function base62Encode(num: number): string {
  if (num === 0) return '0';
  let result = '';
  while (num > 0) {
    result = BASE62_CHARS[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result;
}

function uuidToShort(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  let num = BigInt('0x' + hex);
  let result = '';
  const base = BigInt(62);
  while (num > 0n) {
    const remainder = Number(num % base);
    result = BASE62_CHARS[remainder] + result;
    num = num / base;
  }
  return result.slice(0, 8);
}

export function generateShareHash(emotions: EmotionValues): string {
  const params = new URLSearchParams();
  params.set('h', emotions.happy.toFixed(3));
  params.set('s', emotions.sad.toFixed(3));
  params.set('a', emotions.angry.toFixed(3));
  params.set('c', emotions.calm.toFixed(3));
  return params.toString();
}

export function generateShortLink(emotions: EmotionValues): string {
  const hash = generateShareHash(emotions);
  const shortId = uuidToShort(uuidv4());
  const storeKey = `emo_${shortId}`;
  try {
    localStorage.setItem(storeKey, hash);
  } catch (e) {
    console.warn('Failed to save to localStorage');
  }
  return `${window.location.origin}${window.location.pathname}#${shortId}`;
}

export function parseHash(hash: string): EmotionValues | null {
  if (!hash || hash.length === 0) return null;
  
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  
  if (cleanHash.includes('=') || cleanHash.includes('&')) {
    const params = new URLSearchParams(cleanHash);
    const happy = parseFloat(params.get('happy') || params.get('h') || '');
    const sad = parseFloat(params.get('sad') || params.get('s') || '');
    const angry = parseFloat(params.get('angry') || params.get('a') || '');
    const calm = parseFloat(params.get('calm') || params.get('c') || '');
    
    if ([happy, sad, angry, calm].every(v => !isNaN(v) && v >= 0 && v <= 1)) {
      return { happy, sad, angry, calm };
    }
  }
  
  const storeKey = `emo_${cleanHash}`;
  try {
    const stored = localStorage.getItem(storeKey);
    if (stored) {
      const params = new URLSearchParams(stored);
      const happy = parseFloat(params.get('h') || '');
      const sad = parseFloat(params.get('s') || '');
      const angry = parseFloat(params.get('a') || '');
      const calm = parseFloat(params.get('c') || '');
      
      if ([happy, sad, angry, calm].every(v => !isNaN(v) && v >= 0 && v <= 1)) {
        return { happy, sad, angry, calm };
      }
    }
  } catch (e) {
    console.warn('Failed to read from localStorage');
  }
  
  return null;
}

export function getHashFromUrl(): EmotionValues | null {
  return parseHash(window.location.hash);
}

export function updateUrlHash(emotions: EmotionValues): void {
  const hash = generateShareHash(emotions);
  window.history.replaceState(null, '', `#${hash}`);
}
