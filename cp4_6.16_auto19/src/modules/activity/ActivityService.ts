import { v4 as uuidv4 } from 'uuid';
import {
  getAllFromStore,
  getFromStore,
  putToStore,
  getFromIndex,
  deleteFromStore,
  STORES,
} from '@/utils/db';
import type { Activity, ActivityPlayer, PlayerStats, Boardgame } from '@/types';
import { getAllBoardgames } from '../boardgame/BoardgameService';

function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createActivity(
  data: Omit<Activity, 'id' | 'inviteCode' | 'createdAt' | 'status'>
): Promise<Activity> {
  let inviteCode: string;
  let exists: Activity | undefined;
  do {
    inviteCode = generateInviteCode();
    exists = await getActivityByInviteCode(inviteCode);
  } while (exists);

  const activity: Activity = {
    ...data,
    id: uuidv4(),
    inviteCode,
    createdAt: new Date().toISOString(),
    status: 'upcoming',
  };

  await putToStore(STORES.ACTIVITIES, activity);
  return activity;
}

export async function getActivityByInviteCode(
  code: string
): Promise<Activity | undefined> {
  const results = await getFromIndex<Activity>(
    STORES.ACTIVITIES,
    'inviteCode',
    code
  );
  return results[0];
}

export async function getActivityById(id: string): Promise<Activity | undefined> {
  return getFromStore<Activity>(STORES.ACTIVITIES, id);
}

export async function getAllActivities(): Promise<Activity[]> {
  const activities = await getAllFromStore<Activity>(STORES.ACTIVITIES);
  return activities.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
}

export async function getUpcomingActivities(): Promise<Activity[]> {
  const activities = await getAllActivities();
  const now = new Date();
  return activities.filter((a) => new Date(a.dateTime) > now && a.status === 'upcoming');
}

export async function getActivitiesByDate(date: Date): Promise<Activity[]> {
  const activities = await getAllActivities();
  const dateStr = date.toDateString();
  return activities.filter((a) => new Date(a.dateTime).toDateString() === dateStr);
}

export async function getActivitiesForMonth(year: number, month: number): Promise<Activity[]> {
  const activities = await getAllActivities();
  return activities.filter((a) => {
    const d = new Date(a.dateTime);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export async function joinActivity(
  activityId: string,
  playerId: string,
  playerName: string
): Promise<ActivityPlayer | null> {
  const existing = await getActivityPlayer(activityId, playerId);
  if (existing) return null;

  const activityPlayer: ActivityPlayer = {
    id: uuidv4(),
    activityId,
    playerId,
    playerName,
    joinedAt: new Date().toISOString(),
  };

  await putToStore(STORES.ACTIVITY_PLAYERS, activityPlayer);
  return activityPlayer;
}

export async function leaveActivity(
  activityId: string,
  playerId: string
): Promise<boolean> {
  const existing = await getActivityPlayer(activityId, playerId);
  if (!existing) return false;

  await deleteFromStore(STORES.ACTIVITY_PLAYERS, existing.id);
  return true;
}

export async function getActivityPlayer(
  activityId: string,
  playerId: string
): Promise<ActivityPlayer | undefined> {
  const players = await getActivityPlayers(activityId);
  return players.find((p) => p.playerId === playerId);
}

export async function getActivityPlayers(activityId: string): Promise<ActivityPlayer[]> {
  const results = await getFromIndex<ActivityPlayer>(
    STORES.ACTIVITY_PLAYERS,
    'activityId',
    activityId
  );
  return results.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
}

export async function recordGameResult(
  activityId: string,
  results: { playerId: string; rank?: number; team?: string }[]
): Promise<void> {
  const players = await getActivityPlayers(activityId);

  for (const result of results) {
    const player = players.find((p) => p.playerId === result.playerId);
    if (player) {
      const updated = { ...player, rank: result.rank, team: result.team };
      await putToStore(STORES.ACTIVITY_PLAYERS, updated);
    }
  }

  const activity = await getActivityById(activityId);
  if (activity) {
    const updatedActivity = { ...activity, status: 'finished' as const };
    await putToStore(STORES.ACTIVITIES, updatedActivity);
  }
}

export async function getPlayerActivityHistory(playerId: string): Promise<Activity[]> {
  const activityPlayers = await getFromIndex<ActivityPlayer>(
    STORES.ACTIVITY_PLAYERS,
    'playerId',
    playerId
  );
  const activityIds = activityPlayers.map((ap) => ap.activityId);
  const allActivities = await getAllActivities();
  return allActivities.filter((a) => activityIds.includes(a.id));
}

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const activityPlayers = await getFromIndex<ActivityPlayer>(
    STORES.ACTIVITY_PLAYERS,
    'playerId',
    playerId
  );

  const finishedRecords = activityPlayers.filter((ap) => ap.rank !== undefined);
  const wins = finishedRecords.filter((ap) => ap.rank === 1).length;
  const totalActivities = activityPlayers.length;
  const winRate = finishedRecords.length > 0 ? wins / finishedRecords.length : 0;

  const allGames = await getAllBoardgames();
  const gameMap = new Map<string, Boardgame>();
  allGames.forEach((g) => gameMap.set(g.id, g));

  const allActivities = await getAllActivities();
  const activityMap = new Map<string, Activity>();
  allActivities.forEach((a) => activityMap.set(a.id, a));

  const gameCountMap = new Map<string, number>();
  for (const ap of activityPlayers) {
    const activity = activityMap.get(ap.activityId);
    if (activity) {
      const gameId = activity.boardgameId;
      gameCountMap.set(gameId, (gameCountMap.get(gameId) || 0) + 1);
    }
  }

  const gamePreferences = Array.from(gameCountMap.entries())
    .map(([gameId, count]) => ({
      gameId,
      gameName: gameMap.get(gameId)?.name || '未知桌游',
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalActivities,
    wins,
    winRate,
    gamePreferences,
  };
}

export async function getUpcomingActivitiesForNext7Days(): Promise<Activity[]> {
  const allUpcoming = await getUpcomingActivities();
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return allUpcoming.filter((a) => {
    const d = new Date(a.dateTime);
    return d >= now && d <= in7Days;
  });
}
