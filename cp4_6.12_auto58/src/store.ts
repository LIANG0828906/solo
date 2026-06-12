import { create } from 'zustand';
import axios from 'axios';

export interface Position {
  x: number;
  y: number;
}

export interface MazeData {
  walls: Position[];
  treasures: Position[];
  monsters: Position[];
  start: Position;
  end: Position;
  size: number;
}

export interface BattleResult {
  playerRoll: number;
  monsterRoll: number;
  playerWins: boolean;
  damage: number;
}

export interface MoveResponse {
  valid: boolean;
  newPosition: Position;
  type: 'empty' | 'wall' | 'treasure' | 'monster';
  monsterIndex?: number;
  treasureIndex?: number;
  battleResult?: BattleResult;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  floor: number;
  treasures: number;
  timestamp: number;
}

interface GameState {
  maze: MazeData | null;
  playerPos: Position;
  health: number;
  maxHealth: number;
  floor: number;
  treasureCount: number;
  inventory: string[];
  exploredCells: Set<string>;
  isGenerating: boolean;
  showWallHit: boolean;
  showTreasurePopup: boolean;
  battleLog: string[];
  gameOver: boolean;
  playerName: string;

  generateMaze: () => Promise<void>;
  movePlayer: (direction: 'up' | 'down' | 'left' | 'right') => Promise<void>;
  regenerateMaze: () => Promise<void>;
  resetGame: () => void;
  setPlayerName: (name: string) => void;
  clearBattleLog: () => void;
}

const API_BASE = 'http://localhost:3001/api';

const posKey = (pos: Position) => `${pos.x},${pos.y}`;

const updateExplored = (pos: Position, current: Set<string>): Set<string> => {
  const newSet = new Set(current);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      newSet.add(`${pos.x + dx},${pos.y + dy}`);
    }
  }
  return newSet;
};

export const useGameStore = create<GameState>((set, get) => ({
  maze: null,
  playerPos: { x: 1, y: 1 },
  health: 100,
  maxHealth: 100,
  floor: 1,
  treasureCount: 0,
  inventory: [],
  exploredCells: new Set<string>(),
  isGenerating: false,
  showWallHit: false,
  showTreasurePopup: false,
  battleLog: [],
  gameOver: false,
  playerName: '无名勇者',

  generateMaze: async () => {
    set({ isGenerating: true });
    try {
      const response = await axios.post<MazeData>(`${API_BASE}/maze/generate`);
      const maze = response.data;
      const explored = updateExplored(maze.start, new Set());
      set({
        maze,
        playerPos: maze.start,
        exploredCells: explored,
        isGenerating: false,
        gameOver: false,
      });
    } catch (error) {
      console.error('Failed to generate maze:', error);
      set({ isGenerating: false });
    }
  },

  movePlayer: async (direction) => {
    const { maze, playerPos, health, treasureCount, inventory, battleLog, floor, playerName } = get();
    if (!maze || get().gameOver) return;

    try {
      const response = await axios.post<MoveResponse>(`${API_BASE}/maze/validateMove`, {
        maze,
        playerPos,
        direction,
      });

      const result = response.data;

      if (!result.valid) {
        set({ showWallHit: true });
        setTimeout(() => set({ showWallHit: false }), 200);
        return;
      }

      const newExplored = updateExplored(result.newPosition, get().exploredCells);

      if (result.type === 'treasure' && result.treasureIndex !== undefined) {
        const newTreasures = [...maze.treasures];
        newTreasures.splice(result.treasureIndex, 1);

        set({
          maze: { ...maze, treasures: newTreasures },
          playerPos: result.newPosition,
          treasureCount: treasureCount + 1,
          inventory: [...