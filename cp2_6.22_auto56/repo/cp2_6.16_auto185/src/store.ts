import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  ColorHSL,
  ColorHEX,
  ColorSchemeGroup,
  hslToHex,
  generateMonochromatic,
  generateAnalogous,
  generateComplementary,
  generateSplitComplementary,
  generateTriadic,
} from './types';

interface ColorState {
  currentHSL: ColorHSL;
  currentHEX: ColorHEX;
  schemes: ColorSchemeGroup[];
  previewUpdateKey: number;
  toastMessage: string;
  toastVisible: boolean;
  setCurrentColor: (hsl: ColorHSL) => void;
  setToast: (message: string) => void;
  hideToast: () => void;
  generateSchemes: () => void;
}

export const useColorStore = create<ColorState>()(
  persist(
    (set, get) => ({
      currentHSL: { h: 210, s: 80, l: 55 },
      currentHEX: hslToHex(210, 80, 55),
      schemes: [],
      previewUpdateKey: 0,
      toastMessage: '',
      toastVisible: false,
      setCurrentColor: (hsl: ColorHSL) => {
        const hex = hslToHex(hsl.h, hsl.s, hsl.l);
        set({
          currentHSL: hsl,
          currentHEX: hex,
          previewUpdateKey: get().previewUpdateKey + 1,
        });
        get().generateSchemes();
      },
      setToast: (message: string) => {
        set({ toastMessage: message, toastVisible: true });
        setTimeout(() => {
          set({ toastVisible: false });
        }, 2000);
      },
      hideToast: () => set({ toastVisible: false }),
      generateSchemes: () => {
        const { currentHSL } = get();
        const schemes: ColorSchemeGroup[] = [
          {
            id: uuidv4(),
            name: '单色变体',
            description: '基于基色的明度变化',
            colors: generateMonochromatic(currentHSL),
          },
          {
            id: uuidv4(),
            name: '类似色',
            description: '色相左右各偏移30°',
            colors: generateAnalogous(currentHSL),
          },
          {
            id: uuidv4(),
            name: '互补色',
            description: '色相偏移180°',
            colors: generateComplementary(currentHSL),
          },
          {
            id: uuidv4(),
            name: '分裂互补',
            description: '偏移150°和210°',
            colors: generateSplitComplementary(currentHSL),
          },
          {
            id: uuidv4(),
            name: '三角形',
            description: '色相偏移120°',
            colors: generateTriadic(currentHSL),
          },
        ];
        set({ schemes, previewUpdateKey: get().previewUpdateKey + 1 });
      },
    }),
    {
      name: 'colorswirl-storage',
      partialize: (state) => ({
        currentHSL: state.currentHSL,
        currentHEX: state.currentHEX,
      }),
    }
  )
);
