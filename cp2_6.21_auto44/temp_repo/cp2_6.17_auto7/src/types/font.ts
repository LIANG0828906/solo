export type FontCategory = 'serif' | 'sans-serif' | 'handwriting' | 'monospace' | 'display';
export type FontTag = 'poster' | 'body' | 'heading' | 'code' | 'decorative';

export interface Font {
  id: string;
  name: string;
  googleFontName: string;
  category: FontCategory;
  variants: {
    weights: number;
    italics: number;
  };
  tags: FontTag[];
}

export interface FilterState {
  category: FontCategory | 'all';
  tags: FontTag[];
  searchText: string;
}

export interface PreviewParams {
  text: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  backgroundColor: string;
}
