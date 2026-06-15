import { v4 as uuidv4 } from 'uuid';
import { getAllFromStore, getFromStore, putToStore, STORES } from '@/utils/db';
import type { Player } from '@/types';

const CURRENT_PLAYER_KEY = 'current_player_id';

export async function getCurrentPlayer(): Promise<Player | null> {
  const playerId = localStorage.getItem(CURRENT_PLAYER_KEY);
  if (!playerId) return null;
  const player = await getFromStore<Player>(STORES.PLAYERS, playerId);
  return player || null;
}

export async function createPlayer(name: string): Promise<Player> {
  const player: Player = {
    id: uuidv4(),
    name,
    avatarInitial: name.charAt(0).toUpperCase(),
    createdAt: new Date().toISOString(),
  };
  await putToStore(STORES.PLAYERS, player);
  localStorage.setItem(CURRENT_PLAYER_KEY, player.id);
  return player;
}

export async function updatePlayerName(playerId: string, name: string): Promise<Player | null> {
  const existing = await getFromStore<Player>(STORES.PLAYERS, playerId);
  if (!existing) return null;
  const updated: Player = {
    ...existing,
    name,
    avatarInitial: name.charAt(0).toUpperCase(),
  };
  await putToStore(STORES.PLAYERS, updated);
  return updated;
}

export async function getPlayerById(id: string): Promise<Player | undefined> {
  return getFromStore<Player>(STORES.PLAYERS, id);
}

export async function getAllPlayers(): Promise<Player[]> {
  return getAllFromStore<Player>(STORES.PLAYERS);
}

export async function setCurrentPlayer(playerId: string): Promise<void> {
  localStorage.setItem(CURRENT_PLAYER_KEY, playerId);
}
