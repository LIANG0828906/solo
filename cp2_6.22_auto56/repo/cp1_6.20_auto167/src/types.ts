export interface PlayerStats {
  playerId: string;
  playerName: string;
  totalKills: number;
  totalSurvivalTime: number;
  winStreak: number;
  maxWinStreak: number;
  totalGames: number;
  totalWins: number;
  unlockedBadges: string[];
}

export interface GameResult {
  playerId: string;
  playerName: string;
  kills: number;
  survivalTime: number;
  winStreak: number;
  won: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
  icon: string;
  requirement: (stats: PlayerStats) => boolean;
  progress: (stats: PlayerStats) => { current: number; total: number };
}

export type LeaderboardCategory = 'kills' | 'survival' | 'winStreak';

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  value: number;
  rank: number;
  isSelf?: boolean;
}

export interface UnlockNotification {
  playerId: string;
  playerName: string;
  badgeId: string;
  badgeName: string;
  tier: string;
}
