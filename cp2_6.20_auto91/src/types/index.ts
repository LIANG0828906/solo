export type CreatureType = 'phoenix' | 'dragon' | 'wolf' | 'tortoise';

export type EvolutionStage = 'egg' | 'baby' | 'adult' | 'evolved';

export type ElementType = 'fire' | 'ice' | 'thunder' | 'earth';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CreatureStats {
  health: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
  potential: number;
}

export interface EnvironmentParams {
  temperature: number;
  humidity: number;
  aura: number;
}

export interface EggConfig {
  id: CreatureType;
  name: string;
  rarity: Rarity;
  baseSuccessRate: number;
  color: string;
  glowColor: string;
  element: ElementType;
  optimalTemp: { min: number; max: number };
  optimalHumidity: { min: number; max: number };
  optimalAura: { min: number; max: number };
  skills: {
    baby: Skill[];
    adult: Skill[];
    evolved: Skill[];
  };
}

export interface Skill {
  name: string;
  description: string;
  icon: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  visible: boolean;
}
