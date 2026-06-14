export interface PlayerData {
  id: string;
  name: string;
  color: string;
  completedTasks: string[];
}

export interface RoomData {
  code: string;
  name: string;
  maxPlayers: number;
  players: PlayerData[];
  createdAt: string;
  puzzleState: Record<string, boolean>;
  gameStarted: boolean;
  gameWon: boolean;
}

export interface InteractableObject {
  id: string;
  type: 'codebox' | 'painting' | 'book' | 'button';
  name: string;
  position: [number, number, number];
  puzzleId: string;
  hint?: string;
}

export type PuzzleState = Record<string, boolean>;
