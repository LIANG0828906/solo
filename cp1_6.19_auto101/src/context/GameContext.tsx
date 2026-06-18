import { createContext, useContext } from 'react';
import type { Character } from '@/combat/Character';
import type { MapData, MonsterData, EventResult, TreasureItem, GamePhase } from '@/domain/types';
import type { BattleSimulator } from '@/combat/BattleSimulator';

export interface GameState {
  phase: GamePhase;
  character: Character | null;
  mapData: MapData | null;
  playerPos: { x: number; y: number } | null;
  currentMonster: MonsterData | null;
  currentEvent: EventResult | null;
  currentTreasure: TreasureItem | null;
  battleSimulator: BattleSimulator | null;
  steps: number;
  monstersDefeated: number;
  revealedCells: Set<string>;
}

export interface GameActions {
  setPhase: (phase: GamePhase) => void;
  setCharacter: (character: Character) => void;
  setMapData: (mapData: MapData) => void;
  setPlayerPos: (pos: { x: number; y: number }) => void;
  setCurrentMonster: (monster: MonsterData | null) => void;
  setCurrentEvent: (event: EventResult | null) => void;
  setCurrentTreasure: (treasure: TreasureItem | null) => void;
  setBattleSimulator: (sim: BattleSimulator | null) => void;
  incrementSteps: () => void;
  incrementMonstersDefeated: () => void;
  revealCell: (x: number, y: number) => void;
  resetGame: () => void;
}

export type GameContextType = GameState & GameActions;

const initialState: GameState = {
  phase: 'classSelect',
  character: null,
  mapData: null,
  playerPos: null,
  currentMonster: null,
  currentEvent: null,
  currentTreasure: null,
  battleSimulator: null,
  steps: 0,
  monstersDefeated: 0,
  revealedCells: new Set(),
};

export const GameContext = createContext<GameContextType>({
  ...initialState,
  setPhase: () => {},
  setCharacter: () => {},
  setMapData: () => {},
  setPlayerPos: () => {},
  setCurrentMonster: () => {},
  setCurrentEvent: () => {},
  setCurrentTreasure: () => {},
  setBattleSimulator: () => {},
  incrementSteps: () => {},
  incrementMonstersDefeated: () => {},
  revealCell: () => {},
  resetGame: () => {},
});

export function useGameContext(): GameContextType {
  return useContext(GameContext);
}

export { initialState };
