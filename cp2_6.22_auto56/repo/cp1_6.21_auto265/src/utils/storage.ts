import type { GameRecord, GameStats } from '../types';

const STATS_KEY = 'pixel_game_stats';
const RECORDS_KEY = 'pixel_game_records';
const MAX_RECORDS = 20;

export function getGameStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameStats;
      return {
        player1Wins: typeof parsed.player1Wins === 'number' ? parsed.player1Wins : 0,
        player2Wins: typeof parsed.player2Wins === 'number' ? parsed.player2Wins : 0,
      };
    }
  } catch {
    // 忽略解析错误
  }
  return { player1Wins: 0, player2Wins: 0 };
}

export function saveGameStats(stats: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // 忽略存储错误
  }
}

export function getGameRecords(): GameRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameRecord[];
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (r) =>
            r &&
            typeof r.id === 'string' &&
            typeof r.timestamp === 'number' &&
            (r.winner === 'player1' || r.winner === 'player2' || r.winner === 'draw')
        );
      }
    }
  } catch {
    // 忽略
  }
  return [];
}

export function saveGameRecord(record: GameRecord): void {
  try {
    const records = getGameRecords();
    records.unshift(record);
    const trimmed = records.slice(0, MAX_RECORDS);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(trimmed));
  } catch {
    // 忽略
  }
}

export function generateRecordId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
