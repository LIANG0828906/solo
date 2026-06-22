import { v4 as uuidv4 } from 'uuid';
import type { GameResult, Badge, PlayerStats } from '../src/types';

const ADJECTIVES = [
  'Storm', 'Shadow', 'Iron', 'Thunder', 'Crimson', 'Azure', 'Phoenix', 'Viper',
  'Ghost', 'Blaze', 'Frost', 'Nova', 'Raven', 'Titan', 'Spectre', 'Falcon',
  'Dragon', 'Wolf', 'Hawk', 'Tiger', 'Python', 'Rocket', 'Bullet', 'Laser',
];

const NOUNS = [
  'Falcon', 'Striker', 'Hunter', 'Viper', 'Phoenix', 'Wraith', 'Reaper', 'Sniper',
  'Assault', 'Guardian', 'Ranger', 'Captain', 'Sergeant', 'General', 'Legend',
  'Hero', 'Master', 'Knight', 'Samurai', 'Ninja', 'Pilot', 'Soldier', 'Marine',
];

export function generatePlayerName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${noun}${num}`;
}

export function generatePlayerId(): string {
  return uuidv4();
}

export function generateGameResult(playerId: string, playerName: string): GameResult {
  const kills = Math.floor(Math.random() * 25) + 1;
  const survivalTime = Math.floor(Math.random() * 900) + 60;
  const won = Math.random() > 0.5;
  const baseStreak = Math.floor(Math.random() * 3);
  const winStreak = won ? baseStreak + 1 : 0;

  return {
    playerId,
    playerName,
    kills,
    survivalTime,
    winStreak,
    won,
  };
}

export const BADGES: Badge[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Get your first kill in battle',
    tier: 'bronze',
    icon: '🩸',
    requirement: (s) => s.totalKills >= 1,
    progress: (s) => ({ current: Math.min(s.totalKills, 1), total: 1 }),
  },
  {
    id: 'kill_streak_5',
    name: 'Rampage',
    description: 'Achieve a 5-game win streak',
    tier: 'bronze',
    icon: '🔥',
    requirement: (s) => s.maxWinStreak >= 5,
    progress: (s) => ({ current: Math.min(s.maxWinStreak, 5), total: 5 }),
  },
  {
    id: 'survivor_30min',
    name: 'Survivor',
    description: 'Survive a total of 30 minutes in battle',
    tier: 'bronze',
    icon: '🛡️',
    requirement: (s) => s.totalSurvivalTime >= 1800,
    progress: (s) => ({ current: Math.min(s.totalSurvivalTime, 1800), total: 1800 }),
  },
  {
    id: 'kills_50',
    name: 'Sharpshooter',
    description: 'Get 50 total kills',
    tier: 'silver',
    icon: '🎯',
    requirement: (s) => s.totalKills >= 50,
    progress: (s) => ({ current: Math.min(s.totalKills, 50), total: 50 }),
  },
  {
    id: 'win_streak_10',
    name: 'Unstoppable',
    description: 'Achieve a 10-game win streak',
    tier: 'silver',
    icon: '⚡',
    requirement: (s) => s.maxWinStreak >= 10,
    progress: (s) => ({ current: Math.min(s.maxWinStreak, 10), total: 10 }),
  },
  {
    id: 'games_20',
    name: 'Veteran',
    description: 'Play 20 total games',
    tier: 'silver',
    icon: '🎖️',
    requirement: (s) => s.totalGames >= 20,
    progress: (s) => ({ current: Math.min(s.totalGames, 20), total: 20 }),
  },
  {
    id: 'kills_100',
    name: 'Centurion',
    description: 'Get 100 total kills',
    tier: 'gold',
    icon: '👑',
    requirement: (s) => s.totalKills >= 100,
    progress: (s) => ({ current: Math.min(s.totalKills, 100), total: 100 }),
  },
  {
    id: 'survival_100min',
    name: 'Iron Will',
    description: 'Survive a total of 100 minutes',
    tier: 'gold',
    icon: '⏳',
    requirement: (s) => s.totalSurvivalTime >= 6000,
    progress: (s) => ({ current: Math.min(s.totalSurvivalTime, 6000), total: 6000 }),
  },
  {
    id: 'win_streak_20',
    name: 'Legendary',
    description: 'Achieve a 20-game win streak',
    tier: 'gold',
    icon: '🏆',
    requirement: (s) => s.maxWinStreak >= 20,
    progress: (s) => ({ current: Math.min(s.maxWinStreak, 20), total: 20 }),
  },
];

export function checkBadgeUnlocks(stats: PlayerStats): string[] {
  const newlyUnlocked: string[] = [];
  for (const badge of BADGES) {
    if (!stats.unlockedBadges.includes(badge.id) && badge.requirement(stats)) {
      newlyUnlocked.push(badge.id);
    }
  }
  return newlyUnlocked;
}

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}

export function createInitialStats(playerId: string, playerName: string): PlayerStats {
  return {
    playerId,
    playerName,
    totalKills: 0,
    totalSurvivalTime: 0,
    winStreak: 0,
    maxWinStreak: 0,
    totalGames: 0,
    totalWins: 0,
    unlockedBadges: [],
  };
}

export function applyGameResult(stats: PlayerStats, result: GameResult): PlayerStats {
  const newStats = { ...stats };
  newStats.totalKills += result.kills;
  newStats.totalSurvivalTime += result.survivalTime;
  newStats.totalGames += 1;
  if (result.won) {
    newStats.totalWins += 1;
    newStats.winStreak = stats.winStreak + 1;
  } else {
    newStats.winStreak = 0;
  }
  newStats.maxWinStreak = Math.max(newStats.maxWinStreak, newStats.winStreak);
  return newStats;
}
