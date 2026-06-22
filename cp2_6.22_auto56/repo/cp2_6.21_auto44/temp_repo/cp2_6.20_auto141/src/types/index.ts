export type CellType = 'empty' | 'obstacle' | 'boost' | 'platform';

export interface TrackCell {
  x: number;
  y: number;
  type: CellType;
  height?: number;
  multiplier?: number;
}

export interface TrackData {
  id: string;
  name: string;
  width: number;
  height: number;
  cells: TrackCell[];
  createdAt: number;
}

export interface PlayerState {
  x: number;
  y: number;
  velocityY: number;
  speed: number;
  isJumping: boolean;
  isOnGround: boolean;
  jumpHoldTime: number;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'finished';

export interface LeaderboardEntry {
  id: string;
  trackId: string;
  trackName: string;
  playerName: string;
  time: number;
  timestamp: number;
  skin: string;
}

export interface SkinData {
  color: string;
  accessory: {
    glasses: string | null;
    helmet: string | null;
    cape: string | null;
  };
}
