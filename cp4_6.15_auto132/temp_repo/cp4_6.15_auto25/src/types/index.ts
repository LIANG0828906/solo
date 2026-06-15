export type SkillType = 'attack' | 'defense' | 'heal' | 'buff';

export type Race = 'human' | 'elf' | 'undead';

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  damage?: number;
  cooldown: number;
  currentCooldown: number;
  manaCost: number;
  icon: string;
  description: string;
  effect: string;
  element?: 'fire' | 'ice' | 'shadow' | 'light' | 'nature';
  shieldAmount?: number;
  healAmount?: number;
  buffAmount?: number;
}

export type StatusType = 'shield' | 'poison' | 'stun' | 'buff';

export interface StatusEffect {
  type: StatusType;
  duration: number;
  value: number;
}

export interface Character {
  id: string;
  name: string;
  race: Race;
  className: string;
  maxHp: number;
  currentHp: number;
  maxMp: number;
  currentMp: number;
  attack: number;
  defense: number;
  defenseReduction: number;
  avatar: string;
  skills: Skill[];
  statuses: StatusEffect[];
  isPlayer: boolean;
}

export type LogType = 'attack' | 'heal' | 'defense' | 'system' | 'buff';

export interface CombatLogEntry {
  id: string;
  turn: number;
  message: string;
  type: LogType;
  timestamp: number;
}

export type TurnPhase = 'player' | 'enemy' | 'ended';

export interface BattleState {
  player: Character;
  enemy: Character;
  currentTurn: number;
  maxTurns: number;
  phase: TurnPhase;
  logs: CombatLogEntry[];
  winner: 'player' | 'enemy' | 'draw' | null;
  isAnimating: boolean;
}

export interface SkillResult {
  damage: number;
  heal: number;
  shield: number;
  buff: number;
  logs: { message: string; type: LogType }[];
  targetAffected: boolean;
}
