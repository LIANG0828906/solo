export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

export interface Stroke {
  id: number;
  points: Point[];
  width: number;
  completed?: boolean;
  matched?: boolean;
}

export interface CharacterStroke {
  id: number;
  name: string;
  points: Point[];
  widthStart: number;
  widthEnd: number;
  widthMid: number;
}

export interface RubbingCharacter {
  char: string;
  strokes: CharacterStroke[];
}

export interface Rubbing {
  id: string;
  name: string;
  dynasty: string;
  author: string;
  year: string;
  thumbnail: string;
  characters: RubbingCharacter[];
  description: string;
}

export interface PracticeRecord {
  id: string;
  rubbingId: string;
  rubbingName: string;
  character: string;
  score: number;
  strokeScores: { strokeId: number; score: number }[];
  userStrokes: Stroke[];
  date: string;
  timestamp: number;
}

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export type ViewMode = 'gallery' | 'practice' | 'history';
