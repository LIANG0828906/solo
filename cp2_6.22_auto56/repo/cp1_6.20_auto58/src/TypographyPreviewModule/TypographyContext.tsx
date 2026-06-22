import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type TextAlign = 'left' | 'center' | 'right';

export type DeviceWidth = 375 | 768 | 1280 | 1920;

export interface TypographyParams {
  headingSize: number;
  bodySize: number;
  lineHeight: number;
  letterSpacing: number;
  paragraphSpacing: number;
  textAlign: TextAlign;
  headingFont: string;
  bodyFont: string;
}

export interface Preset {
  id: string;
  name: string;
  params: TypographyParams;
  createdAt: number;
}

interface TypographyStore {
  params: TypographyParams;
  lastSavedParams: TypographyParams | null;
  presets: Preset[];
  compareMode: boolean;
  deviceWidth: DeviceWidth;
  customText: string;

  setParams: (params: Partial<TypographyParams>) => void;
  setCompareMode: (enabled: boolean) => void;
  setDeviceWidth: (width: DeviceWidth) => void;
  setCustomText: (text: string) => void;
  savePreset: (name?: string) => void;
  applyPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  setLastSavedParams: (params: TypographyParams) => void;
}

export const DEFAULT_PARAMS: TypographyParams = {
  headingSize: 32,
  bodySize: 16,
  lineHeight: 1.6,
  letterSpacing: 0,
  paragraphSpacing: 16,
  textAlign: 'left',
  headingFont: 'Georgia, serif',
  bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const DEFAULT_TEXT = `字体排版的艺术

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 这是一段中英文混排的示例文本，用于测试字体在不同语言下的渲染效果。Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

排版设计不仅仅是选择字体，更是关于节奏、层次和呼吸感的艺术。Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. 好的排版能让阅读成为一种享受，糟糕的排版则会让读者疲惫不堪。在数字时代，我们每天都在与文字打交道，从网页到应用，从电子书到社交媒体，排版无处不在。

The art of typography is the art of making language visible. 字体的选择、字号的大小、行高的设置、字间距的微调，每一个细节都会影响最终的阅读体验。通过合理的排版层次，我们可以引导读者的视线，突出重要信息，创造出既美观又实用的文字作品。无论你是设计师、开发者还是内容创作者，理解排版的基本原则都将帮助你更好地传达信息。`;

const generatePresetName = (headingFont: string, bodyFont: string): string => {
  const extractName = (font: string) => {
    const first = font.split(',')[0].trim().replace(/["']/g, '');
    return first || 'Unknown';
  };
  const h = extractName(headingFont);
  const b = extractName(bodyFont);
  return `${h} + ${b}组合`;
};

export const useTypographyStore = create<TypographyStore>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  lastSavedParams: null,
  presets: [],
  compareMode: false,
  deviceWidth: 1280,
  customText: DEFAULT_TEXT,

  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams },
    })),

  setCompareMode: (enabled) =>
    set(() => ({
      compareMode: enabled,
    })),

  setDeviceWidth: (width) =>
    set(() => ({
      deviceWidth: width,
    })),

  setCustomText: (text) =>
    set(() => ({
      customText: text.slice(0, 2000),
    })),

  savePreset: (name) => {
    const state = get();
    const presetName =
      name || generatePresetName(state.params.headingFont, state.params.bodyFont);
    const newPreset: Preset = {
      id: uuidv4(),
      name: presetName,
      params: { ...state.params },
      createdAt: Date.now(),
    };
    set((s) => ({
      presets: [...s.presets, newPreset],
      lastSavedParams: { ...s.params },
    }));
  },

  applyPreset: (id) => {
    const state = get();
    const preset = state.presets.find((p) => p.id === id);
    if (preset) {
      set(() => ({
        params: { ...preset.params },
      }));
    }
  },

  deletePreset: (id) =>
    set((state) => ({
      presets: state.presets.filter((p) => p.id !== id),
    })),

  setLastSavedParams: (params) =>
    set(() => ({
      lastSavedParams: { ...params },
    })),
}));

export default useTypographyStore;
