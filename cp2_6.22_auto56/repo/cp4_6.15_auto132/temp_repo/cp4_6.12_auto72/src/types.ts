export type ElementType = 'fire' | 'water' | 'grass' | 'normal';

export interface Skill {
  id: string;
  name: string;
  element: ElementType;
  power: number;
  accuracy: number;
  description: string;
}

export interface PetStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface EvolutionCondition {
  level: number;
  requiredItem?: string;
}

export interface PetTemplate {
  id: string;
  name: string;
  element: ElementType;
  baseStats: PetStats;
  skills: string[];
  evolution?: {
    to: string;
    condition: EvolutionCondition;
  };
  color: string;
  spriteData: number[][];
}

export interface Pet {
  id: string;
  templateId: string;
  name: string;
  level: number;
  exp: number;
  expToNext: number;
  stats: PetStats;
  skills: Skill[];
  element: ElementType;
  color: string;
  spriteData: number[][];
  x: number;
  y: number;
  direction: number;
  walkFrame: number;
  walkTimer: number;
  moveTargetX: number;
  moveTargetY: number;
  isMoving: boolean;
  moveSpeed: number;
}

export interface WildPet extends Pet {
  wanderTimer: number;
  wanderCooldown: number;
}

export interface BattleState {
  active: boolean;
  playerTeam: Pet[];
  currentPetIndex: number;
  enemy: Pet | null;
  turn: number;
  turnTimer: number;
  battleLog: string[];
  catching: boolean;
  catchAnimation: number;
  catchResult: 'success' | 'fail' | null;
  animationState: string | null;
  animationTimer: number;
  levelUpPet: Pet | null;
  levelUpTimer: number;
  evolving: boolean;
  evolveTimer: number;
  evolvePet: Pet | null;
  evolvePixels: { x: number; y: number; vx: number; vy: number; color: string }[];
  expGained: number;
  pokeballs: number;
  battleEnded: boolean;
}

export interface GameState {
  scene: 'map' | 'battle' | 'menu' | 'team' | 'catchResult';
  playerTeam: Pet[];
  pokeballs: number;
  wildPets: WildPet[];
  grassTufts: { x: number; y: number; width: number; height: number; hasPet: boolean }[];
  hoveredPet: WildPet | null;
  showTooltip: boolean;
  tooltipX: number;
  tooltipY: number;
  pendingReplacePet: Pet | null;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
