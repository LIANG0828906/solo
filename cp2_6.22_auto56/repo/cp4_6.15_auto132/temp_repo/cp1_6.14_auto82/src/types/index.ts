export type TemplateId = 'serious' | 'entertainment' | 'vintage';

export interface CoverData {
  title: string;
  summary: string;
  date: string;
  author: string;
  template: TemplateId;
}

export interface CoverRecord extends CoverData {
  id: string;
  createdAt: number;
  thumbnail?: string;
}

export interface TemplateStyle {
  id: TemplateId;
  name: string;
  fontFamily: {
    title: string;
    body: string;
  };
  colors: {
    background: string;
    title: string;
    body: string;
    accent: string;
    headerBg: string;
    headerText: string;
  };
  layout: {
    titleAlign: 'left' | 'center' | 'right';
    titleItalic?: boolean;
    headerAlign?: 'left' | 'center' | 'right';
  };
}

export const TEMPLATES: TemplateStyle[] = [
  {
    id: 'serious',
    name: '严肃大报',
    fontFamily: {
      title: 'Playfair Display, Georgia, serif',
      body: 'Georgia, "Times New Roman", serif',
    },
    colors: {
      background: '#0a0a0a',
      title: '#1a1a1a',
      body: '#e5e5e5',
      accent: '#FFD700',
      headerBg: '#1a1a1a',
      headerText: '#FFD700',
    },
    layout: {
      titleAlign: 'center',
    },
  },
  {
    id: 'entertainment',
    name: '娱乐小报',
    fontFamily: {
      title: 'Pacifico, "Dancing Script", cursive',
      body: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    },
    colors: {
      background: '#FFE4EC',
      title: '#D946EF',
      body: '#4a4a4a',
      accent: '#8B5CF6',
      headerBg: '#D946EF',
      headerText: '#ffffff',
    },
    layout: {
      titleAlign: 'center',
      titleItalic: true,
    },
  },
  {
    id: 'vintage',
    name: '复古黑白',
    fontFamily: {
      title: '"Courier New", Courier, monospace',
      body: '"Courier New", Courier, monospace',
    },
    colors: {
      background: '#F5E6C8',
      title: '#333333',
      body: '#2c2c2c',
      accent: '#8B4513',
      headerBg: '#8B4513',
      headerText: '#F5E6C8',
    },
    layout: {
      titleAlign: 'left',
      headerAlign: 'left',
    },
  },
];
