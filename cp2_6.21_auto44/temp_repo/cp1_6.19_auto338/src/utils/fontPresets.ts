import { FontPreset } from '@/types';

export const FONT_PRESETS: FontPreset[] = [
  {
    name: 'modern',
    displayName: '现代',
    titleFont: 'Poppins, sans-serif',
    bodyFont: 'Inter, sans-serif',
  },
  {
    name: 'retro',
    displayName: '复古',
    titleFont: 'Playfair Display, serif',
    bodyFont: 'Source Serif Pro, serif',
  },
  {
    name: 'minimal',
    displayName: '简约',
    titleFont: 'Helvetica Neue, sans-serif',
    bodyFont: 'Helvetica, sans-serif',
  },
  {
    name: 'handwriting',
    displayName: '手写',
    titleFont: 'Dancing Script, cursive',
    bodyFont: 'Caveat, cursive',
  },
  {
    name: 'bold',
    displayName: '粗犷',
    titleFont: 'Bebas Neue, sans-serif',
    bodyFont: 'Oswald, sans-serif',
  },
];

export const DEFAULT_FONT_PRESET = FONT_PRESETS[0];
