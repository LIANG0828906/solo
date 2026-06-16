export interface Artwork {
  id: string;
  title: string;
  imageUrl: string;
  colorTags: string[];
  styleTags: string[];
  keywords: string[];
  createdAt: string;
}

export interface FilterCriteria {
  colors: string[];
  styles: string[];
  keyword: string;
}

export const COLOR_PALETTE = [
  '#E07A5F',
  '#F2CC8F',
  '#81B29A',
  '#3D405B',
  '#F4F1DE',
  '#E63946',
  '#457B9D',
  '#A8DADC',
  '#1D3557',
  '#F1FAEE',
  '#264653',
  '#E9C46A',
];

export const STYLE_OPTIONS = ['水彩', '油画', '板绘', '素描', '拼贴'];
