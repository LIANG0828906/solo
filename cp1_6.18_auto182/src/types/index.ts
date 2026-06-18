export type HeroClass = 'warrior' | 'mage' | 'archer';
export type Team = 'player' | 'enemy';

export interface HexCoord {
  q: number;
  r: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  damageMultiplier: number;
  cooldown: number;
  currentCooldown: number;
  ignoreDefensePercent: number;
  burnDamagePerTurn: number;
  burnDuration: number;
  range: number;
}

export interface StatusEffect {
  type: 'burn';
  damagePerTurn: number;
  remainingTurns: number;
}

export interface Unit {
  id: string;
  name: string;
  heroClass: HeroClass;
  team: Team;
  position: HexCoord;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  move: number;
  critChance: number;
  color: string;
  skills: Skill[];
  statusEffects: StatusEffect[];
  hasMoved: boolean;
  hasActed: boolean;
  isDead: boolean;
}

export interface DamagePopup {
  id: string;
  position: HexCoord;
  damage: number;
  isCrit: boolean;
  timestamp: number;
}

export type GamePhase = 'select' | 'move' | 'attack' | 'enemy' | 'animating';

export interface AnimationState {
  flashingUnitId: string | null;
  damagePopups: DamagePopup[];
  fadingUnitId: string | null;
}

export type GameResult = 'victory' | 'defeat' | null;
