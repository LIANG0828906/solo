import { create } from 'zustand';
import type { Keyframe, KeyframeProperties, HistorySnapshot } from './types';

const defaultProperties: KeyframeProperties = {
  transform: 'translateY(0px) rotate(0deg) scale(1)',
  opacity: 100,
  filter: 'blur(0px) brightness(100%)',
  borderRadius: 0,
};

const defaultKeyframes: Keyframe[] = [
  { id: 'kf-0', percent: 0, properties: { ...defaultProperties } },
  { id: 'kf-100', percent: 100, properties: { ...defaultProperties, transform: 'translateY(-20px) rotate(360deg) scale(1.1)' } },
];

const MIN_PERCENT_GAP = 5;

const TEMPLATES: Record<string, Keyframe[]> = {
  bounce: [
    { id: 'kf-0', percent: 0, properties: { transform: 'translateY(0px)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
    { id: 'kf-25', percent: 25, properties: { transform: 'translateY(-40px)', opacity: 100, filter: 'blur(0px)', borderRadius: 10 } },
    { id: 'kf-50', percent: 50, properties: { transform: 'translateY(0px)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
    { id: 'kf-75', percent: 75, properties: { transform: 'translateY(-20px)', opacity: 80, filter: 'blur(1px)', borderRadius: 5 } },
    { id: 'kf-100', percent: 100, properties: { transform: 'translateY(0px)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
  ],
  shake: [
    { id: 'kf-0', percent: 0, properties: { transform: 'translateX(0px)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
    { id: 'kf-10', percent: 10, properties: { transform: 'translateX(-10px)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
    { id: 'kf-20', percent: 20, properties: { transform: 'translateX(10px)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
    { id: 'kf-30', percent: 30, properties: { transform: 'translateX(-10px)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
    { id: 'kf-40', percent: 40, properties: { transform: 'translateX(10px)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
    { id: 'kf-50', percent: 50, properties: { transform: 'translateX(0px)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
    { id: 'kf-100', percent: 100, properties: { transform: 'translateX(0px)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
  ],
  blink: [
    { id: 'kf-0', percent: 0, properties: { transform: 'scale(1)', opacity: 100, filter: 'brightness(100%)', borderRadius: 0 } },
    { id: 'kf-50', percent: 50, properties: { transform: 'scale(1)', opacity: 0, filter: 'brightness(50%)', borderRadius: 0 } },
    { id: 'kf-100', percent: 100, properties: { transform: 'scale(1)', opacity: 100, filter: 'brightness(100%)', borderRadius: 0 } },
  ],
  spin: [
    { id: 'kf-0', percent: 0, properties: { transform: 'rotate(0deg) scale(1)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
    { id: 'kf-50', percent: 50, properties: { transform: 'rotate(180deg) scale(1.2)', opacity: 80, filter: 'blur(0px)', borderRadius: 20 } },
    { id: 'kf-100', percent: 100, properties: { transform: 'rotate(360deg) scale(1)', opacity: 100, filter: 'blur(0px)', borderRadius: 0 } },
  ],
  fade: [
    { id: 'kf-0', percent: 0, properties: { transform: 'scale(0.8)', opacity: 0, filter: 'blur(4px)', borderRadius: 30 } },
    { id: 'kf-50', percent: 50, properties: { transform: 'scale(1.05)', opacity: 100, filter: 'blur(0px)', borderRadius: 5 } },
    { id: 'kf-100', percent: 100, properties: { transform: 'scale(1)', opacity: 80, filter: 'blur(1px)', borderRadius: 15 } },
  ],
};

interface Store {
  keyframes: Keyframe[];
  speed: number;
  loopCount: number;
  history: HistorySnapshot[];
  currentKeyframeId: string | null;
  animationName: string;

  addKeyframe: (percent: number) => boolean;
  removeKeyframe: (id: string) => void;
  updateKeyframe: (id: string, updates: Partial<KeyframeProperties>) => void;
  updateKeyframePercent: (id: string, percent: number) => boolean;
  setCurrentKeyframe: (id: string | null) => void;
  setSpeed: (speed: number) => void;
  incrementLoopCount: () => void;
  resetLoopCount: () => void;
  saveToHistory: (thumbnail: string) => void;
  loadFromHistory: (index: number) => void;
  loadTemplate: (name: string) => void;
  generateCSS: () => string;
  resetAnimation: () => void;
  getTemplates: () => Record<string, Keyframe[]>;
}

export const useStore = create<Store>((set, get) => ({
  keyframes: defaultKeyframes,
  speed: 1,
  loopCount: 0,
  history: [],
  currentKeyframeId: null,
  animationName: 'customAnimation',

  addKeyframe: (percent: number) => {
    const { keyframes } = get();
    const sorted = [...keyframes].sort((a, b) => a.percent - b.percent);

    for (let i = 0; i < sorted.length; i++) {
      if (Math.abs(sorted[i].percent - percent) < MIN_PERCENT_GAP) {
        return false;
      }
    }

    const id = `kf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newKf: Keyframe = {
      id,
      percent,
      properties: { ...defaultProperties },
    };

    set({ keyframes: [...keyframes, newKf] });
    return true;
  },

  removeKeyframe: (id: string) => {
    const { keyframes } = get();
    const kf = keyframes.find((k) => k.id === id);
    if (kf && (kf.percent === 0 || kf.percent === 100)) return;
    set({ keyframes: keyframes.filter((k) => k.id !== id), currentKeyframeId: null });
  },

  updateKeyframe: (id: string, updates: Partial<KeyframeProperties>) => {
    set({
      keyframes: get().keyframes.map((kf) =>
        kf.id === id ? { ...kf, properties: { ...kf.properties, ...updates } } : kf
      ),
    });
  },

  updateKeyframePercent: (id: string, percent: number) => {
    const { keyframes } = get();
    const current = keyframes.find((k) => k.id === id);
    if (!current) return false;

    const others = keyframes.filter((k) => k.id !== id);
    for (const other of others) {
      if (Math.abs(other.percent - percent) < MIN_PERCENT_GAP) {
        return false;
      }
    }

    set({
      keyframes: keyframes.map((kf) => (kf.id === id ? { ...kf, percent } : kf)),
    });
    return true;
  },

  setCurrentKeyframe: (id: string | null) => {
    set({ currentKeyframeId: id });
  },

  setSpeed: (speed: number) => {
    set({ speed });
  },

  incrementLoopCount: () => {
    set({ loopCount: get().loopCount + 1 });
  },

  resetLoopCount: () => {
    set({ loopCount: 0 });
  },

  saveToHistory: (thumbnail: string) => {
    const { keyframes, history } = get();
    const snapshot: HistorySnapshot = {
      id: `hist-${Date.now()}`,
      timestamp: Date.now(),
      keyframes: JSON.parse(JSON.stringify(keyframes)),
      thumbnail,
    };
    const newHistory = [snapshot, ...history].slice(0, 10);
    set({ history: newHistory });
  },

  loadFromHistory: (index: number) => {
    const { history } = get();
    if (index >= 0 && index < history.length) {
      set({
        keyframes: JSON.parse(JSON.stringify(history[index].keyframes)),
        currentKeyframeId: null,
      });
    }
  },

  loadTemplate: (name: string) => {
    const template = TEMPLATES[name];
    if (template) {
      set({ keyframes: JSON.parse(JSON.stringify(template)), currentKeyframeId: null, loopCount: 0 });
    }
  },

  generateCSS: () => {
    const { keyframes, animationName } = get();
    const sorted = [...keyframes].sort((a, b) => a.percent - b.percent);
    let css = `@keyframes ${animationName} {\n`;
    for (const kf of sorted) {
      const p = kf.properties;
      css += `  ${kf.percent}% {\n`;
      css += `    transform: ${p.transform};\n`;
      css += `    opacity: ${p.opacity / 100};\n`;
      css += `    filter: ${p.filter};\n`;
      css += `    border-radius: ${p.borderRadius}%;\n`;
      css += `  }\n`;
    }
    css += `}`;
    return css;
  },

  resetAnimation: () => {
    set({
      keyframes: JSON.parse(JSON.stringify(defaultKeyframes)),
      currentKeyframeId: null,
      loopCount: 0,
    });
  },

  getTemplates: () => TEMPLATES,
}));
