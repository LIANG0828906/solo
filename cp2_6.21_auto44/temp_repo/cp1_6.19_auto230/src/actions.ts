import { MicrobeType, MOVE_ENERGY_COST, CLEAR_SKILL_COST } from './types';
import { useGameStore } from './store';

export function placeMicrobeAction(x: number, y: number, type: MicrobeType): boolean {
  const placeMicrobe = useGameStore.getState().placeMicrobe;
  return placeMicrobe(x, y, type);
}

export function moveMicrobeAction(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  type: MicrobeType
): boolean {
  const state = useGameStore.getState();
  if (state.energy < MOVE_ENERGY_COST) return false;
  const moveMicrobe = state.moveMicrobe;
  return moveMicrobe(fromX, fromY, toX, toY, type);
}

export function useClearSkillAction(x: number, y: number): boolean {
  const state = useGameStore.getState();
  if (state.energy < CLEAR_SKILL_COST) return false;
  if (state.skillCooldown > 0) return false;
  const useClearSkill = state.useClearSkill;
  return useClearSkill(x, y);
}

export function canPlaceMicrobe(x: number, y: number, type: MicrobeType): boolean {
  const state = useGameStore.getState();
  if (state.isVictory || state.isGameOver) return false;
  if (state.inventory[type] <= 0) return false;

  const cell = state.grid[y][x];
  if (cell.isDesert) return false;
  if (cell.microbes[type] >= 3) return false;

  return true;
}

export function canUseClearSkill(x: number, y: number): boolean {
  const state = useGameStore.getState();
  if (state.isVictory || state.isGameOver) return false;
  if (state.skillCooldown > 0) return false;
  if (state.energy < CLEAR_SKILL_COST) return false;

  const cell = state.grid[y][x];
  if (cell.isDesert) return false;

  return true;
}

export function resetGameAction(): void {
  useGameStore.getState().resetGame();
}

export function advanceTurnAction(): void {
  useGameStore.getState().nextTurn();
}
