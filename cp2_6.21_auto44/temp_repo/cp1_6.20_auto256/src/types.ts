export type TreasureType = 'gem' | 'coin' | 'chest';

export interface Treasure {
  id: string;
  type: TreasureType;
  lat: number;
  lng: number;
  collected: boolean;
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface GameState {
  treasures: Treasure[];
  player: Player | null;
  leaderboard: Player[];
  gameRound: number;
  countdownActive: boolean;
  countdownEndTime: number;
  centerLat: number;
  centerLng: number;
}

export const SCORE_MAP: Record<TreasureType, number> = {
  gem: 10,
  coin: 5,
  chest: 15,
};

export const COLOR_MAP: Record<TreasureType, string> = {
  gem: '#ff5252',
  coin: '#ffd740',
  chest: '#ce93d8',
};
