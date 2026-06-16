import { get, set, del } from 'idb-keyval';
import { ShipBuild, LeaderboardEntry, Achievement } from '../types';
import { ACHIEVEMENTS } from './constants';
import { v4 as uuidv4 } from 'uuid';

const KEYS = {
  SHIP_BUILDS: 'astroforge_ship_builds',
  CURRENT_BUILD: 'astroforge_current_build',
  LEADERBOARD: 'astroforge_leaderboard',
  ACHIEVEMENTS: 'astroforge_achievements',
  HIGH_SCORE: 'astroforge_high_score',
  TOTAL_KILLS: 'astroforge_total_kills',
  CREDITS: 'astroforge_credits',
} as const;

export async function getShipBuilds(): Promise<ShipBuild[]> {
  const builds = await get<ShipBuild[]>(KEYS.SHIP_BUILDS);
  if (!builds || builds.length === 0) {
    const defaultBuild: ShipBuild = {
      id: uuidv4(),
      name: '默认配置',
      weapon: { type: 'laser', level: 1 },
      shield: { type: 'damage', level: 1 },
      engine: { type: 'speed', level: 1 },
    };
    await set(KEYS.SHIP_BUILDS, [defaultBuild]);
    await set(KEYS.CURRENT_BUILD, defaultBuild.id);
    return [defaultBuild];
  }
  return builds;
}

export async function saveShipBuild(build: ShipBuild): Promise<void> {
  const builds = await getShipBuilds();
  const index = builds.findIndex(b => b.id === build.id);
  if (index >= 0) {
    builds[index] = build;
  } else {
    builds.push(build);
  }
  await set(KEYS.SHIP_BUILDS, builds);
}

export async function deleteShipBuild(id: string): Promise<void> {
  const builds = await getShipBuilds();
  const filtered = builds.filter(b => b.id !== id);
  await set(KEYS.SHIP_BUILDS, filtered);
  const currentId = await getCurrentBuildId();
  if (currentId === id && filtered.length > 0) {
    await setCurrentBuildId(filtered[0].id);
  }
}

export async function getCurrentBuildId(): Promise<string | null> {
  return await get<string>(KEYS.CURRENT_BUILD) || null;
}

export async function setCurrentBuildId(id: string): Promise<void> {
  await set(KEYS.CURRENT_BUILD, id);
}

export async function getCurrentBuild(): Promise<ShipBuild | null> {
  const builds = await getShipBuilds();
  const currentId = await getCurrentBuildId();
  return builds.find(b => b.id === currentId) || builds[0] || null;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const entries = await get<LeaderboardEntry[]>(KEYS.LEADERBOARD);
  return entries || [];
}

export async function addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id' | 'date'>): Promise<LeaderboardEntry> {
  const entries = await getLeaderboard();
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: uuidv4(),
    date: Date.now(),
  };
  entries.push(newEntry);
  entries.sort((a, b) => b.score - a.score);
  const top10 = entries.slice(0, 10);
  await set(KEYS.LEADERBOARD, top10);
  return newEntry;
}

export async function isHighScore(score: number): Promise<boolean> {
  const entries = await getLeaderboard();
  if (entries.length < 10) return true;
  return score > entries[entries.length - 1].score;
}

export async function getHighScore(): Promise<number> {
  const score = await get<number>(KEYS.HIGH_SCORE);
  return score || 0;
}

export async function setHighScore(score: number): Promise<void> {
  const current = await getHighScore();
  if (score > current) {
    await set(KEYS.HIGH_SCORE, score);
  }
}

export async function getAchievements(): Promise<Achievement[]> {
  const saved = await get<Achievement[]>(KEYS.ACHIEVEMENTS);
  if (!saved) {
    const initial: Achievement[] = ACHIEVEMENTS.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      unlocked: false,
    }));
    await set(KEYS.ACHIEVEMENTS, initial);
    return initial;
  }
  return saved;
}

export async function unlockAchievement(id: string): Promise<Achievement | null> {
  const achievements = await getAchievements();
  const achievement = achievements.find(a => a.id === id);
  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();
    await set(KEYS.ACHIEVEMENTS, achievements);
    return achievement;
  }
  return null;
}

export async function getTotalKills(): Promise<number> {
  const kills = await get<number>(KEYS.TOTAL_KILLS);
  return kills || 0;
}

export async function addKills(count: number): Promise<number> {
  const current = await getTotalKills();
  const total = current + count;
  await set(KEYS.TOTAL_KILLS, total);
  return total;
}

export async function getCredits(): Promise<number> {
  const credits = await get<number>(KEYS.CREDITS);
  return credits || 0;
}

export async function addCredits(amount: number): Promise<number> {
  const current = await getCredits();
  const total = current + amount;
  await set(KEYS.CREDITS, total);
  return total;
}

export async function spendCredits(amount: number): Promise<boolean> {
  const current = await getCredits();
  if (current >= amount) {
    await set(KEYS.CREDITS, current - amount);
    return true;
  }
  return false;
}

export { KEYS };
