import { create } from 'zustand';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Player {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

export interface Pulse {
  id: number;
  x: number;
  y: number;
  angle: number;
  startTime: number;
  duration: number;
  arcs: PulseArc[];
}

export interface PulseArc {
  points: Vector2[];
  color: string;
  alpha: number;
  radius: number;
}

export interface EchoPoint {
  id: number;
  x: number;
  y: number;
  distance: number;
  startTime: number;
  duration: number;
  brightness: number;
}

export interface Crystal {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  rotation: number;
}

export interface Enemy {
  id: number;
  patrolPath: Vector2[];
  currentPathIndex: number;
  x: number;
  y: number;
  rotation: number;
  speed: number;
  blinded: boolean;
  blindEndTime: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  startTime: number;
  duration: number;
  size: number;
  colorStart: string;
  colorEnd: string;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory' | 'levelComplete';

export interface LevelData {
  walls: Wall[];
  crystals: Crystal[];
  enemies: Enemy[];
  exit: Vector2;
  startPos: Vector2;
  darkness: number;
  width: number;
  height: number;
}

export interface GameStore {
  player: Player;
  pulses: Pulse[];
  echoPoints: EchoPoint[];
  crystals: Crystal[];
  enemies: Enemy[];
  particles: Particle[];
  exit: Vector2;
  levelData: LevelData | null;
  levelIndex: number;
  totalLevels: number;
  collectedCount: number;
  crystalsRequired: number;
  exitOpen: boolean;
  gameState: GameState;
  lastPulseTime: number;
  highFrequencyActive: boolean;
  highFrequencyEndTime: number;
  highFrequencyCooldownEnd: number;

  movePlayer: (dx: number, dy: number) => void;
  setPlayerAngle: (angle: number) => void;
  emitPulse: (highFrequency?: boolean) => boolean;
  collectCrystal: (id: number) => void;
  addEchoPoint: (x: number, y: number, distance: number) => void;
  addParticles: (x: number, y: number, count: number, colorStart: string, colorEnd: string, duration: number) => void;
  updateEnemies: (time: number) => void;
  setEnemyBlinded: (id: number, untilTime: number) => void;
  setGameState: (state: GameState) => void;
  loadLevel: (index: number) => void;
  resetGame: () => void;
  checkGameOver: (time: number) => void;
  advanceLevel: () => void;
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

function createLevel(index: number): LevelData {
  if (index === 0) return createLevel1();
  if (index === 1) return createLevel2();
  return createLevel3();
}

function createLevel1(): LevelData {
  const walls: Wall[] = [];
  const w = CANVAS_WIDTH, h = CANVAS_HEIGHT;
  const t = 6;

  walls.push({ x1: t, y1: t, x2: w - t, y2: t });
  walls.push({ x1: w - t, y1: t, x2: w - t, y2: h - t });
  walls.push({ x1: w - t, y1: h - t, x2: t, y2: h - t });
  walls.push({ x1: t, y1: h - t, x2: t, y2: t });

  walls.push({ x1: 200, y1: 150, x2: 200, y2: 400 });
  walls.push({ x1: 200, y1: 400, x2: 450, y2: 400 });
  walls.push({ x1: 450, y1: 250, x2: 450, y2: 500 });
  walls.push({ x1: 450, y1: 250, x2: 700, y2: 250 });
  walls.push({ x1: 700, y1: 100, x2: 700, y2: 350 });
  walls.push({ x1: 700, y1: 500, x2: 900, y2: 500 });
  walls.push({ x1: 900, y1: 350, x2: 900, y2: 700 });
  walls.push({ x1: 900, y1: 700, x2: 1200, y2: 700 });
  walls.push({ x1: 1100, y1: 200, x2: 1100, y2: 500 });
  walls.push({ x1: 1100, y1: 200, x2: 1400, y2: 200 });
  walls.push({ x1: 1300, y1: 400, x2: 1300, y2: 700 });
  walls.push({ x1: 1300, y1: 700, x2: 1500, y2: 700 });
  walls.push({ x1: 300, y1: 600, x2: 600, y2: 600 });
  walls.push({ x1: 600, y1: 600, x2: 600, y2: 800 });

  const crystals: Crystal[] = [
    { id: 1, x: 120, y: 250, collected: false, rotation: 0 },
    { id: 2, x: 330, y: 320, collected: false, rotation: 0 },
    { id: 3, x: 580, y: 180, collected: false, rotation: 0 },
    { id: 4, x: 800, y: 430, collected: false, rotation: 0 },
    { id: 5, x: 560, y: 550, collected: false, rotation: 0 },
    { id: 6, x: 1000, y: 600, collected: false, rotation: 0 },
    { id: 7, x: 1250, y: 350, collected: false, rotation: 0 },
    { id: 8, x: 1450, y: 320, collected: false, rotation: 0 },
    { id: 9, x: 1400, y: 600, collected: false, rotation: 0 },
    { id: 10, x: 430, y: 720, collected: false, rotation: 0 },
  ];

  const enemies: Enemy[] = [
    {
      id: 1,
      patrolPath: [
        { x: 300, y: 500 }, { x: 300, y: 750 }, { x: 550, y: 750 }, { x: 550, y: 500 }
      ],
      currentPathIndex: 0,
      x: 300, y: 500,
      rotation: 0,
      speed: 40,
      blinded: false,
      blindEndTime: 0
    },
    {
      id: 2,
      patrolPath: [
        { x: 800, y: 200 }, { x: 1050, y: 200 }, { x: 1050, y: 400 }, { x: 800, y: 400 }
      ],
      currentPathIndex: 0,
      x: 800, y: 200,
      rotation: 0,
      speed: 40,
      blinded: false,
      blindEndTime: 0
    }
  ];

  return {
    walls,
    crystals,
    enemies,
    exit: { x: 1500, y: 800 },
    startPos: { x: 100, y: 100 },
    darkness: 0.85,
    width: w,
    height: h
  };
}

function createLevel2(): LevelData {
  const walls: Wall[] = [];
  const w = CANVAS_WIDTH, h = CANVAS_HEIGHT;
  const t = 6;

  walls.push({ x1: t, y1: t, x2: w - t, y2: t });
  walls.push({ x1: w - t, y1: t, x2: w - t, y2: h - t });
  walls.push({ x1: w - t, y1: h - t, x2: t, y2: h - t });
  walls.push({ x1: t, y1: h - t, x2: t, y2: t });

  walls.push({ x1: 150, y1: 0, x2: 150, y2: 600 });
  walls.push({ x1: 150, y1: 600, x2: 350, y2: 600 });
  walls.push({ x1: 350, y1: 300, x2: 350, y2: 900 });
  walls.push({ x1: 350, y1: 300, x2: 600, y2: 300 });
  walls.push({ x1: 600, y1: 100, x2: 600, y2: 500 });
  walls.push({ x1: 600, y1: 100, x2: 850, y2: 100 });
  walls.push({ x1: 850, y1: 100, x2: 850, y2: 400 });
  walls.push({ x1: 850, y1: 400, x2: 1100, y2: 400 });
  walls.push({ x1: 1100, y1: 200, x2: 1100, y2: 600 });
  walls.push({ x1: 1100, y1: 200, x2: 1350, y2: 200 });
  walls.push({ x1: 1350, y1: 0, x2: 1350, y2: 400 });
  walls.push({ x1: 1350, y1: 600, x2: 1350, y2: 900 });
  walls.push({ x1: 600, y1: 700, x2: 600, y2: 900 });
  walls.push({ x1: 600, y1: 700, x2: 900, y2: 700 });
  walls.push({ x1: 900, y1: 600, x2: 900, y2: 900 });
  walls.push({ x1: 900, y1: 600, x2: 1100, y2: 600 });

  const crystals: Crystal[] = [
    { id: 1, x: 80, y: 400, collected: false, rotation: 0 },
    { id: 2, x: 260, y: 750, collected: false, rotation: 0 },
    { id: 3, x: 480, y: 200, collected: false, rotation: 0 },
    { id: 4, x: 480, y: 600, collected: false, rotation: 0 },
    { id: 5, x: 730, y: 260, collected: false, rotation: 0 },
    { id: 6, x: 1000, y: 300, collected: false, rotation: 0 },
    { id: 7, x: 750, y: 800, collected: false, rotation: 0 },
    { id: 8, x: 1220, y: 500, collected: false, rotation: 0 },
    { id: 9, x: 1450, y: 300, collected: false, rotation: 0 },
    { id: 10, x: 1450, y: 700, collected: false, rotation: 0 },
  ];

  const enemies: Enemy[] = [
    {
      id: 1,
      patrolPath: [
        { x: 480, y: 450 }, { x: 480, y: 750 }, { x: 750, y: 750 }, { x: 750, y: 450 }
      ],
      currentPathIndex: 0,
      x: 480, y: 450,
      rotation: 0,
      speed: 40,
      blinded: false,
      blindEndTime: 0
    },
    {
      id: 2,
      patrolPath: [
        { x: 730, y: 220 }, { x: 1000, y: 220 }, { x: 1000, y: 350 }, { x: 730, y: 350 }
      ],
      currentPathIndex: 0,
      x: 730, y: 220,
      rotation: 0,
      speed: 40,
      blinded: false,
      blindEndTime: 0
    },
    {
      id: 3,
      patrolPath: [
        { x: 1230, y: 300 }, { x: 1230, y: 750 }
      ],
      currentPathIndex: 0,
      x: 1230, y: 300,
      rotation: 0,
      speed: 40,
      blinded: false,
      blindEndTime: 0
    }
  ];

  return {
    walls,
    crystals,
    enemies,
    exit: { x: 1500, y: 100 },
    startPos: { x: 80, y: 80 },
    darkness: 0.90,
    width: w,
    height: h
  };
}

function createLevel3(): LevelData {
  const walls: Wall[] = [];
  const w = CANVAS_WIDTH, h = CANVAS_HEIGHT;
  const t = 6;

  walls.push({ x1: t, y1: t, x2: w - t, y2: t });
  walls.push({ x1: w - t, y1: t, x2: w - t, y2: h - t });
  walls.push({ x1: w - t, y1: h - t, x2: t, y2: h - t });
  walls.push({ x1: t, y1: h - t, x2: t, y2: t });

  walls.push({ x1: 200, y1: 100, x2: 200, y2: 350 });
  walls.push({ x1: 100, y1: 400, x2: 400, y2: 400 });
  walls.push({ x1: 400, y1: 200, x2: 400, y2: 600 });
  walls.push({ x1: 400, y1: 200, x2: 600, y2: 200 });
  walls.push({ x1: 600, y1: 50, x2: 600, y2: 400 });
  walls.push({ x1: 600, y1: 550, x2: 600, y2: 850 });
  walls.push({ x1: 600, y1: 550, x2: 850, y2: 550 });
  walls.push({ x1: 850, y1: 300, x2: 850, y2: 800 });
  walls.push({ x1: 850, y1: 300, x2: 1050, y2: 300 });
  walls.push({ x1: 1050, y1: 100, x2: 1050, y2: 500 });
  walls.push({ x1: 1050, y1: 100, x2: 1300, y2: 100 });
  walls.push({ x1: 1300, y1: 0, x2: 1300, y2: 350 });
  walls.push({ x1: 1300, y1: 450, x2: 1300, y2: 900 });
  walls.push({ x1: 1050, y1: 650, x2: 1050, y2: 900 });
  walls.push({ x1: 1050, y1: 650, x2: 1300, y2: 650 });
  walls.push({ x1: 200, y1: 600, x2: 200, y2: 850 });
  walls.push({ x1: 200, y1: 600, x2: 400, y2: 600 });
  walls.push({ x1: 200, y1: 850, x2: 450, y2: 850 });
  walls.push({ x1: 450, y1: 700, x2: 450, y2: 850 });

  const crystals: Crystal[] = [
    { id: 1, x: 100, y: 250, collected: false, rotation: 0 },
    { id: 2, x: 300, y: 300, collected: false, rotation: 0 },
    { id: 3, x: 500, y: 120, collected: false, rotation: 0 },
    { id: 4, x: 500, y: 500, collected: false, rotation: 0 },
    { id: 5, x: 730, y: 300, collected: false, rotation: 0 },
    { id: 6, x: 730, y: 700, collected: false, rotation: 0 },
    { id: 7, x: 950, y: 420, collected: false, rotation: 0 },
    { id: 8, x: 1180, y: 250, collected: false, rotation: 0 },
    { id: 9, x: 1180, y: 750, collected: false, rotation: 0 },
    { id: 10, x: 1450, y: 500, collected: false, rotation: 0 },
  ];

  const enemies: Enemy[] = [
    {
      id: 1,
      patrolPath: [
        { x: 300, y: 700 }, { x: 300, y: 770 }, { x: 380, y: 770 }, { x: 380, y: 700 }
      ],
      currentPathIndex: 0,
      x: 300, y: 700,
      rotation: 0,
      speed: 40,
      blinded: false,
      blindEndTime: 0
    },
    {
      id: 2,
      patrolPath: [
        { x: 730, y: 100 }, { x: 950, y: 100 }, { x: 950, y: 250 }, { x: 730, y: 250 }
      ],
      currentPathIndex: 0,
      x: 730, y: 100,
      rotation: 0,
      speed: 40,
      blinded: false,
      blindEndTime: 0
    },
    {
      id: 3,
      patrolPath: [
        { x: 1180, y: 400 }, { x: 1180, y: 580 }
      ],
      currentPathIndex: 0,
      x: 1180, y: 400,
      rotation: 0,
      speed: 40,
      blinded: false,
      blindEndTime: 0
    }
  ];

  return {
    walls,
    crystals,
    enemies,
    exit: { x: 1500, y: 450 },
    startPos: { x: 80, y: 80 },
    darkness: 0.95,
    width: w,
    height: h
  };
}

let pulseIdCounter = 0;
let echoIdCounter = 0;
let particleIdCounter = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  player: { x: 100, y: 100, angle: 0, speed: 150 },
  pulses: [],
  echoPoints: [],
  crystals: [],
  enemies: [],
  particles: [],
  exit: { x: 1500, y: 800 },
  levelData: null,
  levelIndex: 0,
  totalLevels: 3,
  collectedCount: 0,
  crystalsRequired: 10,
  exitOpen: false,
  gameState: 'menu',
  lastPulseTime: 0,
  highFrequencyActive: false,
  highFrequencyEndTime: 0,
  highFrequencyCooldownEnd: 0,

  movePlayer: (dx: number, dy: number) => {
    const state = get();
    const { levelData } = state;
    if (!levelData) return;

    let newX = state.player.x + dx;
    let newY = state.player.y + dy;
    const playerRadius = 12;

    newX = Math.max(playerRadius, Math.min(levelData.width - playerRadius, newX));
    newY = Math.max(playerRadius, Math.min(levelData.height - playerRadius, newY));

    for (const wall of levelData.walls) {
      if (circleLineIntersect(newX, state.player.y, playerRadius, wall.x1, wall.y1, wall.x2, wall.y2)) {
        newX = state.player.x;
      }
      if (circleLineIntersect(newX, newY, playerRadius, wall.x1, wall.y1, wall.x2, wall.y2)) {
        newY = state.player.y;
      }
    }

    if (dx !== 0 || dy !== 0) {
      const angle = Math.atan2(dy, dx);
      set({ player: { ...state.player, x: newX, y: newY, angle } });
    }
  },

  setPlayerAngle: (angle: number) => {
    set(state => ({ player: { ...state.player, angle } }));
  },

  emitPulse: (highFrequency = false) => {
    const state = get();
    const now = performance.now();

    if (highFrequency) {
      if (now < state.highFrequencyCooldownEnd) return false;
      if (state.highFrequencyActive) return false;
      set({
        highFrequencyActive: true,
        highFrequencyEndTime: now + 500,
        highFrequencyCooldownEnd: now + 1500
      });
    } else {
      if (now - state.lastPulseTime < 300) return false;
      set({ lastPulseTime: now });
    }

    const { player } = state;
    const fanAngle = Math.PI * 2 / 3;
    const numArcs = 5;
    const pointsPerArc = 30;
    const duration = highFrequency ? 800 : 600;

    const arcs: PulseArc[] = [];
    const colors = ['#00FFAA', '#00EEBB', '#00CCCC', '#00AADD', '#0044FF'];
    const alphas = [0.8, 0.65, 0.5, 0.35, 0.2];

    for (let i = 0; i < numArcs; i++) {
      const points: Vector2[] = [];
      const radius = ((i + 1) / numArcs) * (highFrequency ? 400 : 500);
      for (let j = 0; j <= pointsPerArc; j++) {
        const t = j / pointsPerArc;
        const angle = player.angle - fanAngle / 2 + fanAngle * t;
        points.push({
          x: player.x + Math.cos(angle) * radius,
          y: player.y + Math.sin(angle) * radius
        });
      }
      arcs.push({
        points,
        color: colors[i],
        alpha: alphas[i],
        radius
      });
    }

    const pulse: Pulse = {
      id: ++pulseIdCounter,
      x: player.x,
      y: player.y,
      angle: player.angle,
      startTime: now,
      duration,
      arcs
    };

    set(state => ({ pulses: [...state.pulses, pulse] }));

    setTimeout(() => {
      set(state => ({ pulses: state.pulses.filter(p => p.id !== pulse.id) }));
    }, duration + 100);

    return true;
  },

  collectCrystal: (id: number) => {
    const state = get();
    const crystal = state.crystals.find(c => c.id === id);
    if (!crystal || crystal.collected) return;

    state.addParticles(crystal.x, crystal.y, 20, '#FFD700', '#FF6600', 300);

    const newCount = state.collectedCount + 1;
    set({
      crystals: state.crystals.map(c => c.id === id ? { ...c, collected: true } : c),
      collectedCount: newCount,
      exitOpen: newCount >= state.crystalsRequired
    });
  },

  addEchoPoint: (x: number, y: number, distance: number) => {
    const now = performance.now();
    const echoPoint: EchoPoint = {
      id: ++echoIdCounter,
      x, y, distance,
      startTime: now,
      duration: 1200,
      brightness: Math.max(0.3, Math.min(1.0, 1.0 - distance / 500))
    };

    set(state => ({ echoPoints: [...state.echoPoints, echoPoint] }));

    setTimeout(() => {
      set(state => ({ echoPoints: state.echoPoints.filter(e => e.id !== echoPoint.id) }));
    }, 1300);
  },

  addParticles: (x: number, y: number, count: number, colorStart: string, colorEnd: string, duration: number) => {
    const now = performance.now();
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 50 + Math.random() * 80;
      particles.push({
        id: ++particleIdCounter,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        startTime: now,
        duration,
        size: 2 + Math.random() * 2,
        colorStart,
        colorEnd
      });
    }

    set(state => ({ particles: [...state.particles, ...particles] }));

    setTimeout(() => {
      const ids = new Set(particles.map(p => p.id));
      set(state => ({ particles: state.particles.filter(p => !ids.has(p.id)) }));
    }, duration + 100);
  },

  updateEnemies: (time: number) => {
    const state = get();
    const { enemies, levelData } = state;
    if (!levelData) return;

    const updatedEnemies = enemies.map(enemy => {
      if (enemy.blinded) {
        if (time >= enemy.blindEndTime) {
          return { ...enemy, blinded: false, rotation: 0 };
        }
        return { ...enemy, rotation: enemy.rotation + 0.1 };
      }

      let { x, y, currentPathIndex, rotation } = enemy;
      const target = enemy.patrolPath[currentPathIndex];
      const dx = target.x - x;
      const dy = target.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        currentPathIndex = (currentPathIndex + 1) % enemy.patrolPath.length;
      } else {
        const moveSpeed = enemy.speed / 60;
        x += (dx / dist) * moveSpeed;
        y += (dy / dist) * moveSpeed;
      }

      rotation += 0.05;
      return { ...enemy, x, y, currentPathIndex, rotation };
    });

    set({ enemies: updatedEnemies });

    if (state.highFrequencyActive && time < state.highFrequencyEndTime) {
      for (const enemy of updatedEnemies) {
        if (enemy.blinded) continue;
        const dx = enemy.x - state.player.x;
        const dy = enemy.y - state.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 350) {
          set(s => ({
            enemies: s.enemies.map(e =>
              e.id === enemy.id ? { ...e, blinded: true, blindEndTime: time + 3000 } : e
            )
          }));
        }
      }
    }
  },

  setEnemyBlinded: (id: number, untilTime: number) => {
    set(state => ({
      enemies: state.enemies.map(e =>
        e.id === id ? { ...e, blinded: true, blindEndTime: untilTime } : e
      )
    }));
  },

  setGameState: (gameState: GameState) => set({ gameState }),

  loadLevel: (index: number) => {
    const levelData = createLevel(index);
    const crystals = levelData.crystals.map(c => ({ ...c, collected: false }));
    const enemies = levelData.enemies.map(e => ({
      ...e,
      x: e.patrolPath[0].x,
      y: e.patrolPath[0].y,
      blinded: false,
      currentPathIndex: 0
    }));

    set({
      levelData,
      crystals,
      enemies,
      exit: levelData.exit,
      levelIndex: index,
      collectedCount: 0,
      exitOpen: false,
      player: {
        x: levelData.startPos.x,
        y: levelData.startPos.y,
        angle: 0,
        speed: 150
      },
      pulses: [],
      echoPoints: [],
      particles: [],
      gameState: 'playing',
      lastPulseTime: 0,
      highFrequencyActive: false,
      highFrequencyEndTime: 0,
      highFrequencyCooldownEnd: 0
    });
  },

  resetGame: () => {
    set({
      pulses: [],
      echoPoints: [],
      particles: [],
      gameState: 'menu',
      levelIndex: 0,
      collectedCount: 0,
      exitOpen: false
    });
  },

  checkGameOver: (time: number) => {
    const state = get();
    const { player, enemies, gameState } = state;
    if (gameState !== 'playing') return;

    for (const enemy of enemies) {
      if (enemy.blinded) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 22) {
        set({ gameState: 'gameover' });
        return;
      }
    }
  },

  advanceLevel: () => {
    const state = get();
    if (state.levelIndex + 1 >= state.totalLevels) {
      set({ gameState: 'victory' });
    } else {
      set({ gameState: 'levelComplete' });
    }
  }
}));

function circleLineIntersect(cx: number, cy: number, r: number, x1: number, y1: number, x2: number, y2: number): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = ((cx - x1) * dx + (cy - y1) * dy) / (lenSq || 1);
  t = Math.max(0, Math.min(1, t));
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  const distX = cx - closestX;
  const distY = cy - closestY;
  return distX * distX + distY * distY < r * r;
}

export { CANVAS_WIDTH, CANVAS_HEIGHT };
