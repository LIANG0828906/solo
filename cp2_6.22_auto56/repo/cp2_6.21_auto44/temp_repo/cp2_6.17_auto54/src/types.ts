export interface HexCoord {
  q: number;
  r: number;
}

export interface Position {
  x: number;
  y: number;
}

export type SkillType = 'slow' | 'shockwave';

export interface Skill {
  id: SkillType;
  name: string;
  key: string;
  cooldown: number;
  currentCooldown: number;
  energyCost: number;
  description: string;
  color: string;
}

export interface Player {
  id: string;
  emoji: string;
  name: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  position: HexCoord;
  displayPosition: Position;
  skills: Skill[];
  isMoving: boolean;
  movePath: HexCoord[];
  moveProgress: number;
  moveStartTime: number;
  slowedUntil: number;
  speed: number;
}

export interface Obstacle {
  id: string;
  position: HexCoord;
  radius: number;
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  initialSize: number;
}

export interface Projectile {
  id: string;
  type: 'shockwave';
  startPos: Position;
  endPos: Position;
  progress: number;
  duration: number;
  startTime: number;
  color: string;
  width: number;
}

export interface CombatLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'move' | 'attack' | 'skill' | 'damage' | 'defeat';
}

export interface GameState {
  players: Player[];
  currentPlayerId: string | null;
  turn: number;
  turnDuration: number;
  turnStartTime: number;
  obstacles: Obstacle[];
  particles: Particle[];
  projectiles: Projectile[];
  combatLogs: CombatLog[];
  boardSize: number;
  hexRadius: number;
  gameStatus: 'waiting' | 'playing' | 'ended';
  winnerId: string | null;
  countdown: number;
}

export interface AStarNode {
  hex: HexCoord;
  parent: AStarNode | null;
  g: number;
  h: number;
  f: number;
}

export const SKILL_PRESETS: Record<SkillType, Omit<Skill, 'currentCooldown'>> = {
  slow: {
    id: 'slow',
    name: '寒冰领域',
    key: 'Q',
    cooldown: 5,
    energyCost: 25,
    description: '以自身为中心，半径2格内的敌人减速50%，持续3秒',
    color: '#3498DB',
  },
  shockwave: {
    id: 'shockwave',
    name: '冲击波',
    key: 'E',
    cooldown: 7,
    energyCost: 35,
    description: '沿鼠标方向释放直线冲击波，穿透5格，击退敌人2格',
    color: '#E74C3C',
  },
};

export const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export const MAX_COMBAT_LOGS = 100;
export const MAX_PARTICLES = 150;
export const PARTICLE_LIFETIME = 500;
export const MOVE_DURATION_PER_HEX = 300;
