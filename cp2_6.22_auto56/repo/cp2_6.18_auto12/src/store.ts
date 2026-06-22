import { create } from 'zustand';
import { parseTypography, type TypographyParams, type ParsedTypography } from './engine/parser';
import { generateCss } from './engine/cssGenerator';
import { presetTemplates } from './data/sampleArticles';

interface UIState {
  fontPanelOpen: boolean;
  spacingPanelOpen: boolean;
  alignPanelOpen: boolean;
  leftPanelWidth: number;
  selectedArticle: number;
  activePreset: string;
  showToast: boolean;
  toastMessage: string;
}

interface StoreState {
  params: TypographyParams;
  ui: UIState;
  parsed: ParsedTypography;
  cssCode: string;
  updateParam: <K extends keyof TypographyParams>(key: K, value: TypographyParams[K]) => void;
  batchUpdateParams: (updates: Partial<TypographyParams>) => void;
  applyPreset: (presetId: string) => void;
  setUI: <K extends keyof UIState>(key: K, value: UIState[K]) => void;
  setLeftPanelWidth: (width: number) => void;
  showToastMessage: (message: string) => void;
}

const defaultParams: TypographyParams = {
  headingFont: 'Inter',
  bodyFont: 'Inter',
  h1Size: 40,
  h2Size: 28,
  h3Size: 20,
  bodySize: 16,
  h1LineHeight: 1.2,
  h2LineHeight: 1.3,
  h3LineHeight: 1.4,
  bodyLineHeight: 1.75,
  h1LetterSpacing: -0.8,
  h2LetterSpacing: -0.3,
  h3LetterSpacing: 0,
  bodyLetterSpacing: 0.2,
  paragraphSpacing: 24,
  headingSpacing: 32,
  textAlign: 'left',
  textColor: '#222222',
  headingColor: '#111111',
  quoteStyle: 'minimal',
  linkColor: '#0066CC',
};

const initialParsed = parseTypography(defaultParams);
const initialCss = generateCss(initialParsed);

export const useStore = create<StoreState>((set, get) => ({
  params: defaultParams,
  ui: {
    fontPanelOpen: true,
    spacingPanelOpen: true,
    alignPanelOpen: false,
    leftPanelWidth: 320,
    selectedArticle: 0,
    activePreset: 'minimal',
    showToast: false,
    toastMessage: '',
  },
  parsed: initialParsed,
  cssCode: initialCss,

  updateParam: (key, value) => {
    const params = { ...get().params, [key]: value };
    const parsed = parseTypography(params);
    const cssCode = generateCss(parsed);
    set({ params, parsed, cssCode });
  },

  batchUpdateParams: (updates) => {
    const params = { ...get().params, ...updates };
    const parsed = parseTypography(params);
    const cssCode = generateCss(parsed);
    set({ params, parsed, cssCode });
  },

  applyPreset: (presetId) => {
    const preset = presetTemplates.find((p) => p.id === presetId);
    if (!preset) return;
    const params = { ...get().params, ...preset.params } as TypographyParams;
    const parsed = parseTypography(params);
    const cssCode = generateCss(parsed);
    set({
      params,
      parsed,
      cssCode,
      ui: { ...get().ui, activePreset: presetId },
    });
  },

  setUI: (key, value) => {
    set({ ui: { ...get().ui, [key]: value } });
  },

  setLeftPanelWidth: (width) => {
    set({ ui: { ...get().ui, leftPanelWidth: width } });
  },

  showToastMessage: (message) => {
    set({ ui: { ...get().ui, showToast: true, toastMessage: message } });
    setTimeout(() => {
      set({ ui: { ...get().ui, showToast: false } });
    }, 2000);
  },
}));
