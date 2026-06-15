export type Race = 'human' | 'elf' | 'dwarf' | 'orc';

export type CharacterClass = 'warrior' | 'mage' | 'ranger' | 'rogue' | 'priest' | 'warlock';

export type AttributeKey = 'strength' | 'agility' | 'intelligence' | 'constitution' | 'spirit';

export interface Attributes {
  strength: number;
  agility: number;
  intelligence: number;
  constitution: number;
  spirit: number;
}

export interface RaceData {
  id: Race;
  name: string;
  bonuses: Partial<Attributes>;
  description: string;
}

export interface ClassData {
  id: CharacterClass;
  name: string;
  description: string;
  primaryAttribute: AttributeKey;
}

export interface SkillEffect {
  damageMultiplier: number;
  hitBonus: number;
  critBonus: number;
  cooldown: number;
  description: string;
  icon: string;
}

export interface SkillNode {
  id: string;
  name: string;
  classId: CharacterClass;
  tier: number;
  prerequisites: string[];
  effect: SkillEffect;
  x: number;
  y: number;
}

export interface CombatStats {
  dps: number;
  hitRate: number;
  critRate: number;
  skillSequence: Array<{
    id: string;
    name: string;
    icon: string;
    cooldown: number;
  }>;
}

export type NodeState = 'inactive' | 'learnable' | 'activated' | 'unavailable';
