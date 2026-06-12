export interface ThemePreset {
  name: string;
  key: string;
  background: string;
  accent: string;
  text: string;
}

export const themes: ThemePreset[] = [
  {
    name: '暗夜翡翠',
    key: 'dark-emerald',
    background: '#0f1a2c',
    accent: '#00d4a6',
    text: '#e0f2e9',
  },
  {
    name: '极简白',
    key: 'minimal-white',
    background: '#fafafa',
    accent: '#3b82f6',
    text: '#1e293b',
  },
  {
    name: '暖阳橙',
    key: 'warm-orange',
    background: '#fffbeb',
    accent: '#f97316',
    text: '#451a03',
  },
];
