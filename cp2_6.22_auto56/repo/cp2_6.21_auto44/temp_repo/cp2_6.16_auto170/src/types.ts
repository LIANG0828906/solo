export type RuneType = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';

export interface Rune {
  id: string;
  type: RuneType;
  name: string;
  color: string;
  count: number;
  icon: string;
}

export type SpellElement =
  | 'fire'
  | 'water'
  | 'earth'
  | 'wind'
  | 'light'
  | 'dark'
  | 'combo'
  | 'chaos';

export interface Spell {
  id: string;
  name: string;
  icon: string;
  description: string;
  baseDamage: number;
  element: SpellElement;
  cooldown: number;
  currentCooldown: number;
  recipe: RuneType[];
  isAoe?: boolean;
  animationType: 'fireball' | 'ice' | 'earth' | 'wind' | 'light' | 'dark' | 'explosion';
  effects?: StatusEffect[];
}

export interface StatusEffect {
  type: 'burn' | 'freeze' | 'stun' | 'poison' | 'heal' | 'shield';
  duration: number;
  value: number;
}

export type MonsterShape = 'slime' | 'bat' | 'spider' | 'skeleton' | 'cyclops';
export type BossSkill = 'stun_all' | 'heavy_smash' | 'summon_minions';

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  level: number;
  isBoss: boolean;
  color: string;
  shape: MonsterShape;
  specialSkills: BossSkill[];
  statusEffects: StatusEffect[];
}

export interface Player {
  hp: number;
  maxHp: number;
  defense: number;
  level: number;
  currentStage: number;
  statusEffects: StatusEffect[];
}

export type TurnPhase =
  | 'player_turn'
  | 'player_animating'
  | 'enemy_turn'
  | 'enemy_animating'
  | 'victory'
  | 'defeat';

export interface BattleState {
  player: Player;
  monster: Monster | null;
  turn: number;
  phase: TurnPhase;
  isPlayerStunned: boolean;
  bossSkillCooldown: number;
}

export interface BattleLogEntry {
  id: string;
  turn: number;
  actor: 'player' | 'monster' | 'system';
  message: string;
  damage?: number;
  timestamp: number;
}

export interface CraftResult {
  success: boolean;
  spell?: Spell;
  reason?: string;
}

export interface GameState {
  runes: Record<RuneType, Rune>;
  learnedSpells: Spell[];
  battle: BattleState;
  battleLogs: BattleLogEntry[];
  craftSlots: (RuneType | null)[];
  isCrafting: boolean;
  lastCraftResult: Spell | null;
  craftFailShake: boolean;
  animatingSpellId: string | null;
  pendingDamage: { target: 'player' | 'monster'; amount: number } | null;
  monsterHit: boolean;
  playerHit: boolean;
  floatingDrops: { id: string; type: RuneType; fromX: number; fromY: number }[];
  spellCastAnimation: { spellId: string; progress: number } | null;
}
