export type BlockType = 'straight' | 'turn' | 'slope' | 'spike' | 'boost' | 'start' | 'end';

export interface TrackCell {
  type: BlockType;
  rotation: number;
  gridX: number;
  gridZ: number;
}

export interface GameState {
  mode: 'editor' | 'game';
  playerTime: number;
  aiTime: number;
  isRunning: boolean;
  isFinished: boolean;
}
