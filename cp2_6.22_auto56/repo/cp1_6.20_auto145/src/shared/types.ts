export interface Poem {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  content: string[];
  translation?: string;
  appreciation?: string;
  style: string[];
  tones: string[][];
  rhymePositions: number[];
  keywords: string[];
}

export interface ImageMatchResult {
  imageUrl: string;
  category: string;
  gradient: string;
  watermarkText: string;
}

export interface SearchRequest {
  keyword: string;
  style?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResponse {
  poems: (Poem & { thumbnail: ImageMatchResult })[];
  total: number;
}

export interface DetailResponse {
  poem: Poem;
  fullImage: ImageMatchResult;
}

export type StyleCategory = '全部' | '豪放' | '婉约' | '山水' | '边塞' | '咏物' | '田园';
