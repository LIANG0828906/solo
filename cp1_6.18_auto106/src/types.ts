export type EmotionTag = '欣喜' | '忧伤' | '愤怒' | '平静' | '惊讶';

export interface MemoryNode {
  id: string;
  content: string;
  description: string;
  timestamp: number;
  emotion: EmotionTag;
  x: number;
  y: number;
  z: number;
  color: string;
  intensity: number;
}

export interface Link {
  id: string;
  source: string;
  target: string;
  color: string;
  opacity: number;
  width: number;
}
