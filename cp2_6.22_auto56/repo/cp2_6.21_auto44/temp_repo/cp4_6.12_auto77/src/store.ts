import { create } from 'zustand';

export type PartType = 'engine' | 'shield' | 'weapon' | 'armor';
export type GamePhase = 'menu' | 'planning' | 'battle' | 'result' | 'workshop';
export type AIStrategy = 'flank' | 'frontal' | 'surround';
export type Grade = 'S' | 'A' | 'B' | 'C';

export interface Point {
  x: number;
  y: number;
}

export interface ShipPart {
  id: string;
  name: string;
  type: PartType;
  attackBonus: number;
  defenseBonus: number;
  speedBonus: number;
  energyBonus: number;
  icon: string;
}

export interface AttackTarget {
  pointIndex: number;
  targetX: number;
  targetY: number;
}

export interface EnemyConfig {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface Mission {
  id: string;
  name: string;
  theme: string;
  aiStrategy: AIStrategy;
  description: string;
  enemies: EnemyConfig[];
}

export interface BattleResultData {
  kills: number;
  damagePercent: number;
  duration: number;
  grade: Grade;
  unlockedParts: ShipPart[];
}

export interface ShipStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  energy: number;
}

export const MISSIONS: Mission[] = [
  {
    id: 'm1',
    name: '猩红星域',
    theme: 'red',
    aiStrategy: 'flank',
    description: '敌人擅长绕后偷袭，注意保护侧翼！',
    enemies: [
      { maxHp: 80, attack: 12, defense: 5, speed: 3 },
      { maxHp: 60, attack: 10, defense: 4, speed: 4 },
    ],
  },
  {
    id: 'm2',
    name: '深蓝星域',
    theme: 'blue',
    aiStrategy: 'frontal',
    description: '敌人正面火力凶猛，正面硬刚需谨慎！',
    enemies: [
      { maxHp: 150, attack: 20, defense: 10, speed: 2 },
    ],
  },
  {
    id: 'm3',
    name: '翡翠星域',
    theme: 'green',
    aiStrategy: 'surround',
    description: '敌人多方位包围，注意各方向防御！',
    enemies: [
      { maxHp: 60, attack: 10, defense: 4, speed: 3 },
      { maxHp: 60, attack: 10, defense: 4, speed: 3 },
      { maxHp: 60, attack: 10, defense: 4, speed: 3 },
    ],
  },
];

const INITIAL_PARTS: ShipPart[] = [
  { id: 'p1', name: '基础引擎', type: 'engine', attackBonus: 0, defenseBonus: 0, speedBonus: 5, energyBonus: 0, icon: '🔧' },
  { id: 'p2', name: '基础护盾', type: 'shield', attackBonus: 0, defenseBonus: 3, speedBonus: 0, energyBonus: 0, icon: '🛡️' },
  { id: 'p3', name: '基础武器', type: 'weapon', attackBonus: 4, defenseBonus: 0, speedBonus: 0, energyBonus: 0, icon: '⚔️' },
  { id: 'p4', name: '基础装甲', type: 'armor', attackBonus: 0, defenseBonus: 0, speedBonus: 0, energyBonus: 5, icon: '🔩' },
];

export const UNLOCKABLE_PARTS: ShipPart[] = [
  { id: 'p5', name: '离子引擎', type: 'engine', attackBonus: 0, defenseBonus: 0, speedBonus: 10, energyBonus: 2, icon: '⚡' },
  { id: 'p6', name: '等离子护盾', type: 'shield', attackBonus: 0, defenseBonus: 8, speedBonus: 0, energyBonus: 3, icon: '🔰' },
  { id: 'p7', name: '激光炮', type: 'weapon', attackBonus: 10, defenseBonus: 0, speedBonus: 0, energyBonus: 0, icon: '🔥' },
  { id: 'p8', name: '钛合金装甲', type: 'armor', attackBonus: 0, defenseBonus: 2, speedBonus: 0, energyBonus: 12, icon: '💎' },
  { id: 'p9', name: '量子引擎', type: 'engine', attackBonus: 0, defenseBonus: 0, speedBonus: 15, energyBonus: 5, icon: '🌀' },
  { id: 'p10', name: '屏障矩阵', type: 'shield', attackBonus: 0, defenseBonus: 15, speedBonus: 0, energyBonus: 5, icon: '✨' },
  { id: 'p11', name: '电磁炮', type: 'weapon', attackBonus: 15, defenseBonus: 0, speedBonus: 0, energyBonus: 3, icon: '💥' },
  { id: 'p12', name: '纳米装甲', type: 'armor', attackBonus: 0, defenseBonus: 5, speedBonus: 0, energyBonus: 20, icon: '🔮' },
];

const BASE_STATS: ShipStats = {
  maxHp: 100,
  attack: 10,
  defense: 5,
  speed: 3,
  energy: 10,
};

function computeStats(base: ShipStats, equipped: Record<PartType, ShipPart | null>): ShipStats {
  let attack = base.attack;
  let defense = base.defense;
  let speed = base.speed;
  let energy = base.energy;
  let maxHp = base.maxHp;
  for (const part of Object.values(equipped)) {
    if (part) {
      attack += part.attackBonus;
      defense += part.defenseBonus;
      speed += part.speedBonus;
      energy += part.energyBonus;
    }
  }
  maxHp += energy * 2;
  return { maxHp, attack, defense, speed, energy };
}

interface GameState {
  gamePhase: GamePhase;
  baseStats: ShipStats;
  playerStats: ShipStats;
  equippedParts: Record<PartType, ShipPart | null>;
  partsInventory: ShipPart[];
  currentMission: Mission | null;
  pathPoints: Point[];
  attackTargets: AttackTarget[];
  battleResult: BattleResultData | null;
  playerHp: number;

  setGamePhase: (phase: GamePhase) => void;
  selectMission: (mission: Mission) => void;
  setPathPoints: (points: Point[]) => void;
  addPathPoint: (point: Point) => void;
  updatePathPoint: (index: number, point: Point) => void;
  removePathPoint: (index: number) => void;
  setAttackTargets: (targets: AttackTarget[]) => void;
  addAttackTarget: (target: AttackTarget) => void;
  removeAttackTarget: (pointIndex: number) => void;
  startBattle: () => void;
  endBattle: (result: BattleResultData) => void;
  equipPart: (part: ShipPart) => void;
  unequipPart: (partType: PartType) => void;
  resetBattle: () => void;
  resetPathPlan: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  gamePhase: 'menu',
  baseStats: { ...BASE_STATS },
  playerStats: computeStats(BASE_STATS, { engine: null, shield: null, weapon: null, armor: null }),
  equippedParts: { engine: null, shield: null, weapon: null, armor: null },
  partsInventory: [...INITIAL_PARTS],
  currentMission: null,
  pathPoints: [],
  attackTargets: [],
  battleResult: null,
  playerHp: BASE_STATS.maxHp,

  setGamePhase: (phase) => set({ gamePhase: phase }),

  selectMission: (mission) => set({
    currentMission: mission,
    gamePhase: 'planning',
    pathPoints: [{ x: 600, y: 650 }],
    attackTargets: [],
    battleResult: null,
  }),

  setPathPoints: (points) => set({ pathPoints: points }),

  addPathPoint: (point) => set((s) => ({ pathPoints: [...s.pathPoints, point] })),

  updatePathPoint: (index, point) => set((s) => {
    const pts = [...s.pathPoints];
    if (index >= 0 && index < pts.length) pts[index] = point;
    return { pathPoints: pts };
  }),

  removePathPoint: (index) => set((s) => ({
    pathPoints: s.pathPoints.filter((_, i) => i !== index),
    attackTargets: s.attackTargets.filter((t) => t.pointIndex !== index).map((t) => ({
      ...t,
      pointIndex: t.pointIndex > index ? t.pointIndex - 1 : t.pointIndex,
    })),
  })),

  setAttackTargets: (targets) => set({ attackTargets: targets }),

  addAttackTarget: (target) => set((s) => {
    const filtered = s.attackTargets.filter((t) => t.pointIndex !== target.pointIndex);
    return { attackTargets: [...filtered, target] };
  }),

  removeAttackTarget: (pointIndex) => set((s) => ({
    attackTargets: s.attackTargets.filter((t) => t.pointIndex !== pointIndex),
  })),

  startBattle: () => {
    const stats = get().playerStats;
    set({ gamePhase: 'battle', playerHp: stats.maxHp });
  },

  endBattle: (result) => set((s) => {
    const newInventory = [...s.partsInventory];
    for (const part of result.unlockedParts) {
      if (!newInventory.find((p) => p.id === part.id)) {
        newInventory.push(part);
      }
    }
    return {
      gamePhase: 'result',
      battleResult: result,
      partsInventory: newInventory,
    };
  }),

  equipPart: (part) => set((s) => {
    const currentEquipped = s.equippedParts[part.type];
    const newEquipped = { ...s.equippedParts, [part.type]: part };
    const newStats = computeStats(s.baseStats, newEquipped);
    return {
      equippedParts: newEquipped,
      playerStats: newStats,
    };
  }),

  unequipPart: (partType) => set((s) => {
    const newEquipped = { ...s.equippedParts, [partType]: null };
    const newStats = computeStats(s.baseStats, newEquipped);
    return {
      equippedParts: newEquipped,
      playerStats: newStats,
    };
  }),

  resetBattle: () => set({
    gamePhase: 'menu',
    pathPoints: [],
    attackTargets: [],
    battleResult: null,
  }),

  resetPathPlan: () => set({
    pathPoints: [{ x: 600, y: 650 }],
    attackTargets: [],
  }),
}));
