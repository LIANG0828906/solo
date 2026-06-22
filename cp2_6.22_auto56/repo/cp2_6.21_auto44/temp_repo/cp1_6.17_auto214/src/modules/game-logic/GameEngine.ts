import type { Crystal, Monster, Particle, WaveInfo, GamePhase } from '../../store/gameStore';
import { useGameStore } from '../../store/gameStore';
import {
  calculateWaveField,
  getAmplitudeAt,
  getPathWaypoints,
  hexDistance,
  hexToPixel,
  GRID_COLS,
  GRID_ROWS,
  type WaveFieldResult,
} from './WaveField';

let animFrameId: number | null = null;
let lastTime = 0;
let currentTime = 0;
let waveField: WaveFieldResult | null = null;
let pathWaypoints: { x: number; y: number }[] = [];
let monsterIdCounter = 0;
let particleIdCounter = 0;

const SPAWN_INTERVAL = 1.2;
const WAVE_BREAK_DURATION = 10;
const MAX_ESCAPED = 20;
const MAX_WAVES = 10;
const KILL_REWARD = 10;

const MONSTER_CONFIGS = {
  normal: { hp: 100, speed: 40, resistance: 0.3 },
  fast: { hp: 60, speed: 80, resistance: 0.5 },
  heavy: { hp: 250, speed: 25, resistance: 0.2 },
} as const;

function generateWaveMonsters(waveNum: number): Monster[] {
  const count = 10 + Math.floor(Math.random() * 11);
  const monsters: Monster[] = [];
  const waveScale = 1 + (waveNum - 1) * 0.15;

  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let type: 'normal' | 'fast' | 'heavy';
    if (waveNum <= 3) {
      type = roll < 0.6 ? 'normal' : roll < 0.85 ? 'fast' : 'heavy';
    } else if (waveNum <= 6) {
      type = roll < 0.4 ? 'normal' : roll < 0.7 ? 'fast' : 'heavy';
    } else {
      type = roll < 0.3 ? 'normal' : roll < 0.6 ? 'fast' : 'heavy';
    }

    const config = MONSTER_CONFIGS[type];
    const wp = pathWaypoints[0];
    monsters.push({
      id: `monster_${monsterIdCounter++}`,
      type,
      hp: Math.round(config.hp * waveScale),
      maxHp: Math.round(config.hp * waveScale),
      speed: config.speed + (waveNum - 1) * 2,
      resistance: config.resistance,
      x: wp.x,
      y: wp.y,
      pathIndex: 0,
      pathProgress: 0,
      dead: false,
      escaped: false,
      damageMultiplier: 1,
    });
  }

  return monsters;
}

function moveMonster(monster: Monster, dt: number): void {
  if (monster.dead || monster.escaped) return;
  if (pathWaypoints.length < 2) return;

  const segStart = pathWaypoints[monster.pathIndex];
  const segEnd = pathWaypoints[Math.min(monster.pathIndex + 1, pathWaypoints.length - 1)];

  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const segLen = Math.sqrt(dx * dx + dy * dy);
  if (segLen < 0.01) return;

  const progressDelta = (monster.speed * dt) / segLen;
  monster.pathProgress += progressDelta;

  while (monster.pathProgress >= 1 && monster.pathIndex < pathWaypoints.length - 2) {
    monster.pathProgress -= 1;
    monster.pathIndex++;
  }

  if (monster.pathProgress >= 1 && monster.pathIndex >= pathWaypoints.length - 2) {
    monster.escaped = true;
    return;
  }

  const currentStart = pathWaypoints[monster.pathIndex];
  const currentEnd = pathWaypoints[Math.min(monster.pathIndex + 1, pathWaypoints.length - 1)];
  const t = Math.min(1, monster.pathProgress);
  monster.x = currentStart.x + (currentEnd.x - currentStart.x) * t;
  monster.y = currentStart.y + (currentEnd.y - currentStart.y) * t;
}

function applyDamage(monster: Monster, crystals: Crystal[]): number {
  if (!waveField || monster.dead || monster.escaped) return 0;

  const hexPos = pixelToHexApprox(monster.x, monster.y);
  const amplitude = getAmplitudeAt(waveField, hexPos.q, hexPos.r);
  const absAmp = Math.abs(amplitude);

  if (absAmp <= monster.resistance) return 0;

  let damage = absAmp * absAmp * 50;

  let bonusApplied = false;
  for (const crystal of crystals) {
    const dist = hexDistance(hexPos.q, hexPos.r, crystal.q, crystal.r);
    if (dist <= crystal.baseRadius) {
      if (crystal.type === 'high' && monster.type === 'fast') {
        damage *= 1.5;
        bonusApplied = true;
        break;
      }
      if (crystal.type === 'low' && monster.type === 'heavy') {
        damage *= 1.5;
        bonusApplied = true;
        break;
      }
    }
  }

  if (bonusApplied) {
    monster.damageMultiplier = 1.5;
  } else {
    monster.damageMultiplier = 1;
  }

  monster.hp -= damage;
  if (monster.hp <= 0) {
    monster.dead = true;
    return damage;
  }
  return damage;
}

function pixelToHexApprox(px: number, py: number): { q: number; r: number } {
  const HEX_SIZE = 12;
  const HEX_WIDTH = 2 * HEX_SIZE;
  const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

  const q = Math.round(px / (HEX_WIDTH * 0.75));
  const adjustedY = py - (q & 1 ? HEX_HEIGHT * 0.5 : 0);
  const r = Math.round(adjustedY / HEX_HEIGHT);
  return { q: Math.max(0, Math.min(GRID_COLS - 1, q)), r: Math.max(0, Math.min(GRID_ROWS - 1, r)) };
}

function updateWaveState(state: {
  gamePhase: GamePhase;
  waveInfo: WaveInfo;
  monsters: Monster[];
  crystals: Crystal[];
  resources: number;
  killsTotal: number;
  escapedTotal: number;
  crystalsPlaced: number;
  crystalsUpgraded: number;
  particles: Particle[];
  gameTime: number;
  gridStep: number;
  lastFrameTime: number;
}, dt: number): Record<string, any> {
  const wi = { ...state.waveInfo };
  const monsters = [...state.monsters];
  let particles = [...state.particles];
  let resources = state.resources;
  let killsTotal = state.killsTotal;
  let escapedTotal = state.escapedTotal;
  let gamePhase = state.gamePhase;
  let gridStep = state.gridStep;

  if (gamePhase === 'playing') {
    if (wi.beaconActive && wi.monstersSpawned === 0) {
      const beaconElapsed = currentTime - wi.beaconStartTime;
      if (beaconElapsed < 1.0) {
        return { waveInfo: wi, monsters, particles, resources, killsTotal, escapedTotal, gamePhase, gridStep };
      }
    }

    if (wi.monstersSpawned < wi.monstersInWave) {
      wi.spawnTimer += dt;
      if (wi.spawnTimer >= SPAWN_INTERVAL) {
        wi.spawnTimer -= SPAWN_INTERVAL;
        wi.monstersSpawned++;
      }
    }

    for (const monster of monsters) {
      if (monster.dead || monster.escaped) continue;
      moveMonster(monster, dt);
      applyDamage(monster, state.crystals);

      if (monster.dead) {
        killsTotal++;
        resources += KILL_REWARD;
        const crystalNear = state.crystals.find((c) => {
          const dist = hexDistance(
            pixelToHexApprox(monster.x, monster.y).q,
            pixelToHexApprox(monster.x, monster.y).r,
            c.q,
            c.r
          );
          return dist <= c.baseRadius;
        });
        const pColor = crystalNear
          ? crystalNear.type === 'high'
            ? '#FF6B35'
            : '#3A0CA3'
          : '#FF6B35';
        if (monsters.filter((m) => !m.dead && !m.escaped).length <= 50) {
          particles.push({
            id: `particle_${particleIdCounter++}`,
            x: monster.x,
            y: monster.y,
            color: pColor,
            birthTime: currentTime,
            duration: 0.3,
          });
        }
      }

      if (monster.escaped) {
        escapedTotal++;
      }
    }

    wi.monstersAlive = monsters.filter((m) => !m.dead && !m.escaped).length;
    particles = particles.filter((p) => currentTime - p.birthTime < p.duration);

    if (escapedTotal >= MAX_ESCAPED) {
      gamePhase = 'lost';
    } else if (wi.monstersSpawned >= wi.monstersInWave && wi.monstersAlive === 0) {
      if (wi.current >= MAX_WAVES) {
        gamePhase = 'won';
      } else {
        gamePhase = 'waveBreak';
        wi.nextWaveTimer = WAVE_BREAK_DURATION;
      }
    }
  }

  if (gamePhase === 'waveBreak') {
    wi.nextWaveTimer -= dt;
    if (wi.nextWaveTimer <= 0) {
      gamePhase = 'playing';
      wi.current++;
      const newMonsters = generateWaveMonsters(wi.current);
      wi.monstersInWave = newMonsters.length;
      wi.monstersSpawned = 0;
      wi.monstersAlive = newMonsters.length;
      wi.spawnTimer = 0;
      wi.beaconActive = true;
      wi.beaconStartTime = currentTime;
      monsters.push(...newMonsters);
    }
  }

  return { waveInfo: wi, monsters, particles, resources, killsTotal, escapedTotal, gamePhase, gridStep };
}

export function startEngine(): void {
  pathWaypoints = getPathWaypoints();
  monsterIdCounter = 0;
  particleIdCounter = 0;
  lastTime = performance.now() / 1000;
  currentTime = lastTime;

  const state = useGameStore.getState();
  const firstWave = generateWaveMonsters(1);
  useGameStore.getState().tick({
    gamePhase: 'playing',
    waveInfo: {
      current: 1,
      total: MAX_WAVES,
      monstersInWave: firstWave.length,
      monstersSpawned: 0,
      monstersAlive: firstWave.length,
      nextWaveTimer: 0,
      spawnTimer: 0,
      beaconActive: true,
      beaconStartTime: currentTime,
    },
    monsters: firstWave,
  });

  loop();
}

function loop(): void {
  animFrameId = requestAnimationFrame(() => {
    const now = performance.now() / 1000;
    const dt = Math.min(now - lastTime, 0.05);
    lastTime = now;
    currentTime = now;

    const state = useGameStore.getState();

    if (state.gamePhase === 'won' || state.gamePhase === 'lost' || state.gamePhase === 'idle') {
      animFrameId = null;
      return;
    }

    const step = state.gridStep;
    waveField = calculateWaveField(state.crystals, now, step);
    if (waveField.step !== step) {
      state.gridStep = waveField.step;
    }

    const update = updateWaveState(state, dt);
    update.gameTime = now;
    update.waveFieldTimestamp = now;
    update.lastFrameTime = now;

    useGameStore.getState().tick(update);

    loop();
  });
}

export function stopEngine(): void {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

export function getWaveField(): WaveFieldResult | null {
  return waveField;
}

export function getCurrentTime(): number {
  return currentTime;
}
