export interface GameInstruction {
  id: string;
  text: string;
  type: 'drag' | 'click' | 'sequence';
  targetItem: string;
  targetZone: RoomZone;
  steps?: string[];
  points: number;
}

export interface GameRecord {
  id: string;
  timestamp: number;
  score: number;
  totalTime: number;
  rank: string;
  comments: string[];
  instructionsCompleted: number;
}

export type RoomZone = 'desk' | 'bookshelf' | 'painting_jar' | 'qin_table' | 'tea_house';

export interface RoomItem {
  id: string;
  name: string;
  icon: string;
  zone: RoomZone;
  position: {
    x: number;
    y: number;
  };
}

export interface ScholarComment {
  scholarName: string;
  comment: string;
  performanceLevel: 'good' | 'normal' | 'bad';
}

export interface RankLevel {
  name: string;
  minScore: number;
}

export interface DragState {
  isDragging: boolean;
  itemId: string | null;
  currentPosition: {
    x: number;
    y: number;
  };
}
