export type ThemeKey = 'minimal' | 'business' | 'cartoon';

export interface ThemeConfig {
  name: string;
  bg: string;
  fg: string;
  accent: string;
  font: string;
  badge: string;
}

export interface Card {
  id: string;
  text: string;
  imageUrl: string;
  theme: ThemeKey;
}

export interface MaterialItem {
  id: string;
  text: string;
  imageUrl: string;
  tags: string[];
  themes: string[];
}

export interface MaterialsResponse {
  total: number;
  items: MaterialItem[];
}

export interface ImageItem {
  id: string;
  url: string;
  tags: string[];
}

export interface ImagesResponse {
  items: ImageItem[];
}
