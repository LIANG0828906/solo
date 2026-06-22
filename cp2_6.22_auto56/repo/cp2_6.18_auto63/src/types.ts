export type ElementType = 'fire' | 'water' | 'grass' | 'electric' | 'wind' | 'earth';

export interface Skill {
  name: string;
  coefficient: number;
  element: ElementType;
  unlockLevel: number;
  description: string;
}

export interface Pet {
  id: string;
  name: string;
  element: ElementType;
  level: number;
  exp: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  rage: number;
  skills: Skill[];
}

export interface BattleState {
  playerTeam: Pet[];
  enemyTeam: Pet[];
  currentPlayerPetIndex: number;
  currentEnemyPetIndex: number;
  turn: number;
  log: BattleLogEntry[];
  phase: BattlePhase;
  winner: 'player' | 'enemy' | null;
}

export type BattlePhase = 'countdown' | 'selectSkill' | 'animating' | 'ended';

export interface BattleLogEntry {
  text: string;
  type: 'damage' | 'effect' | 'rage' | 'info' | 'death' | 'switch';
}

export interface PlayerState {
  pets: Pet[];
  teamIndices: number[];
  feedCount: number;
  feedDate: string;
}

export interface DamageResult {
  damage: number;
  attackerId: string;
  defenderId: string;
  skillName: string;
  attackerRageGain: number;
  defenderRageGain: number;
  isCritical: boolean;
}

export interface FightRoundResult {
  actions: FightAction[];
  playerPetDied: boolean;
  enemyPetDied: boolean;
  battleEnded: boolean;
  winner: 'player' | 'enemy' | null;
}

export interface FightAction {
  attacker: 'player' | 'enemy';
  defender: 'player' | 'enemy';
  damage: number;
  skillName: string;
  attackerRageGain: number;
  defenderRageGain: number;
  isCritical: boolean;
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#e63946',
  water: '#457b9d',
  grass: '#2d6a4f',
  electric: '#ffb703',
  wind: '#a8dadc',
  earth: '#bc6c25',
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  fire: '火系',
  water: '水系',
  grass: '草系',
  electric: '电系',
  wind: '风系',
  earth: '土系',
};

export const SKILL_COLORS = ['#fb8500', '#7209b7', '#4361ee', '#06d6a0'] as const;
