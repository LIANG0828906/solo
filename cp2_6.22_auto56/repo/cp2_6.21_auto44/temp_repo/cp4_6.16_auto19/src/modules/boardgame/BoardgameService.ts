import { v4 as uuidv4 } from 'uuid';
import { getAllFromStore, getFromStore, putToStore, STORES } from '@/utils/db';
import type { Boardgame } from '@/types';
import boardgameData from './BoardgameData.json';

const INITIALIZED_KEY = 'boardgames_initialized';

export async function initializeBoardgames(): Promise<void> {
  const initialized = localStorage.getItem(INITIALIZED_KEY);
  if (initialized) return;

  const existing = await getAllFromStore<Boardgame>(STORES.BOARDGAMES);
  if (existing.length > 0) {
    localStorage.setItem(INITIALIZED_KEY, 'true');
    return;
  }

  for (const game of boardgameData) {
    await putToStore(STORES.BOARDGAMES, game);
  }
  localStorage.setItem(INITIALIZED_KEY, 'true');
}

export async function getAllBoardgames(): Promise<Boardgame[]> {
  const games = await getAllFromStore<Boardgame>(STORES.BOARDGAMES);
  return games.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
}

export async function getBoardgameById(id: string): Promise<Boardgame | undefined> {
  return getFromStore<Boardgame>(STORES.BOARDGAMES, id);
}

export async function searchBoardgames(query: string): Promise<Boardgame[]> {
  const games = await getAllBoardgames();
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return games;
  return games.filter(
    (g) =>
      g.name.toLowerCase().includes(lowerQuery) ||
      g.description.toLowerCase().includes(lowerQuery)
  );
}

export async function addCustomBoardgame(
  game: Omit<Boardgame, 'id' | 'isCustom'>
): Promise<Boardgame> {
  const newGame: Boardgame = {
    ...game,
    id: uuidv4(),
    isCustom: true,
  };
  await putToStore(STORES.BOARDGAMES, newGame);
  return newGame;
}

export async function filterByPlayerCount(
  minPlayers: number,
  maxPlayers: number
): Promise<Boardgame[]> {
  const games = await getAllBoardgames();
  return games.filter(
    (g) => g.minPlayers <= maxPlayers && g.maxPlayers >= minPlayers
  );
}
