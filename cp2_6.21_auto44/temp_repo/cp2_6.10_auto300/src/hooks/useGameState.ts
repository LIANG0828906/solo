import { create } from 'zustand';
import { LEVEL_CONFIGS, TOTAL_LEVELS, CELL_SIZE } from '../utils/constants';
import { generateMaze, getWallData, getPathCells, Cell, WallData } from '../utils/mazeGenerator';
import { playCollectSound, playPortalSound, playHitSound } from '../utils/audio';

export interface Shard {
  id: number;
  position: [number, number, number];
  collected: boolean;
}

export interface LightBeam {
  id: number;
  rotationSpeed: number;
  rotationDirection: 1 | -1;
  angle: number;
  length: number;
  position: [number, number, number];
}

export interface Particle {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  life: number;
  color: string;
  size: number;
}

interface GameState {
  level: number;
  shardsCollected: number;
  shardsRequired: number;
  totalShards: number;
  isPaused: boolean;
  isGameComplete: boolean;
  startTime: number;
  elapsedTime: number;
  playerPosition: [number, number, number];
  portalActive: boolean;
  portalPosition: [number, number, number];
  maze: Cell[][] | null;
  walls: WallData[];
  shards: Shard[];
  lightBeams: LightBeam[];
  particles: Particle[];
  screenFlash: { active: boolean; color: string; intensity: number };
  levelTransition: { active: boolean; progress: number };
  totalShardsCollected: number;
  totalShardsAvailable: number;

  initLevel: (levelIndex: number) => void;
  resetGame: () => void;
  togglePause: () => void;
  updatePlayerPosition: (pos: [number, number, number]) => void;
  collectShard: (id: number) => void;
  checkPortalCollision: (playerPos: [number, number, number]) => boolean;
  checkBeamCollision: (playerPos: [number, number, number]) => boolean;
  resetPlayerToStart: () => void;
  updateBeams: (delta: number) => void;
  addParticles: (position: [number, number, number], color: string, count: number) => void;
  updateParticles: (delta: number) => void;
  updateElapsedTime: () => void;
  setScreenFlash: (active: boolean, color: string, intensity: number) => void;
  setLevelTransition: (active: boolean, progress: number) => void;
  getCurrentStartPosition: () => [number, number, number];
}

let particleIdCounter = 0;

export const useGameState = create<GameState>((set, get) => ({
  level: 0,
  shardsCollected: 0,
  shardsRequired: 5,
  totalShards: 0,
  isPaused: false,
  isGameComplete: false,
  startTime: Date.now(),
  elapsedTime: 0,
  playerPosition: [0, 0.5, 0],
  portalActive: false,
  portalPosition: [0, 0, 0],
  maze: null,
  walls: [],
  shards: [],
  lightBeams: [],
  particles: [],
  screenFlash: { active: false, color: '#00e5ff', intensity: 0 },
  levelTransition: { active: false, progress: 0 },
  totalShardsCollected: 0,
  totalShardsAvailable: 0,

  initLevel: (levelIndex: number) => {
    const config = LEVEL_CONFIGS[levelIndex];
    const maze = generateMaze(config.size);
    const walls = getWallData(maze, CELL_SIZE, 2);
    const pathCells = getPathCells(maze);

    const startX = (0 - config.size / 2 + 0.5) * CELL_SIZE;
    const startZ = (0 - config.size / 2 + 0.5) * CELL_SIZE;
    const endX = (config.size - 1 - config.size / 2 + 0.5) * CELL_SIZE;
    const endZ = (config.size - 1 - config.size / 2 + 0.5) * CELL_SIZE;

    const shuffledCells = [...pathCells].sort(() => Math.random() - 0.5);
    const shardCells = shuffledCells.slice(1, Math.min(config.shardsRequired + 3, pathCells.length));
    const shards: Shard[] = shardCells.map((cell, i) => ({
      id: i,
      position: [
        (cell.x - config.size / 2 + 0.5) * CELL_SIZE,
        0.5,
        (cell.z - config.size / 2 + 0.5) * CELL_SIZE,
      ],
      collected: false,
    }));

    const beamPositions: [number, number, number][] = [];
    const centerOffset = config.size / 2 * CELL_SIZE;
    for (let i = 0; i < config.beamCount; i++) {
      const angle = (i / config.beamCount) * Math.PI * 2;
      const radius = centerOffset * 0.5;
      beamPositions.push([
        Math.cos(angle) * radius,
        1,
        Math.sin(angle) * radius,
      ]);
    }

    const lightBeams: LightBeam[] = beamPositions.map((pos, i) => ({
      id: i,
      rotationSpeed: config.beamSpeed * (0.8 + Math.random() * 0.4),
      rotationDirection: Math.random() > 0.5 ? 1 : -1,
      angle: (i / config.beamCount) * Math.PI * 2,
      length: CELL_SIZE * config.size * 0.4,
      position: pos,
    }));

    set({
      level: levelIndex,
      shardsCollected: 0,
      shardsRequired: config.shardsRequired,
      totalShards: shards.length,
      playerPosition: [startX, 0.5, startZ],
      portalActive: false,
      portalPosition: [endX, 0.5, endZ],
      maze,
      walls,
      shards,
      lightBeams,
      particles: [],
      startTime: get().level === 0 ? Date.now() : get().startTime,
    });
  },

  resetGame: () => {
    set({
      isGameComplete: false,
      totalShardsCollected: 0,
      totalShardsAvailable: 0,
      elapsedTime: 0,
      startTime: Date.now(),
    });
    get().initLevel(0);
  },

  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }));
  },

  updatePlayerPosition: (pos: [number, number, number]) => {
    set({ playerPosition: pos });
  },

  collectShard: (id: number) => {
    const state = get();
    const shard = state.shards.find((s) => s.id === id);
    if (!shard || shard.collected) return;

    playCollectSound();

    set((state) => ({
      shards: state.shards.map((s) => (s.id === id ? { ...s, collected: true } : s)),
      shardsCollected: state.shardsCollected + 1,
      totalShardsCollected: state.totalShardsCollected + 1,
      portalActive: state.shardsCollected + 1 >= state.shardsRequired,
    }));

    get().addParticles(shard.position, LEVEL_CONFIGS[state.level].colors.shard, 20);
    get().setScreenFlash(true, LEVEL_CONFIGS[state.level].colors.accent, 0.5);
    setTimeout(() => get().setScreenFlash(false, '', 0), 200);
  },

  checkPortalCollision: (playerPos: [number, number, number]) => {
    const state = get();
    if (!state.portalActive) return false;

    const dx = playerPos[0] - state.portalPosition[0];
    const dz = playerPos[2] - state.portalPosition[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1.2) {
      playPortalSound();
      get().addParticles(state.portalPosition, '#ffffff', 50);

      if (state.level + 1 >= TOTAL_LEVELS) {
        set((s) => ({
          isGameComplete: true,
          elapsedTime: (Date.now() - s.startTime) / 1000,
          totalShardsAvailable: s.totalShardsAvailable + s.totalShards,
        }));
      } else {
        set((s) => ({
          totalShardsAvailable: s.totalShardsAvailable + s.totalShards,
          levelTransition: { active: true, progress: 0 },
        }));
        setTimeout(() => {
          get().initLevel(state.level + 1);
          set({ levelTransition: { active: false, progress: 0 } });
        }, 1000);
      }
      return true;
    }
    return false;
  },

  checkBeamCollision: (playerPos: [number, number, number]) => {
    const state = get();
    for (const beam of state.lightBeams) {
      const dx = playerPos[0] - beam.position[0];
      const dz = playerPos[2] - beam.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      const angleToPlayer = Math.atan2(dz, dx);
      let angleDiff = Math.abs(angleToPlayer - beam.angle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      const beamWidth = 0.3;
      const effectiveWidth = beamWidth + (dist / beam.length) * 0.5;

      if (dist < beam.length && angleDiff < effectiveWidth) {
        playHitSound();
        get().addParticles(playerPos, '#ff0000', 30);
        get().setScreenFlash(true, '#ff0000', 0.8);
        setTimeout(() => get().setScreenFlash(false, '', 0), 300);
        return true;
      }
    }
    return false;
  },

  resetPlayerToStart: () => {
    const startPos = get().getCurrentStartPosition();
    set({ playerPosition: startPos });
  },

  updateBeams: (delta: number) => {
    set((state) => ({
      lightBeams: state.lightBeams.map((beam) => ({
        ...beam,
        angle: beam.angle + beam.rotationSpeed * beam.rotationDirection * delta,
      })),
    }));
  },

  addParticles: (position: [number, number, number], color: string, count: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: particleIdCounter++,
        position: [...position] as [number, number, number],
        velocity: [
          Math.cos(angle) * speed,
          Math.random() * 3 + 1,
          Math.sin(angle) * speed,
        ],
        life: 1,
        color,
        size: 0.05 + Math.random() * 0.1,
      });
    }
    set((state) => ({
      particles: [...state.particles, ...newParticles],
    }));
  },

  updateParticles: (delta: number) => {
    set((state) => ({
      particles: state.particles
        .map((p) => ({
          ...p,
          position: [
            p.position[0] + p.velocity[0] * delta,
            p.position[1] + p.velocity[1] * delta,
            p.position[2] + p.velocity[2] * delta,
          ],
          velocity: [
            p.velocity[0] * 0.98,
            p.velocity[1] - 9.8 * delta,
            p.velocity[2] * 0.98,
          ],
          life: p.life - delta * 2,
        }))
        .filter((p) => p.life > 0),
    }));
  },

  updateElapsedTime: () => {
    if (!get().isGameComplete && !get().isPaused) {
      set((state) => ({
        elapsedTime: (Date.now() - state.startTime) / 1000,
      }));
    }
  },

  setScreenFlash: (active: boolean, color: string, intensity: number) => {
    set({ screenFlash: { active, color, intensity } });
  },

  setLevelTransition: (active: boolean, progress: number) => {
    set({ levelTransition: { active, progress } });
  },

  getCurrentStartPosition: () => {
    const config = LEVEL_CONFIGS[get().level];
    return [
      (0 - config.size / 2 + 0.5) * CELL_SIZE,
      0.5,
      (0 - config.size / 2 + 0.5) * CELL_SIZE,
    ];
  },
}));
