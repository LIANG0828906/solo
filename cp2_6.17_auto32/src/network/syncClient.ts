import { useBoardStore } from '../game/board';
import { moveElement as sendMoveElement, fireLaser as sendFireLaser, restartGame as sendRestartGame } from './roomManager';
import type { GridCoord, GameState, OpticalElement, PixelCoord } from '../game/types';
import { GRID_SIZE, CELL_SIZE } from '../game/types';

let unsubscribe: (() => void) | null = null;
let lastElementsHash = '';
let lastSyncTime = 0;
const SYNC_THROTTLE_MS = 50;

function hashElements(elements: { id: string; position: GridCoord }[]): string {
  return elements
    .map(e => `${e.id}:${e.position.x},${e.position.y}`)
    .sort()
    .join('|');
}

export function serializeState(): Partial<GameState> {
  const state = useBoardStore.getState();
  
  return {
    phase: state.phase,
    currentTurn: state.currentTurn,
    turnPhase: state.turnPhase,
    round: state.round,
    timeRemaining: state.timeRemaining,
    elements: state.elements.map(e => ({
      id: e.id,
      type: e.type,
      position: { x: e.position.x, y: e.position.y },
      orientation: e.orientation,
      movable: e.movable,
      owner: e.owner
    })) as OpticalElement[],
    players: {
      playerA: { 
        id: state.players.playerA.id,
        name: state.players.playerA.name,
        lives: state.players.playerA.lives,
        score: state.players.playerA.score,
        connected: state.players.playerA.connected
      },
      playerB: { 
        id: state.players.playerB.id,
        name: state.players.playerB.name,
        lives: state.players.playerB.lives,
        score: state.players.playerB.score,
        connected: state.players.playerB.connected
      }
    },
    isFiring: state.isFiring,
    laserResult: state.laserResult,
    winner: state.winner,
    roomCode: state.roomCode,
    localPlayer: state.localPlayer
  };
}

export function deserializeState(partialState: Partial<GameState>): void {
  const state = useBoardStore.getState();
  const validUpdates: Partial<GameState> = {};
  
  if (partialState.phase !== undefined && ['matching', 'playing', 'ended'].includes(partialState.phase)) {
    validUpdates.phase = partialState.phase;
  }
  
  if (partialState.currentTurn !== undefined && 
      (partialState.currentTurn === 'playerA' || partialState.currentTurn === 'playerB')) {
    validUpdates.currentTurn = partialState.currentTurn;
  }
  
  if (partialState.turnPhase !== undefined && 
      ['adjust', 'fire', 'resolve'].includes(partialState.turnPhase)) {
    validUpdates.turnPhase = partialState.turnPhase;
  }
  
  if (partialState.round !== undefined && 
      typeof partialState.round === 'number' && 
      partialState.round >= 1 && partialState.round <= 10) {
    validUpdates.round = partialState.round;
  }
  
  if (partialState.timeRemaining !== undefined && 
      typeof partialState.timeRemaining === 'number') {
    validUpdates.timeRemaining = Math.max(0, Math.min(60, partialState.timeRemaining));
  }
  
  if (partialState.isFiring !== undefined && typeof partialState.isFiring === 'boolean') {
    validUpdates.isFiring = partialState.isFiring;
  }
  
  if (partialState.winner !== undefined) {
    validUpdates.winner = partialState.winner;
  }
  
  if (partialState.roomCode !== undefined && typeof partialState.roomCode === 'string') {
    validUpdates.roomCode = partialState.roomCode;
  }
  
  if (partialState.localPlayer !== undefined) {
    validUpdates.localPlayer = partialState.localPlayer;
  }
  
  if (partialState.players) {
    validUpdates.players = { ...state.players };
    
    if (partialState.players.playerA) {
      const pA = partialState.players.playerA;
      validUpdates.players.playerA = {
        ...state.players.playerA,
        lives: typeof pA.lives === 'number' ? Math.max(0, Math.min(10, pA.lives)) : state.players.playerA.lives,
        score: typeof pA.score === 'number' ? Math.max(0, pA.score) : state.players.playerA.score,
        connected: typeof pA.connected === 'boolean' ? pA.connected : state.players.playerA.connected
      };
    }
    
    if (partialState.players.playerB) {
      const pB = partialState.players.playerB;
      validUpdates.players.playerB = {
        ...state.players.playerB,
        lives: typeof pB.lives === 'number' ? Math.max(0, Math.min(10, pB.lives)) : state.players.playerB.lives,
        score: typeof pB.score === 'number' ? Math.max(0, pB.score) : state.players.playerB.score,
        connected: typeof pB.connected === 'boolean' ? pB.connected : state.players.playerB.connected
      };
    }
  }
  
  if (partialState.elements && Array.isArray(partialState.elements)) {
    const validElements = partialState.elements.filter(e => {
      if (!e || typeof e.id !== 'string') return false;
      if (!['mirror', 'prism', 'blocker'].includes(e.type)) return false;
      if (!e.position || typeof e.position.x !== 'number' || typeof e.position.y !== 'number') return false;
      if (e.position.x < 0 || e.position.x >= GRID_SIZE) return false;
      if (e.position.y < 0 || e.position.y >= GRID_SIZE) return false;
      return true;
    }) as OpticalElement[];
    
    if (validElements.length > 0) {
      validUpdates.elements = validElements;
    }
  }
  
  if (partialState.laserResult !== undefined) {
    validUpdates.laserResult = partialState.laserResult;
  }
  
  if (Object.keys(validUpdates).length > 0) {
    state.setState(validUpdates);
  }
}

export function validateElementMove(
  elementId: string, 
  position: GridCoord, 
  localPlayer: 'playerA' | 'playerB' | null
): { valid: boolean; reason?: string } {
  if (!localPlayer) {
    return { valid: false, reason: '未登录' };
  }
  
  const state = useBoardStore.getState();
  
  if (state.phase !== 'playing') {
    return { valid: false, reason: '游戏未开始' };
  }
  
  if (state.turnPhase !== 'adjust') {
    return { valid: false, reason: '非调整阶段' };
  }
  
  if (state.currentTurn !== localPlayer) {
    return { valid: false, reason: '非你的回合' };
  }
  
  const element = state.elements.find(e => e.id === elementId);
  if (!element) {
    return { valid: false, reason: '元件不存在' };
  }
  
  if (!element.movable) {
    return { valid: false, reason: '元件不可移动' };
  }
  
  if (element.owner !== localPlayer) {
    return { valid: false, reason: '不能移动对方元件' };
  }
  
  if (position.x < 0 || position.x >= GRID_SIZE || 
      position.y < 0 || position.y >= GRID_SIZE) {
    return { valid: false, reason: '位置超出边界' };
  }
  
  const midpoint = GRID_SIZE / 2;
  
  if (localPlayer === 'playerA') {
    if (position.y < midpoint) {
      return { valid: false, reason: '不能移动到对方半场' };
    }
    if (position.x >= midpoint) {
      return { valid: false, reason: '不能移动到对方半场' };
    }
  } else {
    if (position.y >= midpoint) {
      return { valid: false, reason: '不能移动到对方半场' };
    }
    if (position.x < midpoint) {
      return { valid: false, reason: '不能移动到对方半场' };
    }
  }
  
  const isOccupied = state.elements.some(e => 
    e.id !== elementId && 
    e.position.x === position.x && 
    e.position.y === position.y
  );
  
  if (isOccupied) {
    return { valid: false, reason: '位置已被占用' };
  }
  
  return { valid: true };
}

export function initSyncClient(): void {
  if (unsubscribe) {
    return;
  }

  let prevElements = useBoardStore.getState().elements;
  unsubscribe = useBoardStore.subscribe((state) => {
    const elements = state.elements;
    if (prevElements === elements) return;
    prevElements = elements;

    const now = Date.now();
    if (now - lastSyncTime < SYNC_THROTTLE_MS) {
      return;
    }
    lastSyncTime = now;
    
    const currentHash = hashElements(elements);
    if (currentHash === lastElementsHash) {
      return;
    }
    lastElementsHash = currentHash;
  });
}

export function destroySyncClient(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export function syncElementMove(elementId: string, position: GridCoord): boolean {
  const state = useBoardStore.getState();
  const localPlayer = state.localPlayer;
  
  const validation = validateElementMove(elementId, position, localPlayer);
  if (!validation.valid) {
    console.warn('Move validation failed:', validation.reason);
    return false;
  }
  
  const pixelCenter: PixelCoord = {
    x: position.x * CELL_SIZE + CELL_SIZE / 2,
    y: position.y * CELL_SIZE + CELL_SIZE / 2
  };
  
  const moved = state.moveElement(elementId, pixelCenter, localPlayer);
  
  if (moved) {
    sendMoveElement(elementId, position);
  }
  
  return moved;
}

export function syncFireLaser(): boolean {
  const state = useBoardStore.getState();
  
  if (state.phase !== 'playing') return false;
  if (state.turnPhase !== 'adjust') return false;
  if (state.isFiring) return false;
  if (state.currentTurn !== state.localPlayer) return false;
  
  sendFireLaser();
  return true;
}

export function syncRestart(): void {
  lastElementsHash = '';
  sendRestartGame();
}
