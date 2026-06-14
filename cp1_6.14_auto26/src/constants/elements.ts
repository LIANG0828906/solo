import type { ElementInfo } from '@/types';

export const ELEMENT_INFO: Record<string, ElementInfo> = {
  H: {
    color: '#ffffff',
    radius: 0.25,
    vanDerWaalsRadius: 1.2,
    displayName: '氢',
  },
  C: {
    color: '#404040',
    radius: 0.4,
    vanDerWaalsRadius: 1.7,
    displayName: '碳',
  },
  N: {
    color: '#3050f8',
    radius: 0.38,
    vanDerWaalsRadius: 1.55,
    displayName: '氮',
  },
  O: {
    color: '#ff0d0d',
    radius: 0.36,
    vanDerWaalsRadius: 1.52,
    displayName: '氧',
  },
  F: {
    color: '#90e050',
    radius: 0.32,
    vanDerWaalsRadius: 1.47,
    displayName: '氟',
  },
  Cl: {
    color: '#1ff01f',
    radius: 0.45,
    vanDerWaalsRadius: 1.75,
    displayName: '氯',
  },
  Br: {
    color: '#a62929',
    radius: 0.5,
    vanDerWaalsRadius: 1.85,
    displayName: '溴',
  },
  I: {
    color: '#940094',
    radius: 0.55,
    vanDerWaalsRadius: 1.98,
    displayName: '碘',
  },
  S: {
    color: '#ffff30',
    radius: 0.45,
    vanDerWaalsRadius: 1.8,
    displayName: '硫',
  },
  P: {
    color: '#ff8000',
    radius: 0.48,
    vanDerWaalsRadius: 1.8,
    displayName: '磷',
  },
  B: {
    color: '#ffb5b5',
    radius: 0.42,
    vanDerWaalsRadius: 1.65,
    displayName: '硼',
  },
  Si: {
    color: '#f0c8a0',
    radius: 0.5,
    vanDerWaalsRadius: 1.9,
    displayName: '硅',
  },
  Na: {
    color: '#ab5cf2',
    radius: 0.55,
    vanDerWaalsRadius: 2.27,
    displayName: '钠',
  },
  K: {
    color: '#8f40d4',
    radius: 0.6,
    vanDerWaalsRadius: 2.75,
    displayName: '钾',
  },
  Ca: {
    color: '#3dff00',
    radius: 0.58,
    vanDerWaalsRadius: 2.31,
    displayName: '钙',
  },
  Fe: {
    color: '#e06633',
    radius: 0.5,
    vanDerWaalsRadius: 1.94,
    displayName: '铁',
  },
  Zn: {
    color: '#7d80b0',
    radius: 0.48,
    vanDerWaalsRadius: 1.39,
    displayName: '锌',
  },
  Mg: {
    color: '#8aff00',
    radius: 0.52,
    vanDerWaalsRadius: 1.73,
    displayName: '镁',
  },
  Cu: {
    color: '#c88033',
    radius: 0.46,
    vanDerWaalsRadius: 1.4,
    displayName: '铜',
  },
  Mn: {
    color: '#9c7ac7',
    radius: 0.48,
    vanDerWaalsRadius: 1.61,
    displayName: '锰',
  },
};

export const DEFAULT_ELEMENT: ElementInfo = {
  color: '#cc00ff',
  radius: 0.4,
  vanDerWaalsRadius: 1.7,
  displayName: '未知',
};

export const HIGHLIGHT_COLOR = '#00d4ff';
export const HIGHLIGHT_INTENSITY = 1.5;
export const BACKGROUND_COLOR = '#1a1a2e';
