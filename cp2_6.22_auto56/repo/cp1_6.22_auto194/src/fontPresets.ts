export interface FontConfig {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: 'normal' | 'bold';
}

export const SYSTEM_FONTS: string[] = [
  'Arial',
  'Georgia',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
];

export interface PresetConfig {
  name: string;
  configs: FontConfig[];
}

const baseConfig: Omit<FontConfig, 'fontFamily'> = {
  fontSize: 18,
  lineHeight: 1.6,
  fontWeight: 'normal',
};

export const FONT_PRESETS: PresetConfig[] = [
  {
    name: 'Serif组合',
    configs: [
      { fontFamily: 'Georgia', ...baseConfig, fontWeight: 'bold' },
      { fontFamily: 'Times New Roman', ...baseConfig },
      { fontFamily: 'Georgia', ...baseConfig },
      { fontFamily: 'Times New Roman', ...baseConfig, fontWeight: 'bold' },
    ],
  },
  {
    name: 'Sans-Serif组合',
    configs: [
      { fontFamily: 'Arial', ...baseConfig, fontWeight: 'bold' },
      { fontFamily: 'Helvetica', ...baseConfig },
      { fontFamily: 'Verdana', ...baseConfig },
      { fontFamily: 'Arial', ...baseConfig },
    ],
  },
  {
    name: '混搭组合',
    configs: [
      { fontFamily: 'Helvetica', ...baseConfig, fontWeight: 'bold' },
      { fontFamily: 'Georgia', ...baseConfig },
      { fontFamily: 'Arial', ...baseConfig },
      { fontFamily: 'Courier New', ...baseConfig },
    ],
  },
  {
    name: '系统默认',
    configs: [
      { fontFamily: 'system-ui', ...baseConfig, fontWeight: 'bold' },
      { fontFamily: 'system-ui', ...baseConfig },
      { fontFamily: 'system-ui', ...baseConfig },
      { fontFamily: 'system-ui', ...baseConfig },
    ],
  },
];

export const createDefaultConfig = (fontFamily: string = 'Arial'): FontConfig => ({
  fontFamily,
  fontSize: 18,
  lineHeight: 1.6,
  fontWeight: 'normal',
});

export const createFourDefaults = (): FontConfig[] => [
  createDefaultConfig('Arial'),
  createDefaultConfig('Georgia'),
  createDefaultConfig('Helvetica'),
  createDefaultConfig('Verdana'),
];
