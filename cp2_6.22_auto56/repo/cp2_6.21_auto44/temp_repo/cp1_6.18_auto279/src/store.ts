import { create } from 'zustand';
import type { Ship, Asteroid, Ore, Meteor, Particle, Star, Keys } from './gameLogic';
import {
  createAsteroids,
  createStars,
  createOres,
  createMeteor,
  createParticles,
  updateShip,
  updateAsteroids,
  updateOres,
  updateMeteors,
  updateParticles,
  checkShipMeteorCollision,
  getOreScore,
} from './gameLogic';

interface GameStore {
  ship: Ship;
  asteroids: Asteroid[];
  ores: Ore[];
  meteors: Meteor[];
  particles: Particle[];
  stars: Star[];
  score: number;
  timeRemaining: number;
  isGameOver: boolean;
  isPlaying: boolean;
  oreCounts: { red: number; yellow: number; green: number; blue: number };
  keys: Keys;
  canvasWidth: number;
  canvasHeight: number;
  oreSpawnTimer: number;
  meteorSpawnTimer: number;
  nextOreId: number;
  nextMeteorId: number;
  setCanvasSize: (width: number, height: number) => void;
  setKey: (key: keyof Keys, value: boolean) => void;
  startGame: () => void;
  resetGame: () => void;
  tick: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ship: {
    x: 400,
    y: 300,
    angle: 0,
    velocity: { x: 0, y: 0 },
    shield: 100,
    maxShield: 100,
    gravityRadius: 40,
  },
  asteroids: [],
  ores: [],
  meteors: [],
  particles: [],
  stars: [],
  score: 0,
  timeRemaining: 120,
  isGameOver: false,
  isPlaying: false,
  oreCounts: { red: 0, yellow: 0, green: 0, blue: 0 },
  keys: {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  },
  canvasWidth: 800,
  canvasHeight: 600,
  oreSpawnTimer: 0,
  meteorSpawnTimer: 0,
  nextOreId: 0,
  nextMeteorId: 0,

  setCanvasSize: (width, height) => {
    set((state) => {
      if (!state.isPlaying && !state.isGameOver) {
        return {
          canvasWidth: width,
          canvasHeight: height,
          ship: {
            ...state.ship,
            x: width / 2,
            y: height / 2,
          },
        };
      }
      return { canvasWidth: width, canvasHeight: height };
    });
  },

  setKey: (key, value) => {
    set((state) => ({
      keys: { ...state.keys, [key]: value },
    }));
  },

  startGame: () => {
    get().resetGame();
    set({ isPlaying: true });
  },

  resetGame: () => {
    const { canvasWidth, canvasHeight } = get();
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const stars = createStars(canvasWidth, canvasHeight, 150);
    const asteroids = createAsteroids(30, centerX, centerY);
    const initialOres = createOres(0, 6, centerX, centerY);

    set({
      ship: {
        x: centerX,
        y: centerY,
        angle: 0,
        velocity: { x: 0, y: 0 },
        shield: 100,
        maxShield: 100,
        gravityRadius: 40,
      },
      asteroids,
      ores: initialOres,
      meteors: [],
      particles: [],
      stars,
      score: 0,
      timeRemaining: 120,
      isGameOver: false,
      isPlaying: false,
      oreCounts: { red: 0, yellow: 0, green: 0, blue: 0 },
      oreSpawnTimer: 0,
      meteorSpawnTimer: 0,
      nextOreId: 6,
      nextMeteorId: 0,
    });
  },

  tick: () => {
    const state = get();
    if (!state.isPlaying || state.isGameOver) return;

    const centerX = state.canvasWidth / 2;
    const centerY = state.canvasHeight / 2;

    let newShip = updateShip(
      state.ship,
      state.keys,
      state.canvasWidth,
      state.canvasHeight,
      1
    );

    const newAsteroids = updateAsteroids(state.asteroids, centerX, centerY);

    const { ores: updatedOres, collectedOres } = updateOres(state.ores, newShip);

    let newScore = state.score;
    const newOreCounts = { ...state.oreCounts };
    let newParticles = [...state.particles];

    for (const ore of collectedOres) {
      newScore += getOreScore(ore.colorType);
      newOreCounts[ore.colorType]++;
      const particles = createParticles(ore.x, ore.y, ore.color, 8);
      newParticles.push(...particles);
    }

    let newMeteors = updateMeteors(state.meteors, centerX, centerY);

    if (checkShipMeteorCollision(newShip, newMeteors)) {
      newShip = { ...newShip, shield: newShip.shield - 25 };
      newMeteors = newMeteors.filter((m: Meteor) => {
        const dx = newShip.x - m.x;
        const dy = newShip.y - m.y;
        return Math.sqrt(dx * dx + dy * dy) >= 15 + m.radius;
      });

      if (newShip.shield <= 0) {
        set({
          ship: { ...newShip, shield: 0 },
          isGameOver: true,
          isPlaying: false,
        });
        return;
      }
    }

    newParticles = updateParticles(newParticles);

    let newOreSpawnTimer = state.oreSpawnTimer + 1;
    let newNextOreId = state.nextOreId;
    let finalOres = updatedOres;

    if (newOreSpawnTimer >= 120 + Math.random() * 60) {
      const oreCount = 5 + Math.floor(Math.random() * 4);
      const newOres = createOres(newNextOreId, oreCount, centerX, centerY);
      finalOres = [...finalOres, ...newOres];
      newNextOreId += oreCount;
      newOreSpawnTimer = 0;
    }

    let newMeteorSpawnTimer = state.meteorSpawnTimer + 1;
    let newNextMeteorId = state.nextMeteorId;

    if (newMeteorSpawnTimer >= 180 + Math.random() * 120) {
      const meteor = createMeteor(newNextMeteorId, centerX, centerY);
      newMeteors = [...newMeteors, meteor];
      newNextMeteorId++;
      newMeteorSpawnTimer = 0;
    }

    const newTimeRemaining = state.timeRemaining - 1 / 60;

    if (newTimeRemaining <= 0) {
      set({
        timeRemaining: 0,
        isGameOver: true,
        isPlaying: false,
        ship: newShip,
        asteroids: newAsteroids,
        ores: finalOres,
        meteors: newMeteors,
        particles: newParticles,
        score: newScore,
        oreCounts: newOreCounts,
        oreSpawnTimer: newOreSpawnTimer,
        meteorSpawnTimer: newMeteorSpawnTimer,
        nextOreId: newNextOreId,
        nextMeteorId: newNextMeteorId,
      });
      return;
    }

    set({
      ship: newShip,
      asteroids: newAsteroids,
      ores: finalOres,
      meteors: newMeteors,
      particles: newParticles,
      score: newScore,
      timeRemaining: newTimeRemaining,
      oreCounts: newOreCounts,
      oreSpawnTimer: newOreSpawnTimer,
      meteorSpawnTimer: newMeteorSpawnTimer,
      nextOreId: newNextOreId,
      nextMeteorId: newNextMeteorId,
    });
  },
}));
