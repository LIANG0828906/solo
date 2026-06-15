export interface Boardgame {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  averageDuration: number;
  bggRating: number;
  description: string;
  emoji: string;
  isCustom: boolean;
}

export interface Activity {
  id: string;
  boardgameId: string;
  title: string;
  dateTime: string;
  location: string;
  notes: string;
  inviteCode: string;
  hostId: string;
  hostName: string;
  createdAt: string;
  status: 'upcoming' | 'finished';
}

export interface Player {
  id: string;
  name: string;
  avatarInitial: string;
  createdAt: string;
}

export interface ActivityPlayer {
  id: string;
  activityId: string;
  playerId: string;
  playerName: string;
  rank?: number;
  team?: string;
  joinedAt: string;
}

export interface PlayerStats {
  totalActivities: number;
  wins: number;
  winRate: number;
  gamePreferences: { gameId: string; gameName: string; count: number }[];
}
