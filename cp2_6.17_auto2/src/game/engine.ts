import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  Rune,
  Cell,
  Position,
  RuneElement,
  PlayerId,
  CellType,
  AttackResult,
  ELEMENT_ADVANTAGE,
  RUNE_BASE_STATS
} from './types';

const BOARD_SIZE = 8;
const ELEMENTS: RuneElement[] = ['fire', 'wind', 'earth', 'water'];
const MOVE_RANGE = 3;
const ATTACK_RANGE = 1;

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createRune(element: RuneElement, owner: PlayerId, position: Position): Rune {
  const stats = RUNE_BASE_STATS[element];
  return {
    id: uuidv4(),
    element,
    owner,
    position: { ...position },
    attack: stats.attack,
    maxHp: stats.hp,
    currentHp: stats.hp,
    hasMoved: false,
    hasAttacked: false
  };
}

function createEmptyBoard(size: number): Cell[][] {
  const cells: Cell[][] = [];
  for (let y = 0; y < size; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < size; x++) {
      row.push({
        position: { x, y },
        type: 'empty'
      });
    }
    cells.push(row);
  }
  return cells;
}

function placeBases(cells: Cell[][]): void {
  const size = cells.length;
  cells[0][0] = { position: { x: 0, y: 0 }, type: 'base', baseOwner: 'player1' };
  cells[size - 1][size - 1] = { position: { x: size - 1, y: size - 1 }, type: 'base', baseOwner: 'player2' };
}

function placeObstacles(cells: Cell[][], count: number): void {
  const size = cells.length;
  let placed = 0;
  const reservedPositions = [
    { x: 0, y: 0 },
    { x: size - 1, y: size - 1 }
  ];
  
  while (placed < count) {
    const x = getRandomInt(0, size - 1);
    const y = getRandomInt(0, size - 1);
    
    if (cells[y][x].type !== 'empty') continue;
    if (y < 2 && x < 2) continue;
    if (y > size - 3 && x > size - 3) continue;
    
    const isReserved = reservedPositions.some(p => p.x === x && p.y === y);
    if (isReserved) continue;
    
    cells[y][x].type = 'obstacle';
    placed++;
  }
}

function placeBuffs(cells: Cell[][], count: number): void {
  const size = cells.length;
  let placed = 0;
  
  while (placed < count) {
    const x = getRandomInt(0, size - 1);
    const y = getRandomInt(0, size - 1);
    
    if (cells[y][x].type !== 'empty') continue;
    
    cells[y][x].type = 'buff';
    placed++;
  }
}

function getEmptyPositionsInArea(
  cells: Cell[][],
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): Position[] {
  const positions: Position[] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (cells[y][x].type === 'empty') {
        positions.push({ x, y });
      }
    }
  }
  return positions;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createInitialRunes(cells: Cell[][]): { player1: Rune[]; player2: Rune[] } {
  const size = cells.length;
  
  const p1Positions = getEmptyPositionsInArea(cells, 0, size - 1, 0, 1);
  const p2Positions = getEmptyPositionsInArea(cells, 0, size - 1, size - 2, size - 1);
  
  const shuffledP1 = shuffleArray(p1Positions);
  const shuffledP2 = shuffleArray(p2Positions);
  
  const player1Runes: Rune[] = [];
  const player2Runes: Rune[] = [];
  
  for (let i = 0; i < 4; i++) {
    if (shuffledP1[i]) {
      player1Runes.push(createRune(ELEMENTS[i], 'player1', shuffledP1[i]));
    }
    if (shuffledP2[i]) {
      player2Runes.push(createRune(ELEMENTS[i], 'player2', shuffledP2[i]));
    }
  }
  
  return { player1: player1Runes, player2: player2Runes };
}

export function createInitialState(): GameState {
  const cells = createEmptyBoard(BOARD_SIZE);
  placeBases(cells);
  placeObstacles(cells, getRandomInt(3, 5));
  placeBuffs(cells, getRandomInt(2, 4));
  
  const runes = createInitialRunes(cells);
  
  return {
    boardSize: BOARD_SIZE,
    cells,
    players: {
      player1: {
        id: 'player1',
        name: '玩家1',
        runes: runes.player1
      },
      player2: {
        id: 'player2',
        name: '玩家2',
        runes: runes.player2
      }
    },
    currentTurn: 'player1',
    turnNumber: 1,
    status: 'playing',
    selectedRuneId: null
  };
}

export function getRuneAtPosition(state: GameState, pos: Position): Rune | null {
  for (const playerId of ['player1', 'player2'] as PlayerId[]) {
    const rune = state.players[playerId].runes.find(
      r => r.position.x === pos.x && r.position.y === pos.y && r.currentHp > 0
    );
    if (rune) return rune;
  }
  return null;
}

export function getRuneById(state: GameState, runeId: string): Rune | null {
  for (const playerId of ['player1', 'player2'] as PlayerId[]) {
    const rune = state.players[playerId].runes.find(r => r.id === runeId);
    if (rune) return rune;
  }
  return null;
}

export function getManhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function canMoveTo(state: GameState, rune: Rune, targetPos: Position): boolean {
  if (rune.hasMoved) return false;
  if (rune.owner !== state.currentTurn) return false;
  
  if (targetPos.x < 0 || targetPos.x >= state.boardSize ||
      targetPos.y < 0 || targetPos.y >= state.boardSize) {
    return false;
  }
  
  const cell = state.cells[targetPos.y][targetPos.x];
  if (cell.type === 'obstacle') return false;
  
  const existingRune = getRuneAtPosition(state, targetPos);
  if (existingRune) return false;
  
  const distance = getManhattanDistance(rune.position, targetPos);
  if (distance > MOVE_RANGE || distance === 0) return false;
  
  return true;
}

export function getValidMoves(state: GameState, rune: Rune): Position[] {
  const validMoves: Position[] = [];
  for (let y = 0; y < state.boardSize; y++) {
    for (let x = 0; x < state.boardSize; x++) {
      const pos = { x, y };
      if (canMoveTo(state, rune, pos)) {
        validMoves.push(pos);
      }
    }
  }
  return validMoves;
}

export function calculateDamage(attacker: Rune, target: Rune): { damage: number; isCritical: boolean } {
  let damage = attacker.attack;
  let isCritical = false;
  
  if (ELEMENT_ADVANTAGE[attacker.element] === target.element) {
    damage *= 2;
    isCritical = true;
  }
  
  if (ELEMENT_ADVANTAGE[target.element] === attacker.element) {
    damage = Math.floor(damage * 0.5);
  }
  
  return { damage, isCritical };
}

export function getEnemiesInRange(state: GameState, rune: Rune): Rune[] {
  const enemies: Rune[] = [];
  const opponent: PlayerId = rune.owner === 'player1' ? 'player2' : 'player1';
  
  for (const enemy of state.players[opponent].runes) {
    if (enemy.currentHp <= 0) continue;
    const distance = getManhattanDistance(rune.position, enemy.position);
    if (distance <= ATTACK_RANGE) {
      enemies.push(enemy);
    }
  }
  
  return enemies;
}

export function moveRune(state: GameState, runeId: string, targetPos: Position): GameState {
  const rune = getRuneById(state, runeId);
  if (!rune || !canMoveTo(state, rune, targetPos)) {
    return state;
  }
  
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const targetRune = getRuneById(newState, runeId);
  
  if (targetRune) {
    targetRune.position = { ...targetPos };
    targetRune.hasMoved = true;
    
    const cell = newState.cells[targetPos.y][targetPos.x];
    if (cell.type === 'buff') {
      targetRune.attack = Math.floor(targetRune.attack * 1.2);
      targetRune.currentHp = Math.min(targetRune.maxHp, targetRune.currentHp + 10);
    }
  }
  
  return newState;
}

export function autoAttack(state: GameState, runeId: string): { state: GameState; results: AttackResult[] } {
  const rune = getRuneById(state, runeId);
  if (!rune || rune.hasAttacked || rune.currentHp <= 0) {
    return { state, results: [] };
  }
  
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const attackerRune = getRuneById(newState, runeId);
  if (!attackerRune) return { state, results: [] };
  
  const results: AttackResult[] = [];
  const enemies = getEnemiesInRange(newState, attackerRune);
  
  for (const enemy of enemies) {
    const { damage, isCritical } = calculateDamage(attackerRune, enemy);
    enemy.currentHp = Math.max(0, enemy.currentHp - damage);
    
    results.push({
      attackerId: attackerRune.id,
      targetId: enemy.id,
      damage,
      isCritical,
      targetKilled: enemy.currentHp <= 0
    });
  }
  
  attackerRune.hasAttacked = true;
  
  const gameStatus = checkWinCondition(newState);
  newState.status = gameStatus;
  
  return { state: newState, results };
}

export function selectRune(state: GameState, runeId: string | null): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  newState.selectedRuneId = runeId;
  return newState;
}

export function endTurn(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const nextTurn: PlayerId = state.currentTurn === 'player1' ? 'player2' : 'player1';
  
  if (nextTurn === 'player1') {
    newState.turnNumber++;
  }
  
  newState.currentTurn = nextTurn;
  newState.selectedRuneId = null;
  
  for (const playerId of ['player1', 'player2'] as PlayerId[]) {
    for (const rune of newState.players[playerId].runes) {
      if (rune.owner === nextTurn) {
        rune.hasMoved = false;
        rune.hasAttacked = false;
      }
    }
  }
  
  return newState;
}

export function checkWinCondition(state: GameState): GameState['status'] {
  const p1Alive = state.players.player1.runes.filter(r => r.currentHp > 0).length;
  const p2Alive = state.players.player2.runes.filter(r => r.currentHp > 0).length;
  
  if (p1Alive === 0) return 'player2_win';
  if (p2Alive === 0) return 'player1_win';
  return 'playing';
}

export function resetGame(): GameState {
  return createInitialState();
}

export function getAllRunes(state: GameState): Rune[] {
  return [
    ...state.players.player1.runes,
    ...state.players.player2.runes
  ].filter(r => r.currentHp > 0);
}
