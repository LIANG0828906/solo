export interface Rune {
  id: string;
  name: string;
  icon: string;
  color: string;
  element: ElementType;
}

export type ElementType =
  | 'fire'
  | 'ice'
  | 'thunder'
  | 'shadow'
  | 'guard'
  | 'heal'
  | 'wind'
  | 'rock'
  | 'ghost'
  | 'light'
  | 'poison'
  | 'time';

export type StatusEffectType =
  | 'slow'
  | 'burn'
  | 'stun'
  | 'heal'
  | 'shield'
  | 'poison'
  | 'cleanse';

export interface StatusEffect {
  type: StatusEffectType;
  value: number;
  duration: number;
}

export interface SpellEffect {
  name: string;
  damage: number;
  type: 'single' | 'aoe';
  description: string;
  element: ElementType;
  statusEffects: StatusEffect[];
  particleType: string;
}

export interface Enemy {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  attackType: string;
  statusEffects: StatusEffect[];
}

export type GameState = 'preview' | 'battle';

export const RUNES: Rune[] = [
  { id: 'fire', name: '火焰', icon: '🔥', color: 'red', element: 'fire' },
  { id: 'ice', name: '冰霜', icon: '❄️', color: 'blue', element: 'ice' },
  { id: 'thunder', name: '雷电', icon: '⚡', color: 'yellow', element: 'thunder' },
  { id: 'shadow', name: '暗影', icon: '🌙', color: 'purple', element: 'shadow' },
  { id: 'guard', name: '守护', icon: '🛡️', color: 'white', element: 'guard' },
  { id: 'heal', name: '治愈', icon: '💚', color: 'green', element: 'heal' },
  { id: 'wind', name: '风暴', icon: '🌀', color: 'cyan', element: 'wind' },
  { id: 'rock', name: '岩石', icon: '🪨', color: 'brown', element: 'rock' },
  { id: 'ghost', name: '幽冥', icon: '👻', color: 'black', element: 'ghost' },
  { id: 'light', name: '光芒', icon: '✨', color: 'gold', element: 'light' },
  { id: 'poison', name: '毒液', icon: '☠️', color: 'lime', element: 'poison' },
  { id: 'time', name: '时空', icon: '⏳', color: 'silver', element: 'time' },
];
