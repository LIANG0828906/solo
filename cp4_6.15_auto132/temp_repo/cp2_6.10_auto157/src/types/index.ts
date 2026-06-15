export interface GameInstruction {
  id: string;
  type: 'click' | 'swipe' | 'pinch' | 'rotate' | 'shake';
  target: string;
  description: string;
  icon: string;
  points: number;
  timeLimit: number;
}

export type RankName =
  | '洒扫童子'
  | '侍墨童子'
  | '伴读书童'
  | '文房管事'
  | '知书房事'
  | '翰林院侍书';

export interface RankConfig {
  name: RankName;
  minScore: number;
}
