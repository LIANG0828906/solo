export type ElementType = 'fire' | 'ice' | 'thunder' | 'wind';

export type PlayerStatus = 'none' | 'frozen' | 'combo';

export interface Spell {
  id: string;
  element: ElementType;
  damage: number;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export interface Player {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  status: PlayerStatus;
  hand: Spell[];
}

export interface GameState {
  gameId: string;
  round: number;
  players: [Player, Player];
  currentPlayer: number;
  deckRemaining: number;
  selectedSpell: Spell | null;
  gameOver: boolean;
  winner: number | null;
  phase: 'selecting' | 'animating' | 'resolving';
  actionLog: string[];
  spellDamageRanges: Record<ElementType, { min: number; max: number }>;
}

export interface SpellEffect {
  damage: number;
  freeze: boolean;
  combo: boolean;
  blowback: boolean;
  element: ElementType;
}

export interface AnimationState {
  active: boolean;
  element: ElementType | null;
  targetSide: 'left' | 'right';
  progress: number;
  duration: number;
  particles: Particle[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  element: ElementType;
}
