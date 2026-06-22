import { create } from "zustand";
import type { Position, Monster, BattleLog, ExplosionEffect, DamageNumber, PathHighlight } from "@/types/game";
import { generateMaze, getRandomPathCells, MAZE_SIZE } from "@/game/MazeGenerator";

interface GameState {
  seed: number;
  map: number[][];
  player: Position;
  playerHP: number;
  monsters: Monster[];
  battleLogs: BattleLog[];
  explosions: ExplosionEffect[];
  damageNumbers: DamageNumber[];
  pathHighlights: PathHighlight[];
  gameOver: boolean;
  gameWon: boolean;
  autoPath: Position[];
  autoPathIndex: number;

  setSeed: (seed: number) => void;
  setPlayer: (pos: Position) => void;
  setAutoPath: (path: Position[]) => void;
  advanceAutoPath: () => void;
  clearAutoPath: () => void;
  damagePlayer: (amount: number) => void;
  killMonster: (id: string) => void;
  addBattleLog: (message: string) => void;
  addExplosion: (pos: Position) => void;
  removeExplosion: (id: string) => void;
  addDamageNumber: (pos: Position, value: number) => void;
  removeDamageNumber: (id: string) => void;
  addPathHighlight: (pos: Position) => void;
  removePathHighlights: () => void;
  updateMonsters: (monsters: Monster[]) => void;
  setGameOver: (value: boolean) => void;
  setGameWon: (value: boolean) => void;
  resetGame: (seed?: number) => void;
}

function createMonsters(grid: number[][], seed: number): Monster[] {
  const monsters: Monster[] = [];
  const monsterCount = 3;

  for (let i = 0; i < monsterCount; i++) {
    const startCell = getRandomPathCells(grid, seed + i * 100, 1)[0];
    if (!startCell) continue;

    const patrolCount = 3 + Math.floor(Math.random() * 3);
    const patrolCells = getRandomPathCells(grid, seed + i * 200 + 50, patrolCount);

    monsters.push({
      id: `monster-${i}`,
      position: startCell,
      patrolPoints: patrolCells.length > 0 ? patrolCells : [startCell],
      currentPatrolIndex: 0,
      mode: "patrol",
      alive: true,
    });
  }

  return monsters;
}

function initGame(seed: number) {
  const map = generateMaze(seed);
  const monsters = createMonsters(map, seed);
  return {
    seed,
    map,
    player: { x: 0, y: 0 } as Position,
    playerHP: 100,
    monsters,
    battleLogs: [] as BattleLog[],
    explosions: [] as ExplosionEffect[],
    damageNumbers: [] as DamageNumber[],
    pathHighlights: [] as PathHighlight[],
    gameOver: false,
    gameWon: false,
    autoPath: [] as Position[],
    autoPathIndex: 0,
  };
}

export const useGameStore = create<GameState>((set) => {
  const initial = initGame(42);

  return {
    ...initial,

    setSeed: (seed: number) => {
      set(initGame(seed));
    },

    setPlayer: (pos: Position) => set({ player: pos }),

    setAutoPath: (path: Position[]) => set({ autoPath: path, autoPathIndex: 0 }),

    advanceAutoPath: () =>
      set((state) => ({
        autoPathIndex: state.autoPathIndex + 1,
      })),

    clearAutoPath: () => set({ autoPath: [], autoPathIndex: 0 }),

    damagePlayer: (amount: number) =>
      set((state) => {
        const newHP = Math.max(0, state.playerHP - amount);
        return {
          playerHP: newHP,
          gameOver: newHP <= 0,
        };
      }),

    killMonster: (id: string) =>
      set((state) => ({
        monsters: state.monsters.map((m) =>
          m.id === id ? { ...m, alive: false } : m
        ),
      })),

    addBattleLog: (message: string) =>
      set((state) => ({
        battleLogs: [
          ...state.battleLogs,
          {
            id: `log-${Date.now()}-${Math.random()}`,
            message,
            timestamp: Date.now(),
          },
        ],
      })),

    addExplosion: (pos: Position) =>
      set((state) => ({
        explosions: [
          ...state.explosions.slice(-4),
          {
            id: `exp-${Date.now()}-${Math.random()}`,
            position: pos,
            createdAt: Date.now(),
          },
        ],
      })),

    removeExplosion: (id: string) =>
      set((state) => ({
        explosions: state.explosions.filter((e) => e.id !== id),
      })),

    addDamageNumber: (pos: Position, value: number) =>
      set((state) => ({
        damageNumbers: [
          ...state.damageNumbers,
          {
            id: `dmg-${Date.now()}-${Math.random()}`,
            position: pos,
            value,
            createdAt: Date.now(),
          },
        ],
      })),

    removeDamageNumber: (id: string) =>
      set((state) => ({
        damageNumbers: state.damageNumbers.filter((d) => d.id !== id),
      })),

    addPathHighlight: (pos: Position) =>
      set((state) => ({
        pathHighlights: [
          ...state.pathHighlights,
          { position: pos, createdAt: Date.now() },
        ],
      })),

    removePathHighlights: () => set({ pathHighlights: [] }),

    updateMonsters: (monsters: Monster[]) => set({ monsters }),

    setGameOver: (value: boolean) => set({ gameOver: value }),

    setGameWon: (value: boolean) => set({ gameWon: value }),

    resetGame: (seed?: number) => {
      set(initGame(seed ?? Math.floor(Math.random() * 100000)));
    },
  };
});
