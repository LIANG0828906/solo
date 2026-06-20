import type {
  GameState,
  Character,
  Position,
  Direction,
  Crystal,
  PlayerAction,
  AIAction,
  Particle,
} from '@/types/game';
import { generateMaze, isWalkable, getWalkableCells, areAdjacent, MAZE_WIDTH, MAZE_HEIGHT } from './labyrinth';
import { determineAIState, getAIAction } from './ai';

const INITIAL_HP = 30;
const INITIAL_ATTACK = 5;
const INITIAL_MOVE_RANGE = 1;
const CRYSTAL_COUNT = 3;
const CRYSTAL_ATTACK_BONUS = 2;
const CRYSTAL_MOVE_RANGE_BONUS = 1;

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createCharacter(position: Position): Character {
  return {
    position: { ...position },
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    attack: INITIAL_ATTACK,
    moveRange: INITIAL_MOVE_RANGE,
    crystalsCollected: 0,
  };
}

function getDirectionDelta(direction: Direction): { dx: number; dy: number } {
  switch (direction) {
    case 'up':
      return { dx: 0, dy: -1 };
    case 'down':
      return { dx: 0, dy: 1 };
    case 'left':
      return { dx: -1, dy: 0 };
    case 'right':
      return { dx: 1, dy: 0 };
  }
}

function spawnCrystals(grid: { type: string; x: number; y: number }[][], count: number, excludePositions: Position[]): Crystal[] {
  const walkable = getWalkableCells(grid);
  const available = walkable.filter(
    (cell) => !excludePositions.some((p) => p.x === cell.x && p.y === cell.y),
  );

  const crystals: Crystal[] = [];
  const shuffled = [...available].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    crystals.push({
      position: { x: shuffled[i].x, y: shuffled[i].y },
      id: generateId(),
    });
  }

  return crystals;
}

function generateParticles(position: Position): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
    particles.push({
      id: generateId(),
      x: position.x,
      y: position.y,
      angle,
      distance: 20 + Math.random() * 20,
    });
  }
  return particles;
}

export function createInitialState(): GameState {
  const grid = generateMaze(MAZE_WIDTH, MAZE_HEIGHT);
  const playerStart: Position = { x: 0, y: MAZE_HEIGHT - 1 };
  const aiStart: Position = { x: MAZE_WIDTH - 1, y: 0 };

  const player = createCharacter(playerStart);
  const ai = createCharacter(aiStart);

  const crystals = spawnCrystals(grid, CRYSTAL_COUNT, [playerStart, aiStart]);

  const aiState = determineAIState(ai, player.position);

  return {
    grid,
    player,
    ai,
    crystals,
    turn: 'player',
    turnCount: 1,
    aiState,
    gameStatus: 'playing',
    isAnimating: false,
    flashEffect: null,
    damagedPosition: null,
    crystalBurstPosition: null,
    particles: [],
  };
}

function collectNearbyCrystals(
  character: Character,
  crystals: Crystal[],
): { character: Character; collectedCrystals: Crystal[] } {
  const collected: Crystal[] = [];
  const remaining: Crystal[] = [];

  for (const crystal of crystals) {
    if (areAdjacent(character.position, crystal.position)) {
      collected.push(crystal);
    } else {
      remaining.push(crystal);
    }
  }

  if (collected.length === 0) {
    return { character, collectedCrystals: [] };
  }

  const newCharacter = { ...character };
  newCharacter.crystalsCollected += collected.length;
  newCharacter.attack = INITIAL_ATTACK + collected.length * CRYSTAL_ATTACK_BONUS + (newCharacter.crystalsCollected - collected.length) * CRYSTAL_ATTACK_BONUS;
  newCharacter.attack = INITIAL_ATTACK + newCharacter.crystalsCollected * CRYSTAL_ATTACK_BONUS;
  newCharacter.moveRange = INITIAL_MOVE_RANGE + newCharacter.crystalsCollected * CRYSTAL_MOVE_RANGE_BONUS;

  return { character: newCharacter, collectedCrystals: collected };
}

function moveCharacter(
  character: Character,
  direction: Direction,
  grid: { type: string; x: number; y: number }[][],
  steps: number = 1,
): Character {
  const { dx, dy } = getDirectionDelta(direction);
  const newChar = { ...character, position: { ...character.position } };

  for (let i = 0; i < steps; i++) {
    const nx = newChar.position.x + dx;
    const ny = newChar.position.y + dy;

    if (!isWalkable(grid, nx, ny)) {
      break;
    }

    newChar.position.x = nx;
    newChar.position.y = ny;
  }

  return newChar;
}

export function executePlayerAction(state: GameState, action: PlayerAction): GameState {
  if (state.gameStatus !== 'playing' || state.turn !== 'player' || state.isAnimating) {
    return state;
  }

  let newState = { ...state };
  let newPlayer = { ...state.player, position: { ...state.player.position } };
  let newCrystals = [...state.crystals];
  let crystalBurstPosition: Position | null = null;
  let flashEffect: 'attack' | 'damage' | null = null;
  let damagedPosition: Position | null = null;
  let particles: Particle[] = [];

  switch (action.type) {
    case 'move': {
      if (action.direction) {
        newPlayer = moveCharacter(newPlayer, action.direction, state.grid, 1);
      }
      break;
    }
    case 'attack': {
      if (areAdjacent(state.player.position, state.ai.position)) {
        const newAi = {
          ...state.ai,
          hp: Math.max(0, state.ai.hp - state.player.attack),
        };
        newState.ai = newAi;
        flashEffect = 'attack';
        damagedPosition = { ...state.ai.position };

        if (newAi.hp <= 0) {
          newState.gameStatus = 'playerWin';
        }
      }
      break;
    }
    case 'wait':
      break;
  }

  const crystalResult = collectNearbyCrystals(newPlayer, newCrystals);
  if (crystalResult.collectedCrystals.length > 0) {
    newPlayer = crystalResult.character;
    newCrystals = newCrystals.filter(
      (c) => !crystalResult.collectedCrystals.some((cc) => cc.id === c.id),
    );
    crystalBurstPosition = { ...crystalResult.collectedCrystals[0].position };
    particles = generateParticles(crystalResult.collectedCrystals[0].position);
  }

  newState.player = newPlayer;
  newState.crystals = newCrystals;
  newState.flashEffect = flashEffect;
  newState.damagedPosition = damagedPosition;
  newState.crystalBurstPosition = crystalBurstPosition;
  newState.particles = particles;

  if (newState.gameStatus === 'playing') {
    newState.turn = 'ai';
    newState.isAnimating = true;
  }

  return newState;
}

export function executeAITurn(state: GameState): GameState {
  if (state.gameStatus !== 'playing' || state.turn !== 'ai') {
    return state;
  }

  let newState = { ...state };
  let newAi = { ...state.ai, position: { ...state.ai.position } };
  let newCrystals = [...state.crystals];
  let flashEffect: 'attack' | 'damage' | null = null;
  let damagedPosition: Position | null = null;
  let crystalBurstPosition: Position | null = null;
  let particles: Particle[] = [];

  const aiState = determineAIState(state.ai, state.player.position);
  newState.aiState = aiState;

  const action: AIAction = getAIAction(state.grid, state.ai, state.player.position, aiState);

  switch (action.type) {
    case 'move': {
      if (action.direction) {
        const steps = action.steps || 1;
        newAi = moveCharacter(newAi, action.direction, state.grid, steps);
      }
      break;
    }
    case 'attack': {
      if (areAdjacent(state.ai.position, state.player.position)) {
        const newPlayer = {
          ...state.player,
          hp: Math.max(0, state.player.hp - state.ai.attack),
        };
        newState.player = newPlayer;
        flashEffect = 'damage';
        damagedPosition = { ...state.player.position };

        if (newPlayer.hp <= 0) {
          newState.gameStatus = 'aiWin';
        }
      }
      break;
    }
    case 'wait':
      break;
  }

  const crystalResult = collectNearbyCrystals(newAi, newCrystals);
  if (crystalResult.collectedCrystals.length > 0) {
    newAi = crystalResult.character;
    newCrystals = newCrystals.filter(
      (c) => !crystalResult.collectedCrystals.some((cc) => cc.id === c.id),
    );
    crystalBurstPosition = { ...crystalResult.collectedCrystals[0].position };
    particles = generateParticles(crystalResult.collectedCrystals[0].position);
  }

  newState.ai = newAi;
  newState.crystals = newCrystals;
  newState.flashEffect = flashEffect;
  newState.damagedPosition = damagedPosition;
  newState.crystalBurstPosition = crystalBurstPosition;
  newState.particles = particles;

  if (newState.gameStatus === 'playing') {
    newState.turn = 'player';
    newState.turnCount = state.turnCount + 1;
    newState.isAnimating = false;
  }

  return newState;
}

export function refreshCrystals(state: GameState): GameState {
  if (state.gameStatus !== 'playing') return state;

  const excludePositions = [state.player.position, state.ai.position];
  const newCrystals = spawnCrystals(state.grid, CRYSTAL_COUNT, excludePositions);

  return {
    ...state,
    crystals: newCrystals,
  };
}

export function clearEffects(state: GameState): GameState {
  return {
    ...state,
    flashEffect: null,
    damagedPosition: null,
    crystalBurstPosition: null,
    particles: [],
  };
}
