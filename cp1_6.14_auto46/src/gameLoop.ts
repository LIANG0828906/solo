import { GameState, toHUDData, HUDData, Upgrades } from './types';
import { updatePhysics, generateStars } from './physics';
import { render } from './renderer';

let animationId: number | null = null;

export function initGame(width: number, height: number, isTouch: boolean): GameState {
  return {
    width,
    height,
    ship: {
      pos: { x: width / 2, y: height / 2 },
      vel: { x: 0, y: 0 },
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      shield: 50,
      maxShield: 50,
      angle: 0,
      radius: 20,
    },
    debris: [],
    powerUps: [],
    particles: [],
    stars: generateStars(width, height, 250),
    beamActive: false,
    mousePos: { x: width / 2, y: height / 2 },
    level: 1,
    collectedCount: 0,
    targetCount: 10,
    score: 0,
    upgradePoints: 0,
    phase: 'menu',
    timeSlowActive: false,
    timeSlowTimer: 0,
    shieldBoostActive: false,
    shieldBoostTimer: 0,
    screenFlash: 0,
    screenFlashColor: '#7fdbff',
    upgrades: { speed: 0, beamRange: 0, shieldStrength: 0, energyCapacity: 0 },
    spawnTimer: 0,
    powerUpSpawnTimer: 5,
    nextDebrisId: 0,
    nextPowerUpId: 0,
    beamEnergyCost: 15,
    debrisSpawnRate: 1,
    lastTime: 0,
    gameTime: 0,
    isTouchDevice: isTouch,
  };
}

export function startGameLoop(
  state: GameState,
  canvas: HTMLCanvasElement,
  onHUDUpdate: (data: HUDData) => void
): void {
  const ctx = canvas.getContext('2d')!;
  let lastHUDUpdate = 0;

  function loop(timestamp: number): void {
    if (state.lastTime === 0) state.lastTime = timestamp;
    const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
    state.lastTime = timestamp;

    if (state.phase === 'playing') {
      updatePhysics(state, dt);
    } else if (state.phase === 'menu') {
      state.gameTime += dt;
      for (const star of state.stars) {
        star.twinklePhase += dt * star.twinkleSpeed * 0.5;
      }
    }

    render(ctx, state);

    if (timestamp - lastHUDUpdate > 80) {
      onHUDUpdate(toHUDData(state));
      lastHUDUpdate = timestamp;
    }

    animationId = requestAnimationFrame(loop);
  }

  animationId = requestAnimationFrame(loop);
}

export function stopGameLoop(): void {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

export function startLevel(state: GameState): void {
  state.level += 1;
  state.collectedCount = 0;
  state.targetCount = 10 + (state.level - 1) * 5;
  state.debris = [];
  state.powerUps = [];
  state.spawnTimer = 0;
  state.powerUpSpawnTimer = 5;
  state.debrisSpawnRate = 1 + (state.level - 1) * 0.25;
  state.beamEnergyCost = 15 + (state.level - 1) * 1;
  state.ship.shield = state.ship.maxShield;
  state.phase = 'playing';
}

export function resetGame(state: GameState): void {
  state.ship.health = state.ship.maxHealth;
  state.ship.energy = state.ship.maxEnergy;
  state.ship.shield = state.ship.maxShield;
  state.ship.pos = { x: state.width / 2, y: state.height / 2 };
  state.ship.vel = { x: 0, y: 0 };
  state.level = 1;
  state.collectedCount = 0;
  state.targetCount = 10;
  state.score = 0;
  state.debris = [];
  state.powerUps = [];
  state.particles = [];
  state.beamActive = false;
  state.timeSlowActive = false;
  state.timeSlowTimer = 0;
  state.shieldBoostActive = false;
  state.shieldBoostTimer = 0;
  state.screenFlash = 0;
  state.spawnTimer = 0;
  state.powerUpSpawnTimer = 5;
  state.debrisSpawnRate = 1;
  state.beamEnergyCost = 15;
  state.phase = 'playing';
}

export function applyUpgrade(state: GameState, key: keyof Upgrades): void {
  if (state.upgradePoints <= 0) return;
  if (state.upgrades[key] >= 5) return;

  state.upgrades[key] += 1;
  state.upgradePoints -= 1;

  if (key === 'energyCapacity') {
    state.ship.maxEnergy += 15;
    state.ship.energy = state.ship.maxEnergy;
  }
  if (key === 'shieldStrength') {
    state.ship.maxShield += 10;
    state.ship.shield = state.ship.maxShield;
  }
}

export function handleResize(state: GameState, width: number, height: number): void {
  state.width = width;
  state.height = height;
  state.stars = generateStars(width, height, 250);
}
