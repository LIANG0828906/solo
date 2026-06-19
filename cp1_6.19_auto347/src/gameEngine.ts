import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  Asteroid,
  Ship,
  Turret,
  Pirate,
  Projectile,
  MineralDrop,
  TurretType,
  GameInput,
  Fragment,
} from './types';
import { updateTurret, updateProjectiles, applyAoeDamage, createTurret } from './weaponSystem';
import { updatePirateAI } from './aiController';

const SHIP_SPEED = 3;
const MINING_RATE_PER_SECOND = 100;
const SHIP_MAX_MINERALS = 1000;
const WAVE_INTERVAL = 30000;
const PIRATE_BASE_COUNT = 3;
const MAX_PIRATES_PER_WAVE = 10;
const CANVAS_PADDING = 50;

export function createInitialState(
  canvasWidth: number,
  canvasHeight: number
): GameState {
  const ship: Ship = {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    angle: 0,
    speed: SHIP_SPEED,
    maxMinerals: SHIP_MAX_MINERALS,
    minerals: 0,
    health: 100,
    maxHealth: 100,
  };

  const asteroids = generateAsteroids(canvasWidth, canvasHeight, 25);

  return {
    status: 'menu',
    score: 0,
    wave: 0,
    waveTimer: 0,
    waveInterval: WAVE_INTERVAL,
    piratesPerWave: PIRATE_BASE_COUNT,
    maxPiratesPerWave: MAX_PIRATES_PER_WAVE,
    ship,
    asteroids,
    turrets: [],
    projectiles: [],
    pirates: [],
    mineralDrops: [],
    canvasWidth,
    canvasHeight,
    isMining: false,
    keys: {},
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    selectedTurret: null,
    gameOverReason: '',
    leaderboard: [],
  };
}

function generateAsteroids(
  width: number,
  height: number,
  count: number
): Asteroid[] {
  const asteroids: Asteroid[] = [];
  const actualCount = Math.floor(Math.random() * 11) + 20;

  for (let i = 0; i < actualCount; i++) {
    const radius = Math.random() * 20 + 10;
    const grayValue = Math.floor(Math.random() * 60) + 97;
    const color = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
    const minerals = Math.floor(Math.random() * 151) + 50;

    const noisePattern: number[] = [];
    for (let j = 0; j < 12; j++) {
      noisePattern.push(Math.random() * 0.3 + 0.85);
    }

    asteroids.push({
      id: uuidv4(),
      x: Math.random() * (width - radius * 2 - CANVAS_PADDING * 2) + CANVAS_PADDING + radius,
      y: Math.random() * (height - radius * 2 - CANVAS_PADDING * 2) + CANVAS_PADDING + radius,
      radius,
      color,
      minerals,
      maxMinerals: minerals,
      noisePattern,
      fragments: [],
      isBreaking: false,
      breakTimer: 0,
      flashTimer: 0,
    });
  }

  return asteroids;
}

function findNearestAsteroid(
  ship: Ship,
  asteroids: Asteroid[]
): Asteroid | null {
  let nearest: Asteroid | null = null;
  let minDist = Infinity;

  for (const asteroid of asteroids) {
    if (asteroid.isBreaking || asteroid.minerals <= 0) continue;
    const dx = asteroid.x - ship.x;
    const dy = asteroid.y - ship.y;
    const dist = Math.sqrt(dx * dx + dy * dy) - asteroid.radius;
    if (dist < minDist && dist < 100) {
      minDist = dist;
      nearest = asteroid;
    }
  }

  return nearest;
}

export function updateGame(
  state: GameState,
  input: GameInput,
  deltaTime: number,
  currentTime: number
): GameState {
  if (state.status !== 'playing') return state;

  let newState = { ...state };

  newState = updateShip(newState, input, deltaTime);
  newState = updateMining(newState, input, deltaTime);
  newState = updateAsteroids(newState, deltaTime);
  newState = updateTurrets(newState, currentTime);
  newState = updateProjectilesState(newState, deltaTime);
  newState = updatePiratesState(newState, currentTime, deltaTime);
  newState = updateMineralDrops(newState);
  newState = updateWaves(newState, deltaTime);
  newState = checkGameOver(newState);

  return newState;
}

function updateShip(state: GameState, input: GameInput, deltaTime: number): GameState {
  const newShip = { ...state.ship };
  const keys = input.keys;

  let dx = 0;
  let dy = 0;

  if (keys['w'] || keys['W'] || keys['ArrowUp']) dy -= 1;
  if (keys['s'] || keys['S'] || keys['ArrowDown']) dy += 1;
  if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx -= 1;
  if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx /= length;
    dy /= length;
    newShip.x += dx * newShip.speed;
    newShip.y += dy * newShip.speed;
  }

  const mouseDx = input.mouseX - newShip.x;
  const mouseDy = input.mouseY - newShip.y;
  newShip.angle = Math.atan2(mouseDy, mouseDx);

  newShip.x = Math.max(20, Math.min(state.canvasWidth - 20, newShip.x));
  newShip.y = Math.max(20, Math.min(state.canvasHeight - 20, newShip.y));

  return { ...state, ship: newShip };
}

function updateMining(state: GameState, input: GameInput, deltaTime: number): GameState {
  const newState = { ...state };

  if (input.mouseDown && state.ship.minerals < state.ship.maxMinerals) {
    const nearest = findNearestAsteroid(state.ship, state.asteroids);
    if (nearest) {
      newState.isMining = true;
      newState.miningTargetId = nearest.id;

      const miningAmount = (MINING_RATE_PER_SECOND * deltaTime) / 1000;
      const actualMined = Math.min(
        miningAmount,
        nearest.minerals,
        state.ship.maxMinerals - state.ship.minerals
      );

      const newAsteroids = state.asteroids.map((a) => {
        if (a.id === nearest.id) {
          const newMinerals = a.minerals - actualMined;
          if (newMinerals <= 0) {
            return {
              ...a,
              minerals: 0,
              isBreaking: true,
              breakTimer: 200,
              fragments: createFragments(a),
            };
          }
          return { ...a, minerals: newMinerals };
        }
        return a;
      });

      const newShip = { ...state.ship };
      newShip.minerals += actualMined;

      newState.asteroids = newAsteroids;
      newState.ship = newShip;
      newState.score += Math.floor(actualMined);
    } else {
      newState.isMining = false;
      newState.miningTargetId = undefined;
    }
  } else {
    newState.isMining = false;
    newState.miningTargetId = undefined;
  }

  return newState;
}

function createFragments(asteroid: Asteroid): Fragment[] {
  const fragmentCount = Math.floor(Math.random() * 3) + 3;
  const fragments: Fragment[] = [];

  for (let i = 0; i < fragmentCount; i++) {
    const angle = (Math.PI * 2 * i) / fragmentCount + Math.random() * 0.5;
    const speed = Math.random() * 3 + 2;
    fragments.push({
      x: asteroid.x,
      y: asteroid.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: asteroid.radius * (Math.random() * 0.3 + 0.2),
      color: asteroid.color,
      life: 200,
      maxLife: 200,
    });
  }

  return fragments;
}

function updateAsteroids(state: GameState, deltaTime: number): GameState {
  const newAsteroids = state.asteroids
    .map((asteroid) => {
      if (asteroid.isBreaking) {
        const newBreakTimer = asteroid.breakTimer - deltaTime;
        const newFragments = asteroid.fragments.map((f) => ({
          ...f,
          x: f.x + f.vx,
          y: f.y + f.vy,
          life: f.life - deltaTime,
          vx: f.vx * 0.98,
          vy: f.vy * 0.98,
        }));

        if (newBreakTimer <= 0) {
          return null;
        }

        return { ...asteroid, breakTimer: newBreakTimer, fragments: newFragments };
      }

      if (asteroid.flashTimer > 0) {
        return { ...asteroid, flashTimer: asteroid.flashTimer - deltaTime };
      }

      return asteroid;
    })
    .filter((a): a is Asteroid => a !== null);

  return { ...state, asteroids: newAsteroids };
}

function updateTurrets(state: GameState, currentTime: number): GameState {
  const newProjectiles: Projectile[] = [...state.projectiles];
  const newTurrets = state.turrets
    .map((turret) => {
      if (turret.health <= 0) return null;
      const result = updateTurret(turret, state.pirates, currentTime);
      newProjectiles.push(...result.projectiles);
      return result.turret;
    })
    .filter((t): t is Turret => t !== null);

  return { ...state, turrets: newTurrets, projectiles: newProjectiles };
}

function updateProjectilesState(state: GameState, deltaTime: number): GameState {
  const result = updateProjectiles(state.projectiles, state.pirates, deltaTime);

  let newPirates = [...state.pirates];

  for (const damageInfo of result.damagedPirates) {
    if (damageInfo.aoeCenter && damageInfo.aoeRadius) {
      newPirates = applyAoeDamage(
        newPirates,
        damageInfo.aoeCenter,
        damageInfo.aoeRadius,
        damageInfo.damage
      );
    } else {
      newPirates = newPirates.map((p) => {
        if (p.id === damageInfo.pirateId) {
          const updated = { ...p, health: p.health - damageInfo.damage };
          if (damageInfo.slowEffect && damageInfo.slowDuration) {
            updated.slowTimer = damageInfo.slowDuration;
            updated.slowAmount = damageInfo.slowEffect;
          }
          return updated;
        }
        return p;
      });
    }
  }

  const deadPirates = newPirates.filter((p) => p.health <= 0 && !p.isDying);
  const newDrops: MineralDrop[] = [...state.mineralDrops];
  let scoreGain = 0;

  for (const pirate of deadPirates) {
    scoreGain += 100;
    newDrops.push({
      id: uuidv4(),
      x: pirate.x,
      y: pirate.y,
      amount: 20,
      life: 10000,
    });
  }

  newPirates = newPirates.map((p) => {
    if (p.health <= 0 && !p.isDying) {
      return { ...p, isDying: true, deathTimer: 300 };
    }
    return p;
  });

  newPirates = newPirates.filter((p) => !p.isDying || p.deathTimer > 0);

  return {
    ...state,
    projectiles: result.projectiles,
    pirates: newPirates,
    mineralDrops: newDrops,
    score: state.score + scoreGain,
  };
}

function updatePiratesState(
  state: GameState,
  currentTime: number,
  deltaTime: number
): GameState {
  let newTurrets = [...state.turrets];
  let newShip = { ...state.ship };
  let newPirates: Pirate[] = [];

  for (const pirate of state.pirates) {
    const result = updatePirateAI(pirate, newTurrets, newShip, currentTime);

    if (result.attackTargetId && result.attackTargetType) {
      if (result.attackTargetType === 'turret') {
        newTurrets = newTurrets.map((t) => {
          if (t.id === result.attackTargetId) {
            return {
              ...t,
              health: t.health - pirate.damage,
              flashTimer: 100,
            };
          }
          return t;
        });
      } else {
        newShip.health -= pirate.damage;
      }
    }

    newPirates.push(result.pirate);
  }

  newTurrets = newTurrets.filter((t) => t.health > 0);

  return {
    ...state,
    pirates: newPirates,
    turrets: newTurrets,
    ship: newShip,
  };
}

function updateMineralDrops(state: GameState): GameState {
  let collectedAmount = 0;
  const newDrops = state.mineralDrops
    .map((drop) => {
      const dx = state.ship.x - drop.x;
      const dy = state.ship.y - drop.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30) {
        const canCollect = Math.min(
          drop.amount,
          state.ship.maxMinerals - state.ship.minerals - collectedAmount
        );
        collectedAmount += canCollect;
        if (canCollect >= drop.amount) {
          return null;
        }
        return { ...drop, amount: drop.amount - canCollect, life: drop.life - 16.67 };
      }

      return { ...drop, life: drop.life - 16.67 };
    })
    .filter((d): d is MineralDrop => d !== null && d.life > 0);

  const newShip = {
    ...state.ship,
    minerals: Math.min(state.ship.maxMinerals, state.ship.minerals + collectedAmount),
  };

  return {
    ...state,
    mineralDrops: newDrops,
    ship: newShip,
    score: state.score + Math.floor(collectedAmount),
  };
}

function updateWaves(state: GameState, deltaTime: number): GameState {
  const newWaveTimer = state.waveTimer + deltaTime;

  if (newWaveTimer >= state.waveInterval) {
    const newWave = state.wave + 1;
    const pirateCount = Math.min(
      state.piratesPerWave + (newWave - 1),
      state.maxPiratesPerWave
    );

    const newPirates = spawnPirateWave(
      pirateCount,
      state.canvasWidth,
      state.canvasHeight
    );

    return {
      ...state,
      wave: newWave,
      waveTimer: 0,
      pirates: [...state.pirates, ...newPirates],
    };
  }

  return { ...state, waveTimer: newWaveTimer };
}

function spawnPirateWave(
  count: number,
  canvasWidth: number,
  canvasHeight: number
): Pirate[] {
  const pirates: Pirate[] = [];

  for (let i = 0; i < count; i++) {
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;

    switch (side) {
      case 0:
        x = Math.random() * canvasWidth;
        y = -30;
        break;
      case 1:
        x = canvasWidth + 30;
        y = Math.random() * canvasHeight;
        break;
      case 2:
        x = Math.random() * canvasWidth;
        y = canvasHeight + 30;
        break;
      default:
        x = -30;
        y = Math.random() * canvasHeight;
    }

    pirates.push({
      id: uuidv4(),
      x,
      y,
      angle: 0,
      speed: 2,
      health: 50,
      maxHealth: 50,
      range: 50,
      damage: 10,
      lastAttackTime: 0,
      targetType: 'ship',
      slowTimer: 0,
      slowAmount: 0,
      deathTimer: 0,
      isDying: false,
    });
  }

  return pirates;
}

export function placeTurret(
  state: GameState,
  type: TurretType,
  x: number,
  y: number
): GameState {
  const turret = createTurret(x, y, type);
  return {
    ...state,
    turrets: [...state.turrets, turret],
  };
}

function checkGameOver(state: GameState): GameState {
  if (state.ship.health <= 0) {
    return {
      ...state,
      status: 'gameover',
      gameOverReason: '飞船被摧毁了！',
    };
  }
  return state;
}

export function startGame(state: GameState): GameState {
  const newState = createInitialState(state.canvasWidth, state.canvasHeight);
  return {
    ...newState,
    status: 'playing',
    leaderboard: state.leaderboard,
  };
}
