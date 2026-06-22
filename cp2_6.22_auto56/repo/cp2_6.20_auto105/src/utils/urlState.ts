import type { SceneState, Hypocenter } from '@/types';
import { DEFAULT_STATE } from '@/types';

const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = 62;

function encodeBase62(value: number, minLen: number): string {
  if (value === 0) return BASE62_CHARS[0].repeat(minLen);
  let result = '';
  let num = value;
  while (num > 0) {
    result = BASE62_CHARS[num % BASE] + result;
    num = Math.floor(num / BASE);
  }
  return result.padStart(minLen, BASE62_CHARS[0]);
}

function decodeBase62(str: string): number {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    const idx = BASE62_CHARS.indexOf(str[i]);
    if (idx === -1) return 0;
    result = result * BASE + idx;
  }
  return result;
}

function encodeFixed(value: number, min: number, max: number, precision: number): string {
  const scaled = Math.round((value - min) / precision);
  const maxScaled = Math.round((max - min) / precision);
  const bitsNeeded = Math.ceil(Math.log2(maxScaled + 1));
  const base62Len = Math.ceil(bitsNeeded / Math.log2(BASE));
  return encodeBase62(scaled, base62Len);
}

function decodeFixed(
  str: string,
  min: number,
  max: number,
  precision: number
): number {
  const maxScaled = Math.round((max - min) / precision);
  const bitsNeeded = Math.ceil(Math.log2(maxScaled + 1));
  const base62Len = Math.ceil(bitsNeeded / Math.log2(BASE));
  if (str.length !== base62Len) return min;
  const scaled = decodeBase62(str);
  return min + scaled * precision;
}

const PARAM_SPECS = {
  x: { min: -5, max: 5, precision: 0.1 },
  y: { min: -5, max: 5, precision: 0.1 },
  z: { min: -5, max: 5, precision: 0.1 },
  magnitude: { min: 1, max: 9, precision: 0.1 },
  density: { min: 1000, max: 5000, precision: 10 },
  elasticity: { min: 1, max: 20, precision: 0.1 },
} as const;

type ParamKey = keyof typeof PARAM_SPECS;

function getEncodedLength(key: ParamKey): number {
  const spec = PARAM_SPECS[key];
  const maxScaled = Math.round((spec.max - spec.min) / spec.precision);
  const bitsNeeded = Math.ceil(Math.log2(maxScaled + 1));
  return Math.ceil(bitsNeeded / Math.log2(BASE));
}

const FIELD_LENGTHS: Record<ParamKey, number> = {
  x: getEncodedLength('x'),
  y: getEncodedLength('y'),
  z: getEncodedLength('z'),
  magnitude: getEncodedLength('magnitude'),
  density: getEncodedLength('density'),
  elasticity: getEncodedLength('elasticity'),
};

const TOTAL_ENCODED_LENGTH = Object.values(FIELD_LENGTHS).reduce((a, b) => a + b, 0);

export function encodeStateToUrl(state: SceneState): string {
  const { hypocenter, magnitude, density, elasticity } = state;

  const x = encodeFixed(hypocenter.x, PARAM_SPECS.x.min, PARAM_SPECS.x.max, PARAM_SPECS.x.precision);
  const y = encodeFixed(hypocenter.y, PARAM_SPECS.y.min, PARAM_SPECS.y.max, PARAM_SPECS.y.precision);
  const z = encodeFixed(hypocenter.z, PARAM_SPECS.z.min, PARAM_SPECS.z.max, PARAM_SPECS.z.precision);
  const m = encodeFixed(magnitude, PARAM_SPECS.magnitude.min, PARAM_SPECS.magnitude.max, PARAM_SPECS.magnitude.precision);
  const d = encodeFixed(density, PARAM_SPECS.density.min, PARAM_SPECS.density.max, PARAM_SPECS.density.precision);
  const e = encodeFixed(elasticity, PARAM_SPECS.elasticity.min, PARAM_SPECS.elasticity.max, PARAM_SPECS.elasticity.precision);

  return `${x}${y}${z}${m}${d}${e}`;
}

export function decodeStateFromUrl(encoded: string): Partial<SceneState> | null {
  try {
    if (encoded.length !== TOTAL_ENCODED_LENGTH) {
      return null;
    }

    let pos = 0;

    const x = decodeFixed(
      encoded.slice(pos, pos + FIELD_LENGTHS.x),
      PARAM_SPECS.x.min, PARAM_SPECS.x.max, PARAM_SPECS.x.precision
    );
    pos += FIELD_LENGTHS.x;

    const y = decodeFixed(
      encoded.slice(pos, pos + FIELD_LENGTHS.y),
      PARAM_SPECS.y.min, PARAM_SPECS.y.max, PARAM_SPECS.y.precision
    );
    pos += FIELD_LENGTHS.y;

    const z = decodeFixed(
      encoded.slice(pos, pos + FIELD_LENGTHS.z),
      PARAM_SPECS.z.min, PARAM_SPECS.z.max, PARAM_SPECS.z.precision
    );
    pos += FIELD_LENGTHS.z;

    const magnitude = decodeFixed(
      encoded.slice(pos, pos + FIELD_LENGTHS.magnitude),
      PARAM_SPECS.magnitude.min, PARAM_SPECS.magnitude.max, PARAM_SPECS.magnitude.precision
    );
    pos += FIELD_LENGTHS.magnitude;

    const density = decodeFixed(
      encoded.slice(pos, pos + FIELD_LENGTHS.density),
      PARAM_SPECS.density.min, PARAM_SPECS.density.max, PARAM_SPECS.density.precision
    );
    pos += FIELD_LENGTHS.density;

    const elasticity = decodeFixed(
      encoded.slice(pos, pos + FIELD_LENGTHS.elasticity),
      PARAM_SPECS.elasticity.min, PARAM_SPECS.elasticity.max, PARAM_SPECS.elasticity.precision
    );

    const hypocenter: Hypocenter = {
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      z: Number(z.toFixed(1)),
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

export function getShareUrl(state: SceneState): string {
  const encoded = encodeStateToUrl(state);
  return `${window.location.origin}${window.location.pathname}#${encoded}`;
}

export function validateEncodedLength(): { encoded: string; length: number; withinLimit: boolean } {
  const encoded = encodeStateToUrl(DEFAULT_STATE);
  return {
    encoded,
    length: encoded.length,
    withinLimit: encoded.length <= 200,
  };
}
