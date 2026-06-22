export interface Element {
  id: string;
  name: string;
  symbol: string;
  colorStart: string;
  colorEnd: string;
  category: 'basic' | 'compound' | 'creature';
}

export interface Creature {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  foodPreference: string;
  evolutionPath: string[];
  elementId: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  status: 'alive' | 'dead' | 'evolving';
  age: number;
  hunger: number;
}

export interface Environment {
  temperature: number;
  humidity: number;
  food: number;
  tick: number;
}

export interface Recipe {
  id: string;
  input1: string;
  input2: string;
  output: string;
  outputIsCreature: boolean;
  description: string;
  discovered: boolean;
}

export type EventName =
  | 'element_combined'
  | 'creature_spawned'
  | 'creature_evolved'
  | 'creature_status'
  | 'environment_update';

export interface EventPayload {
  element_combined: {
    success: boolean;
    element?: Element;
    inputs: [string, string];
  };
  creature_spawned: { creature: Creature };
  creature_evolved: { creature: Creature; fromLevel: number };
  creature_status: { creatureId: string; status: string; hp: number };
  environment_update: Environment;
}
