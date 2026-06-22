import type { EnvParams } from './types';

export function createDefaultEnvParams(): EnvParams {
  return {
    light: 50,
    water: 60,
    temperature: 22,
    ph: 6.2,
    nitrogen: 50,
    phosphorus: 50,
    potassium: 50,
  };
}

export function clampEnvParams(params: EnvParams): EnvParams {
  return {
    light: Math.max(0, Math.min(100, params.light)),
    water: Math.max(0, Math.min(100, params.water)),
    temperature: Math.max(0, Math.min(40, params.temperature)),
    ph: Math.max(4.0, Math.min(8.0, params.ph)),
    nitrogen: Math.max(0, Math.min(100, params.nitrogen)),
    phosphorus: Math.max(0, Math.min(100, params.phosphorus)),
    potassium: Math.max(0, Math.min(100, params.potassium)),
  };
}

export function calculatePhotosyntheticEfficiency(env: EnvParams): number {
  const lightFactor =
    env.light < 20
      ? env.light / 20
      : env.light > 80
      ? 1 - (env.light - 80) / 20
      : (env.light - 20) / 60;
  const waterFactor =
    env.water / 100;
  const tempOptimal = 25;
  const tempFactor = Math.max(
    0,
    1 - Math.abs(env.temperature - tempOptimal) / 20
  );
  const nutrientFactor =
    (env.nitrogen + env.phosphorus + env.potassium) / 300;
  return Math.max(
    0,
    Math.min(1, lightFactor * 0.5 + waterFactor * 0.25 + tempFactor * 0.15 + nutrientFactor * 0.1)
  );
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

export function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(
    ar + (br - ar) * t,
    ag + (bg - ag) * t,
    ab + (bb - ab) * t
  );
}

export const ENV_RANGES = {
  light: { min: 0, max: 100, step: 1 },
  water: { min: 0, max: 100, step: 1 },
  temperature: { min: 0, max: 40, step: 0.5 },
  ph: { min: 4.0, max: 8.0, step: 0.1 },
  nitrogen: { min: 0, max: 100, step: 1 },
  phosphorus: { min: 0, max: 100, step: 1 },
  potassium: { min: 0, max: 100, step: 1 },
};

export const ENV_LABELS: Record<keyof EnvParams, string> = {
  light: '光照强度',
  water: '水分',
  temperature: '温度',
  ph: '土壤pH值',
  nitrogen: '氮浓度',
  phosphorus: '磷浓度',
  potassium: '钾浓度',
};

export const ENV_UNITS: Record<keyof EnvParams, string> = {
  light: '%',
  water: '%',
  temperature: '℃',
  ph: '',
  nitrogen: '%',
  phosphorus: '%',
  potassium: '%',
};
