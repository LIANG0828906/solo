import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { IconData, PreviewConfig, FontResult } from './types';
import { PRESET_COLORS } from './types';
import { svgToWoff2 } from './fontEngine';

interface AppState {
  icons: IconData[];
  selectedIconId: string | null;
  previewConfig: PreviewConfig;
  isProcessing: boolean;
  isGenerating: boolean;
  exportProgress: number;
  fontResult: FontResult | null;

  addIcons: (files: File[]) => Promise<void>;
  removeIcon: (id: string) => void;
  reorderIcons: (fromIndex: number, toIndex: number) => void;
  updateIcon: (id: string, updates: Partial<IconData>) => void;
  selectIcon: (id: string | null) => void;
  generateFont: () => Promise<void>;
  exportZip: () => Promise<void>;
}

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });

const sanitizeName = (filename: string): string => {
  return filename
    .replace(/\.svg$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

export const useStore = create<AppState>((set, get) => ({
  icons: [],
  selectedIconId: null,
  previewConfig: {
    iconSize: 32,
    gap: 8,
  },
  isProcessing: false,
  isGenerating: false,
  exportProgress: 0,
  fontResult: null,

  addIcons: async (files: File[]) => {
    set({ isProcessing: true });
    try {
      const currentIcons = get().icons;
      const currentCount = currentIcons.length;
      const maxAllowed = 20 - currentCount;
      const validFiles = files
        .filter((f) => f.type === 'image/svg+xml' || f.name.toLowerCase().endsWith('.svg'))
        .filter((f) => f.size <= 500 * 1024)
        .slice(0, maxAllowed);

      const newIcons: IconData[] = [];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const content = await readFileAsText(file);
        newIcons.push({
          id: uuidv4(),
          name: sanitizeName(file.name),
          svgContent: content,
          order: currentCount + i,
          color: PRESET_COLORS[i % PRESET_COLORS.length],
        });
      }

      set({
        icons: [...currentIcons, ...newIcons],
        isProcessing: false,
      });
    } catch {
      set({ isProcessing: false });
    }
  },

  removeIcon: (id: string) => {
    const icons = get().icons.filter((i) => i.id !== id);
    icons.forEach((icon, idx) => {
      icon.order = idx;
    });
    set({
      icons,
      selectedIconId: get().selectedIconId === id ? null : get().selectedIconId,
    });
  },

  reorderIcons: (fromIndex: number, toIndex: number) => {
    const icons = [...get().icons].sort((a, b) => a.order - b.order);
    if (fromIndex < 0 || fromIndex >= icons.length || toIndex < 0 || toIndex >= icons.length) return;
    const [removed] = icons.splice(fromIndex, 1);
    icons.splice(toIndex, 0, removed);
    icons.forEach((icon, idx) => {
      icon.order = idx;
    });
    set({ icons });
  },

  updateIcon: (id: string, updates: Partial<IconData>) => {
    set({
      icons: get().icons.map((icon) =>
        icon.id === id ? { ...icon, ...updates } : icon
      ),
    });
  },

  selectIcon: (id: string | null) => {
    set({ selectedIconId: id });
  },

  generateFont: async () => {
    const icons = get().icons;
    if (icons.length < 3) return;
    set({ isGenerating: true });
    try {
      const result = await svgToWoff2(icons);
      set({ fontResult: result, isGenerating: false });
    } catch {
      set({ isGenerating: false });
    }
  },

  exportZip: async () => {
    const result = get().fontResult;
    if (!result) return;

    set({ exportProgress: 0 });

    const zip = new JSZip();
    const fontName = 'FontWorkshop';

    set({ exportProgress: 20 });

    const fontBinary = Uint8Array.from(atob(result.fontData), (c) => c.charCodeAt(0));
    zip.file(`${fontName}.woff2`, fontBinary);

    set({ exportProgress: 40 });

    zip.file(`${fontName}.css`, result.cssContent);
    zip.file(`${fontName}.html`, result.htmlDemo);
    zip.file(`${fontName}.json`, result.jsonMetadata);

    set({ exportProgress: 70 });

    const blob = await zip.generateAsync({ type: 'blob' });

    set({ exportProgress: 100 });

    saveAs(blob, `${fontName}.zip`);

    setTimeout(() => set({ exportProgress: 0 }), 1000);
  },
}));
