import { v4 as uuidv4 } from 'uuid';
import type { EmotionValues } from './colorMapper';

const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SHORT_ID_LENGTH = 8;
const STORAGE_PREFIX = 'emo_';
const MAX_GENERATE_ATTEMPTS = 10;

function uuidToShort(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  let num = BigInt('0x' + hex);
  let result = '';
  const base = BigInt(62);
  while (num > 0n && result.length < SHORT_ID_LENGTH) {
    const remainder = Number(num % base);
    result = BASE62_CHARS[remainder] + result;
    num = num / base;
  }
  while (result.length < SHORT_ID_LENGTH) {
    result = '0' + result;
  }
  return result.slice(0, SHORT_ID_LENGTH);
}

export function validateEmotionValues(values: unknown): values is EmotionValues {
  if (!values || typeof values !== 'object') return false;
  
  const v = values as Record<string, unknown>;
  const keys: (keyof EmotionValues)[] = ['happy', 'sad', 'angry', 'calm'];
  
  for (const key of keys) {
    const val = v[key];
    if (typeof val !== 'number' || isNaN(val) || val < 0 || val > 1) {
      return false;
    }
  }
  
  return true;
}

export function generateShareHash(emotions: EmotionValues): string {
  if (!validateEmotionValues(emotions)) {
    console.warn('Invalid emotion values for hash generation');
    return '';
  }
  
  const params = new URLSearchParams();
  params.set('h', emotions.happy.toFixed(3));
  params.set('s', emotions.sad.toFixed(3));
  params.set('a', emotions.angry.toFixed(3));
  params.set('c', emotions.calm.toFixed(3));
  return params.toString();
}

function generateUniqueShortId(hash: string): string {
  let shortId = '';
  let attempts = 0;
  
  while (attempts < MAX_GENERATE_ATTEMPTS) {
    shortId = uuidToShort(uuidv4());
    const storeKey = STORAGE_PREFIX + shortId;
    
    try {
      const existing = localStorage.getItem(storeKey);
      if (!existing || existing === hash) {
        return shortId;
      }
    } catch (e) {
      console.warn('localStorage access failed, using shortId without uniqueness check');
      return shortId;
    }
    
    attempts++;
  }
  
  return shortId;
}

export function generateShortLink(emotions: EmotionValues): string {
  const hash = generateShareHash(emotions);
  if (!hash) {
    return window.location.origin + window.location.pathname;
  }
  
  const shortId = generateUniqueShortId(hash);
  const storeKey = STORAGE_PREFIX + shortId;
  
  try {
    localStorage.setItem(storeKey, hash);
  } catch (e) {
    console.warn('Failed to save to localStorage, returning full hash instead');
    return `${window.location.origin}${window.location.pathname}#${hash}`;
  }
  
  return `${window.location.origin}${window.location.pathname}#${shortId}`;
}

export function parseHash(hash: string): EmotionValues | null {
  if (!hash || hash.length === 0) return null;
  
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  
  if (cleanHash.length === 0) return null;
  
  if (cleanHash.includes('=') || cleanHash.includes('&')) {
    try {
      const params = new URLSearchParams(cleanHash);
      
      const happyStr = params.get('happy') || params.get('h') || '';
      const sadStr = params.get('sad') || params.get('s') || '';
      const angryStr = params.get('angry') || params.get('a') || '';
      const calmStr = params.get('calm') || params.get('c') || '';
      
      if (!happyStr && !sadStr && !angryStr && !calmStr) {
        return null;
      }
      
      const happy = parseFloat(happyStr);
      const sad = parseFloat(sadStr);
      const angry = parseFloat(angryStr);
      const calm = parseFloat(calmStr);
      
      const values = { happy, sad, angry, calm };
      
      if (validateEmotionValues(values)) {
        return values;
      }
    } catch (e) {
      console.warn('Failed to parse hash parameters:', e);
    }
  }
  
  if (/^[0-9A-Za-z]+$/.test(cleanHash) && cleanHash.length <= SHORT_ID_LENGTH + 2) {
    const storeKey = STORAGE_PREFIX + cleanHash;
    try {
      const stored = localStorage.getItem(storeKey);
      if (stored) {
        const params = new URLSearchParams(stored);
        const happy = parseFloat(params.get('h') || '');
        const sad = parseFloat(params.get('s') || '');
        const angry = parseFloat(params.get('a') || '');
        const calm = parseFloat(params.get('c') || '');
        
        const values = { happy, sad, angry, calm };
        
        if (validateEmotionValues(values)) {
          return values;
        } else {
          console.warn('Stored hash has invalid values');
          try {
            localStorage.removeItem(storeKey);
          } catch (e) {
            // ignore cleanup error
          }
        }
      }
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
    }
  }
  
  return null;
}

export function getHashFromUrl(): EmotionValues | null {
  try {
    return parseHash(window.location.hash);
  } catch (e) {
    console.warn('Failed to get hash from URL:', e);
    return null;
  }
}

export function updateUrlHash(emotions: EmotionValues): void {
  try {
    const hash = generateShareHash(emotions);
    if (hash) {
      window.history.replaceState(null, '', `#${hash}`);
    }
  } catch (e) {
    console.warn('Failed to update URL hash:', e);
  }
}
