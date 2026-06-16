import { create } from 'zustand';
import { generateAsteroidField, updateAsteroids, Asteroid } from './AsteroidField';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

export interface CargoItem {
  type: 'normal' | 'rare';
}

export interface Star {
  x: number;
  y: number;
  size: number;
  twinklePhase: number;
  twinkleSpeed: number;
  layer: number;
}

interface GameState {
  shipX: number;
  shipY: number;
  shipVX: number;
  shipVY: number;
  shipAngle: number;
  fuel: number;
  shield: number;
  cargo: CargoItem[];
  maxCargo: number;

  asteroids: Asteroid[];

  trailParticles: Particle[];
  explosionParticles: Particle[];

  isMining: boolean;
  miningTargetId: string | null;
  miningProgress: number;

  timeRemaining: number;
  gameOver: boolean;
  gameStarted: boolean;

  keys: Record<string, boolean>;

  screenFlashTimer: number;
  controlHintTimer: number;
  invulnerableTimer: number;

  canvasWidth: number;
  canvasHeight: number;

  stars: Star[];

  setCanvasSize: (w: number, h: number) => void;
  keyPressed: (key: string) => void;
  keyReleased: (key: string) => void;
  update: (dt: number) => void;
  startGame: () => void;
  restartGame: () => void;
}

function generateStars(w: number, h: number): Star[] {
  const stars: Star[] = [];
  const count = 300;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * (w + 200) - 100,
      y: Math.random() * (h + 200) - 100,
      size: 1 + Math.random(),
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: (2 * Math.PI) / (2 + Math.random() * 2),
      layer: Math.floor(Math.random() * 3),
    });
  }
  return stars;
}

function findMiningTarget(
  shipX: number,
  shipY: number,
  shipAngle: number,
  asteroids: Asteroid[]
): string | null {
  const maxDist = 250;
  const maxAngle = Math.PI / 4;
  let bestId: string | null = null;
  let bestDist = maxDist;

  for (const a of asteroids) {
    if (!a.alive) continue;
    const dx = a.x - shipX;
    const dy = a.y - shipY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDist) continue;

    const angleToAsteroid = Math.atan2(dy, dx);
    let diff = angleToAsteroid - shipAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    if (Math.abs(diff) > maxAngle) continue;

    if (dist < bestDist) {
      bestDist = dist;
      bestId = a.id;
    }
  }

  return bestId;
}

const MAX_TRAIL_PARTICLES = 50;

export const useGameState = create<GameState>((set, get) => ({
  shipX: 0,
  shipY: 0,
  shipVX: 0,
  shipVY: 0,
  shipAngle: -Math.PI / 2,
  fuel: 100,
  shield: 100,
  cargo: [],
  maxCargo: 20,

  asteroids: [],

  trailParticles: [],
  explosionParticles: [],

  isMining: false,
  miningTargetId: null,
  miningProgress: 0,

  timeRemaining: 120,
  gameOver: false,
  gameStarted: false,

  keys: {},

  screenFlashTimer: 0,
  controlHintTimer: 0,
  invulnerableTimer: 0,

  canvasWidth: 800,
  canvasHeight: 600,

  stars: [],

  setCanvasSize: (w: number, h: number) => {
    const state = get();
    if (state.stars.length === 0) {
      set({ canvasWidth: w, canvasHeight: h, stars: generateStars(w, h) });
    } else {
      set({ canvasWidth: w, canvasHeight: h });
    }
  },

  keyPressed: (key: string) => {
    set((s) => ({ keys: { ...s.keys, [key]: true } }));
  },

  keyReleased: (key: string) => {
    set((s) => ({ keys: { ...s.keys, [key]: false } }));
  },

  startGame: () => {
    const state = get();
    const w = state.canvasWidth;
    const h = state.canvasHeight;
    set({
      shipX: w / 2,
      shipY: h / 2,
      shipVX: 0,
      shipVY: 0,
      shipAngle: -Math.PI / 2,
      fuel: 100,
      shield: 100,
      cargo: [],
      asteroids: generateAsteroidField(w, h),
      trailParticles: [],
      explosionParticles: [],
      isMining: false,
      miningTargetId: null,
      miningProgress: 0,
      timeRemaining: 120,
      gameOver: false,
      gameStarted: true,
      screenFlashTimer: 0,
      controlHintTimer: 3,
      invulnerableTimer: 0,
      stars: state.stars.length > 0 ? state.stars : generateStars(w, h),
    });
  },

  restartGame: () => {
    get().startGame();
  },

  update: (dt: number) => {
    const state = get();
    if (state.gameOver || !state.gameStarted) return;

    const keys = state.keys;
    const accel = 320;
    const friction = 0.96;
    let vx = state.shipVX;
    let vy = state.shipVY;
    let isMoving = false;

    if (keys['w'] || keys['arrowup']) { vy -= accel * dt; isMoving = true; }
    if (keys['s'] || keys['arrowdown']) { vy += accel * dt; isMoving = true; }
    if (keys['a'] || keys['arrowleft']) { vx -= accel * dt; isMoving = true; }
    if (keys['d'] || keys['arrowright']) { vx += accel * dt; isMoving = true; }

    vx *= Math.pow(friction, dt * 60);
    vy *= Math.pow(friction, dt * 60);

    let shipX = state.shipX + vx * dt;
    let shipY = state.shipY + vy * dt;

    const margin = 15;
    shipX = Math.max(margin, Math.min(state.canvasWidth - margin, shipX));
    shipY = Math.max(margin, Math.min(state.canvasHeight - margin, shipY));

    if (shipX <= margin || shipX >= state.canvasWidth - margin) vx = 0;
    if (shipY <= margin || shipY >= state.canvasHeight - margin) vy = 0;

    let shipAngle = state.shipAngle;
    if (Math.abs(vx) > 5 || Math.abs(vy) > 5) {
      const targetAngle = Math.atan2(vy, vx);
      let diff = targetAngle - shipAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      shipAngle += diff * Math.min(1, 10 * dt);
    }

    let fuel = state.fuel;
    if (isMoving) fuel -= 0.5 * dt;
    fuel = Math.max(0, fuel);

    if (fuel <= 0) {
      vx *= 0.9;
      vy *= 0.9;
      isMoving = false;
    }

    const isMiningInput = !!keys[' '];
    let miningTargetId = state.miningTargetId;
    let miningProgress = state.miningProgress;
    let asteroids = state.asteroids;
    let cargo = state.cargo;
    let newExplosionParticles = [...state.explosionParticles];
    let isMining = false;

    if (isMiningInput && fuel > 0) {
      fuel -= 2 * dt;
      fuel = Math.max(0, fuel);

      if (!miningTargetId || !asteroids.find((a) => a.id === miningTargetId && a.alive)) {
        miningTargetId = findMiningTarget(shipX, shipY, shipAngle, asteroids);
        miningProgress = 0;
      }

      if (miningTargetId) {
        isMining = true;
        miningProgress += dt;

        if (miningProgress >= 0.5) {
          const idx = asteroids.findIndex((a) => a.id === miningTargetId);
          if (idx !== -1) {
            const asteroid = asteroids[idx];
            const isRare = asteroid.mineralType === 'rare';

            if (cargo.length < state.maxCargo) {
              cargo = [...cargo, { type: asteroid.mineralType }];
            }

            const fragmentCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < fragmentCount; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 60 + Math.random() * 100;
              newExplosionParticles.push({
                x: asteroid.x,
                y: asteroid.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 0.6 + Math.random() * 0.4,
                size: 4 + Math.random() * 6,
                r: isRare ? 155 : 139,
                g: isRare ? 89 : 139,
                b: isRare ? 182 : 139,
              });
            }

            if (isRare) {
              for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 80 + Math.random() * 130;
                newExplosionParticles.push({
                  x: asteroid.x,
                  y: asteroid.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  life: 0.4 + Math.random() * 0.3,
                  maxLife: 0.4 + Math.random() * 0.3,
                  size: 2 + Math.random() * 3,
                  r: 191,
                  g: 85,
                  b: 236,
                });
              }
            }

            asteroids = asteroids.map((a, i) =>
              i === idx ? { ...a, alive: false } : a
            );
          }

          miningTargetId = null;
          miningProgress = 0;
        }
      }
    } else {
      miningTargetId = null;
      miningProgress = 0;
    }

    asteroids = updateAsteroids(asteroids, shipX, shipY, dt);

    let shield = state.shield;
    let screenFlashTimer = state.screenFlashTimer;
    let invulnerableTimer = state.invulnerableTimer;

    if (invulnerableTimer > 0) {
      invulnerableTimer -= dt;
    } else {
      const shipRadius = 12;
      for (const a of asteroids) {
        if (!a.alive) continue;
        const dx = shipX - a.x;
        const dy = shipY - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < shipRadius + a.radius * 0.7) {
          shield -= 15;
          screenFlashTimer = 0.2;
          invulnerableTimer = 0.8;
          const pushAngle = Math.atan2(dy, dx);
          vx += Math.cos(pushAngle) * 200;
          vy += Math.sin(pushAngle) * 200;
          break;
        }
      }
    }

    shield = Math.max(0, shield);
    if (screenFlashTimer > 0) screenFlashTimer -= dt;

    let trailParticles = [...state.trailParticles];

    if (isMoving && trailParticles.length < MAX_TRAIL_PARTICLES) {
      const rearX = shipX - Math.cos(shipAngle) * 14;
      const rearY = shipY - Math.sin(shipAngle) * 14;
      trailParticles.push({
        x: rearX + (Math.random() - 0.5) * 6,
        y: rearY + (Math.random() - 0.5) * 6,
        vx: -Math.cos(shipAngle) * (30 + Math.random() * 40) + (Math.random() - 0.5) * 20,
        vy: -Math.sin(shipAngle) * (30 + Math.random() * 40) + (Math.random() - 0.5) * 20,
        life: 0.3,
        maxLife: 0.3,
        size: 1 + Math.random() * 3,
        r: 255,
        g: 165 + Math.floor(Math.random() * 90),
        b: 0,
      });
    }

    trailParticles = trailParticles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        life: p.life - dt,
      }))
      .filter((p) => p.life > 0);

    newExplosionParticles = newExplosionParticles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        vx: p.vx * 0.98,
        vy: p.vy * 0.98,
        life: p.life - dt,
      }))
      .filter((p) => p.life > 0);

    let timeRemaining = state.timeRemaining - dt;
    let controlHintTimer = state.controlHintTimer;
    if (controlHintTimer > 0) controlHintTimer -= dt;

    const gameOver = timeRemaining <= 0 || shield <= 0;
    if (timeRemaining < 0) timeRemaining = 0;

    set({
      shipX,
      shipY,
      shipVX: vx,
      shipVY: vy,
      shipAngle,
      fuel,
      shield,
      cargo,
      asteroids: asteroids.filter((a) => a.alive),
      trailParticles,
      explosionParticles: newExplosionParticles,
      isMining,
      miningTargetId,
      miningProgress,
      timeRemaining,
      gameOver,
      screenFlashTimer,
      controlHintTimer,
      invulnerableTimer,
    });
  },
}));
