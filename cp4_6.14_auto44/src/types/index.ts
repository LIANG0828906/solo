export interface UserStory {
  id: string;
  role: string;
  action: string;
  expectedResult: string;
  featurePoints: string[];
}

export type ElementType = 'button' | 'input' | 'text' | 'nav' | 'title';

export interface WireframeElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export type PageType = 'home' | 'login' | 'settings' | 'list' | 'detail';

export interface WireframePage {
  id: string;
  title: string;
  type: PageType;
  elements: WireframeElement[];
}

export interface ParseStoryRequest {
  markdown: string;
}

export interface ParseStoryResponse {
  stories: UserStory[];
  pages: WireframePage[];
}

export interface SaveLayoutRequest {
  pageId: string;
  elements: WireframeElement[];
}

export interface SaveLayoutResponse {
  success: boolean;
  message: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    text: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    cardBg: string;
    editorBg: string;
    editorText: string;
  };
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#f8fafc',
    text: '#0f172a',
    primary: '#6366f1',
    secondary: '#e2e8f0',
    accent: '#f97316',
    border: '#cbd5e1',
    cardBg: '#ffffff',
    editorBg: '#1e293b',
    editorText: '#e2e8f0',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#0f172a',
    text: '#f1f5f9',
    primary: '#818cf8',
    secondary: '#334155',
    accent: '#fb923c',
    border: '#475569',
    cardBg: '#1e293b',
    editorBg: '#0f172a',
    editorText: '#e2e8f0',
  },
};
