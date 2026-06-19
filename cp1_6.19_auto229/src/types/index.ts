export type EmotionType = 'joy' | 'sorrow' | 'passion' | 'calm' | 'anger';

export interface Poem {
  id: string;
  title: string;
  author: string;
  content: string;
  createdAt: string;
  views: number;
}

export interface Annotation {
  id: string;
  poemId: string;
  lineNumber: number;
  content: string;
  emotion: EmotionType;
  author: string;
  createdAt: string;
}

export interface PoemStats {
  viewTrend: { date: string; views: number }[];
  annotationHeat: { line: number; count: number }[];
  emotionDistribution: { emotion: EmotionType; count: number; percentage: number }[];
}
