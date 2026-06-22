export type GameResult = 'win' | 'lose' | 'draw';

export interface GameRecord {
  result: GameResult;
  playerColor: 'black' | 'white';
  timestamp: number;
}

export interface StatsData {
  totalGames: number;
  wins: number;
  recentGames: GameRecord[];
}

const STORAGE_KEY = 'reversi_stats';
const MAX_RECENT = 10;

function loadStats(): StatsData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
  return { totalGames: 0, wins: 0, recentGames: [] };
}

function saveStats(stats: StatsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats:', e);
  }
}

export function getStats(): StatsData {
  return loadStats();
}

export function addGameResult(
  result: GameResult,
  playerColor: 'black' | 'white'
): StatsData {
  const stats = loadStats();
  stats.totalGames++;

  if (result === 'win') {
    stats.wins++;
  }

  const record: GameRecord = {
    result,
    playerColor,
    timestamp: Date.now(),
  };

  stats.recentGames.unshift(record);
  stats.recentGames = stats.recentGames.slice(0, MAX_RECENT);

  saveStats(stats);
  return stats;
}

export function clearStats(): StatsData {
  const emptyStats: StatsData = { totalGames: 0, wins: 0, recentGames: [] };
  saveStats(emptyStats);
  return emptyStats;
}

export function getWinRate(stats: StatsData): number {
  if (stats.totalGames === 0) return 0;
  return Math.round((stats.wins / stats.totalGames) * 100);
}
