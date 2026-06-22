export interface Theme {
  id: string;
  name: string;
  preview: string;
  navbarBg: string;
  navbarText: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarBorder: string;
  canvasBg: string;
  moduleBg: string;
  moduleText: string;
  moduleBorder: string;
  moduleShadow: string;
  moduleHoverShadow: string;
  accent: string;
  buttonBg: string;
  buttonText: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
}

export const themes: Theme[] = [
  {
    id: 'bright',
    name: '明亮',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
    navbarBg: '#ffffff',
    navbarText: '#333333',
    sidebarBg: '#fafafa',
    sidebarText: '#333333',
    sidebarBorder: '#e5e5e5',
    canvasBg: '#f0f0f0',
    moduleBg: '#ffffff',
    moduleText: '#333333',
    moduleBorder: '#e5e5e5',
    moduleShadow: '0 2px 8px rgba(0,0,0,0.1)',
    moduleHoverShadow: '0 8px 24px rgba(0,0,0,0.15)',
    accent: '#3b82f6',
    buttonBg: '#3b82f6',
    buttonText: '#ffffff',
    inputBg: '#ffffff',
    inputBorder: '#d1d5db',
    inputText: '#333333',
  },
  {
    id: 'dark',
    name: '暗夜',
    preview: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    navbarBg: '#1f2937',
    navbarText: '#f3f4f6',
    sidebarBg: '#111827',
    sidebarText: '#e5e7eb',
    sidebarBorder: '#374151',
    canvasBg: '#0f172a',
    moduleBg: '#1f2937',
    moduleText: '#f3f4f6',
    moduleBorder: '#374151',
    moduleShadow: '0 2px 8px rgba(0,0,0,0.4)',
    moduleHoverShadow: '0 8px 24px rgba(0,0,0,0.6)',
    accent: '#60a5fa',
    buttonBg: '#3b82f6',
    buttonText: '#ffffff',
    inputBg: '#1f2937',
    inputBorder: '#4b5563',
    inputText: '#f3f4f6',
  },
  {
    id: 'forest',
    name: '森林',
    preview: 'linear-gradient(135deg, #d1fae5 0%, #10b981 100%)',
    navbarBg: '#065f46',
    navbarText: '#ecfdf5',
    sidebarBg: '#ecfdf5',
    sidebarText: '#064e3b',
    sidebarBorder: '#a7f3d0',
    canvasBg: '#d1fae5',
    moduleBg: '#ecfdf5',
    moduleText: '#064e3b',
    moduleBorder: '#6ee7b7',
    moduleShadow: '0 2px 8px rgba(16,185,129,0.2)',
    moduleHoverShadow: '0 8px 24px rgba(16,185,129,0.3)',
    accent: '#10b981',
    buttonBg: '#10b981',
    buttonText: '#ffffff',
    inputBg: '#ecfdf5',
    inputBorder: '#6ee7b7',
    inputText: '#064e3b',
  },
  {
    id: 'ocean',
    name: '海洋',
    preview: 'linear-gradient(135deg, #dbeafe 0%, #3b82f6 100%)',
    navbarBg: '#1e40af',
    navbarText: '#eff6ff',
    sidebarBg: '#eff6ff',
    sidebarText: '#1e3a8a',
    sidebarBorder: '#93c5fd',
    canvasBg: '#dbeafe',
    moduleBg: '#eff6ff',
    moduleText: '#1e3a8a',
    moduleBorder: '#93c5fd',
    moduleShadow: '0 2px 8px rgba(59,130,246,0.2)',
    moduleHoverShadow: '0 8px 24px rgba(59,130,246,0.3)',
    accent: '#3b82f6',
    buttonBg: '#3b82f6',
    buttonText: '#ffffff',
    inputBg: '#eff6ff',
    inputBorder: '#93c5fd',
    inputText: '#1e3a8a',
  },
  {
    id: 'vintage',
    name: '复古',
    preview: 'linear-gradient(135deg, #fef3c7 0%, #d97706 100%)',
    navbarBg: '#78350f',
    navbarText: '#fffbeb',
    sidebarBg: '#fffbeb',
    sidebarText: '#78350f',
    sidebarBorder: '#fcd34d',
    canvasBg: '#fef3c7',
    moduleBg: '#fffbeb',
    moduleText: '#78350f',
    moduleBorder: '#fcd34d',
    moduleShadow: '0 2px 8px rgba(217,119,6,0.2)',
    moduleHoverShadow: '0 8px 24px rgba(217,119,6,0.3)',
    accent: '#d97706',
    buttonBg: '#d97706',
    buttonText: '#ffffff',
    inputBg: '#fffbeb',
    inputBorder: '#fcd34d',
    inputText: '#78350f',
  },
  {
    id: 'candy',
    name: '糖果',
    preview: 'linear-gradient(135deg, #fce7f3 0%, #ec4899 100%)',
    navbarBg: '#9d174d',
    navbarText: '#fdf2f8',
    sidebarBg: '#fdf2f8',
    sidebarText: '#9d174d',
    sidebarBorder: '#f9a8d4',
    canvasBg: '#fce7f3',
    moduleBg: '#fdf2f8',
    moduleText: '#9d174d',
    moduleBorder: '#f9a8d4',
    moduleShadow: '0 2px 8px rgba(236,72,153,0.2)',
    moduleHoverShadow: '0 8px 24px rgba(236,72,153,0.3)',
    accent: '#ec4899',
    buttonBg: '#ec4899',
    buttonText: '#ffffff',
    inputBg: '#fdf2f8',
    inputBorder: '#f9a8d4',
    inputText: '#9d174d',
  },
];

export const getTheme = (id: string): Theme => {
  return themes.find((t) => t.id === id) || themes[0];
};
