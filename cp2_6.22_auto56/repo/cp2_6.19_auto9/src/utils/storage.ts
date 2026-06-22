import { v4 as uuidv4 } from 'uuid';
import type { LightParams, Keyframe, LightShowProject } from '../types';
import { LIGHT_COUNT, MAX_KEYFRAMES, DEFAULT_DURATION, createInitialLights } from '../types';

const STORAGE_KEY = 'virtual_festival_lighting_project';
const PROJECT_VERSION = '1.0.0';

export const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

export const saveProject = (project: LightShowProject): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch (e) {
    console.error('Failed to save project:', e);
  }
};

export const loadProject = (): LightShowProject | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const project = JSON.parse(data) as LightShowProject;
    if (project.version !== PROJECT_VERSION) {
      console.warn('Project version mismatch, may cause compatibility issues');
    }
    return project;
  } catch (e) {
    console.error('Failed to load project:', e);
    return null;
  }
};

export const createNewProject = (): LightShowProject => ({
  version: PROJECT_VERSION,
  createdAt: Date.now(),
  keyframes: [],
  currentLightIndex: 0,
});

export const createKeyframeFromLights = (lights: LightParams[]): Keyframe => ({
  id: uuidv4(),
  duration: DEFAULT_DURATION,
  easing: 'easeInOut',
  lights: lights.map((l) => ({ ...l })),
});

export const generateRandomScheme = (): LightParams[] => {
  const baseHue = Math.floor(Math.random() * 360);
  const complementaryHue = (baseHue + 180) % 360;

  const schemes = [
    { type: 'complementary', hues: [baseHue, complementaryHue] },
    { type: 'analogous', hues: [baseHue, (baseHue + 30) % 360, (baseHue + 330) % 360] },
    { type: 'triadic', hues: [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360] },
    { type: 'split', hues: [baseHue, (complementaryHue + 30) % 360, (complementaryHue + 330) % 360] },
  ];

  const scheme = schemes[Math.floor(Math.random() * schemes.length)];
  const lights: LightParams[] = [];

  for (let i = 0; i < LIGHT_COUNT; i++) {
    const baseHueIndex = i % scheme.hues.length;
    const hueVariation = (Math.random() - 0.5) * 20;
    const hue = (scheme.hues[baseHueIndex] + hueVariation + 360) % 360;

    const saturation = 75 + Math.random() * 25;
    const brightness = 60 + Math.random() * 35;

    const patterns: LightParams['pattern'][] = ['static', 'breathing', 'wave'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const patternSpeed = 0.5 + Math.random() * 1.5;

    lights.push({
      hue,
      saturation,
      brightness,
      pattern,
      patternSpeed,
    });
  }

  return lights;
};

export const generateRandomKeyframes = (count: number = 4): Keyframe[] => {
  const keyframes: Keyframe[] = [];
  const numKeyframes = Math.min(count, MAX_KEYFRAMES);

  for (let i = 0; i < numKeyframes; i++) {
    const lights = generateRandomScheme();
    keyframes.push({
      id: uuidv4(),
      duration: 1500 + Math.random() * 2000,
      easing: Math.random() > 0.5 ? 'easeInOut' : 'linear',
      lights,
    });
  }

  return keyframes;
};
