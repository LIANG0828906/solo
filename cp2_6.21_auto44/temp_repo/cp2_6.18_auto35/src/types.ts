export enum RuneType {
  FIRE = 'fire',
  ICE = 'ice',
  THUNDER = 'thunder',
  WIND = 'wind',
  EARTH = 'earth',
  SHADOW = 'shadow',
}

export type SpellLevel = 'primary' | 'intermediate' | 'advanced';

export type AlignmentMode = 'horizontal' | 'vertical' | 'diagonal';

export interface SpellRecord {
  id: string;
  name: string;
  type: RuneType;
  level: SpellLevel;
  alignment: AlignmentMode;
  damage: number;
  manaCost: number;
}

export interface ExplorationLog {
  id: string;
  timestamp: string;
  runeCombination: RuneType[];
  success: boolean;
  spellLevel?: SpellLevel;
}

export interface RuneConfig {
  color: string;
  glowColor: string;
  icon: string;
  name: string;
}

export type RuneBoard = (RuneType | null)[][];

export interface AlignmentResult {
  type: RuneType;
  mode: AlignmentMode;
  level: SpellLevel;
}
