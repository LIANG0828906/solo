import {
  GRID_SIZE,
  TORCH_RADIUS,
  TILE_SIZE,
  type Position,
  type Tile,
  type TileType,
  type Torch,
  type Player,
  type Monster,
  type MonsterState,
  type GameState,
  type GamePhase,
  type BattleAnimation,
  type PlayerState
} from '../types';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function generateMap(): { map: Tile[][]; torches: Torch[]; exitPosition: Position } {
  const map: Tile[][] = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    map[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      map[y][x] = { type: 'wall', walkable: false };
    }
  }
  
  const rooms = [
    { x: 1, y: 1, w: 3, h: 3 },
    { x: 6, y: 1, w: 3, h: 3 },
    { x: 1, y: 6, w: 3, h: 3 },
    { x: 6, y: 6, w: 3, h: 3 }
  ];
  
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        map[y][x] = { type: 'room', walkable: true };
      }
    }
  }
  
  for (let x = 4; x <= 5; x++) {
    map[2][x] = { type: 'corridor', walkable: true };
    map[7][x] = { type: 'corridor', walkable: true };
  }
  for (let y = 3; y <= 6; y++) {
    map[y][2] = { type: 'corridor', walkable: true };
    map[y][7] = { type: 'corridor', walkable: true };
  }
  for (let x = 2; x <= 7; x++) {
    map[4][x] = { type: 'corridor', walkable: true };
    map[5][x] = { type: 'corridor', walkable: true };
  }
  
  const exitPosition: Position = { x: 8, y: 8 };
  map[exitPosition.y][exitPosition.x] = { type: 'exit', walkable: true };
  
  const torches: Torch[] = [
    {
      id: uid(),
      position: { x: 2 * TILE_SIZE + TILE_SIZE / 2, y: 2 * TILE_SIZE + TILE_SIZE / 2 },
      radius: TORCH_RADIUS,
      color: '#FFD54F'
    },
    {
      id: uid(),
      position: { x: 7 * TILE_SIZE + TILE_SIZE / 2, y: 2 * TILE_SIZE + TILE_SIZE / 2 },
      radius: TORCH_RADIUS,
      color: '#FFD54F'
    },
    {
      id: uid(),
      position: { x: 2 * TILE_SIZE + TILE_SIZE / 2, y: 7 * TILE_SIZE + TILE_SIZE / 2 },
      radius: TORCH_RADIUS,
      color: '#FFD54F'
    },
    {
      id: uid(),
      position: { x: 4 * TILE_SIZE + TILE_SIZE / 2, y: 4 * TILE_SIZE + TILE_SIZE / 2 },
      radius: TORCH_RADIUS,
      color: '#FFD54F'
    }
  ];
  
  return { map, torches, exitPosition };
}

export function createInitialPlayer(): Player {
  return {
    id: uid(),
    position: { x: 2, y: 2 },
    targetPosition: null,
    health: 5,
    maxHealth: 5,
    attack: 1,
    state: 'bright',
    lightIntensity: 1,
    defeatedCount: 0,
    movingProgress: 0,
    speed: 4,
    hasLantern: true
  };
}

export function createMonsters(): Monster[] {
  const monsters: Monster[] = [];
  
  const lightChasers: Position[] = [
    { x: 7, y: 2 },
    { x: 7, y: 7 },
    { x: 5, y: 4 }
  ];
  
  const darkChasers: Position[] = [
    { x: 8, y: 2 },
    { x: 2, y: 8 },
    { x: 4, y: 5 }
  ];
  
  for (const pos of lightChasers) {
    monsters.push({
      id: uid(),
      type: 'lightChaser',
      position: { ...pos },
      targetPosition: null,
      state: 'patrolling',
      health: 2,
      maxHealth: 2,
      speed: 3.2,
      movingProgress: 0,
      cooldownTimer: 0,
      retreatSteps: 0,
      patrolTarget: null,
      bubbleText: null,
      bubbleTimer: 0,
      alive: true
    });
  }
  
  for (const pos of darkChasers) {
    monsters.push({
      id: uid(),
      type: 'darkChaser',
      position: { ...pos },
      targetPosition: null,
      state: 'patrolling',
      health: 2,
      maxHealth: 2,
      speed: 4,
      movingProgress: 0,
      cooldownTimer: 0,
      retreatSteps: 0,
      patrolTarget: null,
      bubbleText: null,
      bubbleTimer: 0,
      alive: true
    });
  }
  
  return monsters;
}

export function isWalkable(map: Tile[][], pos: Position): boolean {
  if (pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE) return false;
  return map[pos.y][pos.x].walkable;
}

export function areAdjacent(a: Position, b: Position): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx + dy === 1;
}

export function setMonsterBubble(monster: Monster, text: string): void {
  monster.bubbleText = text;
  monster.bubbleTimer = 2;
}

export function updateMonsterState(monster: Monster, newState: MonsterState): void {
  if (monster.state !== newState) {
    monster.state = newState;
    if (newState === 'chasing') {
      setMonsterBubble(monster, '追击！');
    } else if (newState === 'retreating') {
      setMonsterBubble(monster, '撤退...');
    } else if (newState === 'patrolling') {
      setMonsterBubble(monster, '巡逻中');
    }
  }
}

export function updatePlayerStateFromLighting(player: Player, lightIntensity: number): void {
  player.lightIntensity = lightIntensity;
  let newState: PlayerState;
  if (lightIntensity > 0.6) {
    newState = 'bright';
    player.speed = 4;
  } else if (lightIntensity > 0.3) {
    newState = 'dim';
    player.speed = 4;
  } else {
    newState = 'dark';
    player.speed = 2;
  }
  player.state = newState;
}

export function checkBattle(
  player: Player,
  monsters: Monster[]
): { triggered: boolean; monsterId: string | null } {
  for (const monster of monsters) {
    if (!monster.alive) continue;
    if (areAdjacent(player.position, monster.position)) {
      return { triggered: true, monsterId: monster.id };
    }
  }
  return { triggered: false, monsterId: null };
}

export function resolveBattle(
  player: Player,
  monsters: Monster[],
  monsterId: string
): { monsterDied: boolean; playerDied: boolean } {
  const monster = monsters.find(m => m.id === monsterId);
  if (!monster || !monster.alive) return { monsterDied: false, playerDied: false };
  
  monster.health -= player.attack;
  
  let monsterDied = false;
  let playerDied = false;
  
  if (monster.health <= 0) {
    monster.alive = false;
    monsterDied = true;
    player.defeatedCount += 1;
    player.health = Math.min(player.maxHealth, player.health + 1);
  } else {
    player.health -= 1;
    if (player.health <= 0) {
      playerDied = true;
    }
  }
  
  return { monsterDied, playerDied };
}

export function checkVictory(player: Player, monsters: Monster[], exitPosition: Position): boolean {
  const aliveMonsters = monsters.filter(m => m.alive);
  if (aliveMonsters.length > 0) return false;
  return player.position.x === exitPosition.x && player.position.y === exitPosition.y;
}

export function createInitialGameState(): GameState {
  const { map, torches, exitPosition } = generateMap();
  return {
    map,
    player: createInitialPlayer(),
    monsters: createMonsters(),
    torches,
    exitPosition,
    phase: 'playing' as GamePhase,
    battleAnimation: null,
    time: 0
  };
}

export function updateBattleAnimation(anim: BattleAnimation | null, dt: number): BattleAnimation | null {
  if (!anim) return null;
  if (!anim.active) return null;
  
  anim.progress += dt * 5;
  anim.playerShake = Math.sin(anim.progress * 20) * 3;
  anim.monsterShake = Math.sin(anim.progress * 20 + Math.PI) * 3;
  
  if (anim.progress >= 1) {
    return null;
  }
  return anim;
}

export function updateBubbleTimers(monsters: Monster[], dt: number): void {
  for (const m of monsters) {
    if (m.bubbleTimer > 0) {
      m.bubbleTimer -= dt;
      if (m.bubbleTimer <= 0) {
        m.bubbleText = null;
      }
    }
    if (m.cooldownTimer > 0) {
      m.cooldownTimer -= dt;
    }
  }
}
