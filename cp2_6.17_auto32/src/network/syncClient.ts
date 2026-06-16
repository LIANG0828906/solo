import { useBoardStore } from '../game/board';
import { moveElement as sendMoveElement, fireLaser as sendFireLaser } from './roomManager';
import type { GridCoord } from '../game/types';

let unsubscribe: (() => void) | null = null;
let lastElementsHash = '';

function hashElements(elements: { id: string; position: GridCoord }[]): string {
  return elements
    .map(e => `${e.id}:${e.position.x},${e.position.y}`)
    .sort()
    .join('|');
}

export function initSyncClient(): void {
  if (unsubscribe) {
    return;
  }

  unsubscribe = useBoardStore.subscribe(
    (state) => state.elements,
    (elements) => {
      const currentHash = hashElements(elements);
      if (currentHash === lastElementsHash) {
        return;
      }
      lastElementsHash = currentHash;
    }
  );
}

export function destroySyncClient(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export function syncElementMove(elementId: string, position: GridCoord): void {
  const state = useBoardStore.getState();
  const element = state.elements.find(e => e.id === elementId);
  
  if (!element) return;
  
  useBoardStore.getState().moveElement(elementId, position);
  sendMoveElement(elementId, position);
}

export function syncFireLaser(): void {
  const state = useBoardStore.getState();
  
  if (state.phase !== 'playing') return;
  if (state.turnPhase !== 'adjust') return;
  if (state.isFiring) return;
  
  sendFireLaser();
}

export function syncRestart(): void {
  lastElementsHash = '';
  useBoardStore.getState().resetGame();
}
