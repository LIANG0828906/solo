export type LayoutMode = 'single' | 'double' | 'triple';

export type EmotionType = 'joy' | 'sadness' | 'anger' | 'calm' | 'dream';

export interface EmotionTag {
  type: EmotionType;
  color: string;
  label: string;
}

export interface Annotation {
  id: string;
  text: string;
  x: number;
  y: number;
  emotionTag?: EmotionTag;
}

export interface Illustration {
  id: string;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
}

export interface Page {
  id: string;
  pageNumber: number;
  illustrations: Illustration[];
  annotations: Annotation[];
}

export interface IllustrationLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageLayout {
  pageNumber: number;
  illustrations: IllustrationLayout[];
  width: number;
  height: number;
}

export interface LayoutResult {
  pages: PageLayout[];
  pageWidth: number;
  pageHeight: number;
}

export const EMOTION_TAGS: Record<EmotionType, EmotionTag> = {
  joy: { type: 'joy', color: '#F6E05E', label: '喜悦' },
  sadness: { type: 'sadness', color: '#A0AEC0', label: '忧伤' },
  anger: { type: 'anger', color: '#FC8181', label: '愤怒' },
  calm: { type: 'calm', color: '#68D391', label: '宁静' },
  dream: { type: 'dream', color: '#B794F4', label: '梦幻' }
};

export const A4_MM = {
  width: 210,
  height: 297
};

export const DPI_300 = 300;
