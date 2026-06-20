import type { SceneState, Hypocenter } from '@/types';
import { DEFAULT_STATE } from '@/types';

const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function encodeBase62(value: number, length: number): string {
  let result = '';
  let num = Math.floor(value);
  while (num > 0) {
    result = BASE62_CHARS[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result.padStart(length, '0');
}

function decodeBase62(str: string): number {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * 62 + BASE62_CHARS.indexOf(str[i]);
  }
  return result;
}

function encodeRange(value: number, min: number, max: number, bits: number): string {
  const normalized = (value - min) / (max - min);
  const maxInt = Math.pow(2, bits) - 1;
  const intVal = Math.round(normalized * maxInt);
  const base62Len = Math.ceil(bits / Math.log2(62));
  return encodeBase62(intVal, base62Len);
}

function decodeRange(str: string, min: number, max: number, bits: number): number {
  const maxInt = Math.pow(2, bits) - 1;
  const intVal = decodeBase62(str);
  const normalized = intVal / maxInt;
  return normalized * (max - min) + min;
}

export function encodeStateToUrl(state: SceneState): string {
  const { hypocenter, magnitude, density, elasticity } = state;

  const x = encodeRange(hypocenter.x, -5, 5, 12);
  const y = encodeRange(hypocenter.y, -5, 5, 12);
  const z = encodeRange(hypocenter.z, -5, 5, 12);
  const m = encodeRange(magnitude, 1, 9, 8);
  const d = encodeRange(density, 1000, 5000, 12);
  const e = encodeRange(elasticity, 1, 20, 10);

  return `${x}${y}${z}${m}${d}${e}`;
}

export function decodeStateFromUrl(encoded: string): Partial<SceneState> | null {
  try {
    const xLen = Math.ceil(12 / Math.log2(62));
    const yLen = xLen;
    const zLen = xLen;
    const mLen = Math.ceil(8 / Math.log2(62));
    const dLen = Math.ceil(12 / Math.log2(62));
    const eLen = Math.ceil(10 / Math.log2(62));

    const expectedLen = xLen + yLen + zLen + mLen + dLen + eLen;
    if (encoded.length !== expectedLen) {
      return null;
    }

    let pos = 0;
    const x = decodeRange(encoded.slice(pos, pos + xLen), -5, 5, 12);
    pos += xLen;
    const y = decodeRange(encoded.slice(pos, pos + yLen), -5, 5, 12);
    pos += yLen;
    const z = decodeRange(encoded.slice(pos, pos + zLen), -5, 5, 12);
    pos += zLen;
    const magnitude = decodeRange(encoded.slice(pos, pos + mLen), 1, 9, 8);
    pos += mLen;
    const density = decodeRange(encoded.slice(pos, pos + dLen), 1000, 5000, 12);
    pos += dLen;
    const elasticity = decodeRange(encoded.slice(pos, pos + eLen), 1, 20, 10);

    const hypocenter: Hypocenter = {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      z: Number(z.toFixed(2)),
    };

    return {
      hypocenter,
      magnitude: Number(magnitude.toFixed(1)),
      density: Math.round(density),
      elasticity: Number(elasticity.toFixed(1)),
    };
  } catch {
    return null;
  }
}

export function saveStateToUrl(state: SceneState): string {
  const encoded = encodeStateToUrl(state);
  const newUrl = `${window.location.pathname}#${encoded}`;
  window.history.replaceState(null, '', newUrl);
  return encoded;
}

export function loadStateFromUrl(): Partial<SceneState> | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  return decodeStateFromUrl(hash);
}

export function copyShareUrl(): Promise<string> {
  const state = {
    ...DEFAULT_STATE,
  };
  const encoded = encodeStateToUrl(state);
  const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
  return navigator.clipboard.writeText(url).then(() => url);
}

export function getShareUrl(state: SceneState): string {
  const encoded = encodeStateToUrl(state);
  return `${window.location.origin}${window.location.pathname}#${encoded}`;
}
