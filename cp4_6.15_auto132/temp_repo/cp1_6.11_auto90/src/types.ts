export type Race = 'human' | 'elf' | 'undead';

export type SkillType = 'defense_aura' | 'ranged_first' | 'lifesteal' | 'evasion' | 'revive' | 'heal' | 'double_strike' | 'shield_wall' | 'poison' | 'curse';

export interface Skill {
  type: SkillType;
  name: string;
  description: string;
  value: number;
}

export interface UnitTemplate {
  id: string;
  name: string;
  race: Race;
  icon: string;
  color: string;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  skill: Skill;
  recruitCost: { gold: number; mana: number };
}

export interface Unit {
  instanceId: string;
  templateId: string;
  name: string;
  race: Race;
  icon: string;
  color: string;
  level: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  currentHp: number;
  skill: Skill;
  alive: boolean;
  position: number;
  effects: ActiveEffect[];
  hasActed: boolean;
}

export interface ActiveEffect {
  type: 'defense_buff' | 'poison' | 'curse';
  value: number;
  duration: number;
  source: string;
}

export interface CounterTable {
  [key: string]: Race;
}

export interface BattleUnitState {
  unit: Unit;
  screenX: number;
  screenY: number;
  targetX: number;
  targetY: number;
  animationState: 'idle' | 'attacking' | 'returning' | 'hurt' | 'dead';
  animationProgress: number;
  isEnemy: boolean;
}

export interface BattleLogEntry {
  round: number;
  message: string;
  type: 'attack' | 'skill' | 'damage' | 'heal' | 'death' | 'system';
  timestamp: number;
}

export interface BattleState {
  round: number;
  playerUnits: BattleUnitState[];
  enemyUnits: BattleUnitState[];
  log: BattleLogEntry[];
  effects: VisualEffect[];
  phase: 'preparing' | 'fighting' | 'ended';
  turnQueue: Unit[];
  currentTurnIndex: number;
  winner: 'player' | 'enemy' | null;
}

export interface VisualEffect {
  id: string;
  type: 'aura' | 'arrow' | 'shadow' | 'damage_text' | 'heal_text';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  progress: number;
  duration: number;
  color: string;
  value?: string;
}

export interface Resources {
  gold: number;
  mana: number;
}

export interface ArmyState {
  resources: Resources;
  recruitedUnits: Unit[];
  formation: (Unit | null)[];
}

export type Screen = 'formation' | 'battle';
