export type PetSpecies = 'cat' | 'dog';
export type CatBreed = 'domestic' | 'scottish' | 'ragdoll';
export type DogBreed = 'shiba' | 'golden' | 'corgi';
export type PetBreed = CatBreed | DogBreed;
export type FoodType = 'dry' | 'can' | 'snack';
export type GiftType = 'bone' | 'yarn' | 'fish';
export type ColorScheme = 0 | 1 | 2;

export interface ColorConfig {
  body: string;
  ears: string;
  eyes: string;
}

export interface BreedInfo {
  id: string;
  name: string;
  colors: ColorConfig[];
}

export interface Pet {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  species: PetSpecies;
  breed: PetBreed;
  colorScheme: ColorScheme;
  level: number;
  exp: number;
  hunger: number;
  happiness: number;
  cleanliness: number;
  energy: number;
}

export interface FoodItem {
  type: FoodType;
  name: string;
  icon: string;
  hungerEffect: number;
  happinessEffect: number;
  expReward: number;
}

export interface GiftItem {
  type: GiftType;
  name: string;
  icon: string;
  happinessEffect: number;
  expReward: number;
}

export interface EffectResult {
  hunger?: number;
  happiness?: number;
  cleanliness?: number;
  energy?: number;
  exp: number;
}

export interface ActionResponse<T extends Pet = Pet> {
  pet: T;
  effects: EffectResult;
}

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel: number;
  newExp: number;
  prevExp: number;
  threshold: number;
}

export interface CreatePetData {
  ownerName: string;
  species: PetSpecies;
  breed: PetBreed;
  colorScheme: ColorScheme;
  name: string;
}

export interface FloatingText {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

export type FurnitureType = 'bowl' | 'toy' | 'water' | 'bed';

export type PetAnimationState = 'idle' | 'walking' | 'eating' | 'playing' | 'sleeping' | 'drinking';

export interface SquarePetData extends Pet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  showHeart: boolean;
  heartTimer: number;
}

export const LEVEL_EXP_TABLE = [0, 50, 120, 220, 350, 520, 730, 980, 1280, 1630, 2030];
