export interface Member {
  id: string;
  name: string;
  elo: number;
  initialElo: number;
  createdAt: string;
}

export type MatchResult = 'win' | 'loss' | 'draw';

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  result: MatchResult;
  date: string;
  player1OldElo: number;
  player2OldElo: number;
  player1NewElo: number;
  player2NewElo: number;
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export type Level = '新手' | '业余' | '高级' | '大师';

export function getLevel(elo: number): Level {
  if (elo < 1000) return '新手';
  if (elo < 1400) return '业余';
  if (elo < 1800) return '高级';
  return '大师';
}

const AVATAR_COLORS = ['#34495E', '#E74C3C', '#2ECC71', '#F39C12'];

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}
