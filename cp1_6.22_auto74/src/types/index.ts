export interface PlayerPosition {
  playerId: string;
  teamId: 'red' | 'blue';
  timestamp: number;
  x: number;
  y: number;
  z: 0;
  eventType: 'moving' | 'kill';
}

export interface KillEvent extends PlayerPosition {
  eventType: 'kill';
  victimId: string;
  victimTeamId: 'red' | 'blue';
}

export interface PlayerInfo {
  id: string;
  teamId: 'red' | 'blue';
  name: string;
  spawnPoint: { x: number; y: number };
}

export interface MatchData {
  matchId: string;
  gameType: 'CS:GO' | 'MOBA';
  duration: number;
  players: PlayerInfo[];
  events: (PlayerPosition | KillEvent)[];
}

export interface TeamStats {
  kills: number;
  deaths: number;
}

export interface RenderConfig {
  showRedTeam: boolean;
  showBlueTeam: boolean;
  heatmapEnabled: boolean;
  currentTime: number;
  isPlaying: boolean;
}

export interface KillMarker {
  id: string;
  timestamp: number;
  x: number;
  y: number;
  killerId: string;
  victimId: string;
  killerTeam: 'red' | 'blue';
}
