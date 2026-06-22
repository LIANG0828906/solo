import type { CreatureType } from './alchemy';

export type InteractionType = 'pet' | 'feed' | 'train';

export interface InteractionResponse {
  hunger: number;
  mood: number;
  bond: number;
}

export interface CreatureData {
  type: CreatureType;
  name: string;
  hunger: number;
  mood: number;
  bond: number;
  frameIndex: number;
  animTimer: number;
  particleColor1: string;
  particleColor2: string;
  particleShape: 'circle' | 'star' | 'ember' | 'leaf' | 'bubble';
  bodyColor: string;
  eyeColor: string;
  size: number;
  opacity: number;
  celebrationTimer: number;
}

const INTERACTION_MAP: Record<CreatureType, Record<InteractionType, InteractionResponse>> = {
  dragon:        { pet: { hunger: 0, mood: 10, bond: 5 }, feed: { hunger: 20, mood: 5, bond: 5 }, train: { hunger: 0, mood: 5, bond: 15 } },
  unicorn:       { pet: { hunger: 0, mood: 20, bond: 5 }, feed: { hunger: 10, mood: 5, bond: 5 }, train: { hunger: 0, mood: 5, bond: 10 } },
  gargoyle:      { pet: { hunger: 0, mood: 5, bond: 3 },  feed: { hunger: 15, mood: 5, bond: 5 }, train: { hunger: 0, mood: 5, bond: 25 } },
  phoenix:       { pet: { hunger: 0, mood: 15, bond: 5 }, feed: { hunger: 10, mood: 5, bond: 5 }, train: { hunger: 0, mood: 5, bond: 15 } },
  hellhound:     { pet: { hunger: 0, mood: 10, bond: 5 }, feed: { hunger: 25, mood: 5, bond: 5 }, train: { hunger: 0, mood: 5, bond: 10 } },
  nymph:         { pet: { hunger: 0, mood: 20, bond: 5 }, feed: { hunger: 10, mood: 5, bond: 5 }, train: { hunger: 0, mood: 5, bond: 10 } },
  treant:        { pet: { hunger: 0, mood: 10, bond: 5 }, feed: { hunger: 20, mood: 5, bond: 5 }, train: { hunger: 0, mood: 5, bond: 10 } },
  griffin:       { pet: { hunger: 0, mood: 15, bond: 5 }, feed: { hunger: 15, mood: 5, bond: 5 }, train: { hunger: 0, mood: 5, bond: 15 } },
  troll:         { pet: { hunger: 0, mood: 5, bond: 5 },  feed: { hunger: 20, mood: 10, bond: 5 }, train: { hunger: 0, mood: 5, bond: 15 } },
  elk:           { pet: { hunger: 0, mood: 15, bond: 8 }, feed: { hunger: 10, mood: 5, bond: 5 }, train: { hunger: 0, mood: 5, bond: 12 } },
  ancient_dragon:{ pet: { hunger: 0, mood: 10, bond: 8 }, feed: { hunger: 15, mood: 8, bond: 8 }, train: { hunger: 0, mood: 8, bond: 15 } },
  salamander:    { pet: { hunger: 0, mood: 10, bond: 5 }, feed: { hunger: 15, mood: 5, bond: 5 }, train: { hunger: 0, mood: 5, bond: 15 } },
};

const CREATURE_CONFIGS: Record<CreatureType, {
  name: string;
  particleColor1: string;
  particleColor2: string;
  particleShape: 'circle' | 'star' | 'ember' | 'leaf' | 'bubble';
  bodyColor: string;
  eyeColor: string;
  size: number;
}> = {
  dragon:         { name: '飞龙',       particleColor1: '#FF4400', particleColor2: '#FFaa00', particleShape: 'ember',  bodyColor: '#3A2A4A', eyeColor: '#FF6600', size: 1.2 },
  hellhound:      { name: '地狱犬',     particleColor1: '#CC0000', particleColor2: '#FF3300', particleShape: 'ember',  bodyColor: '#2A1A1A', eyeColor: '#FF0000', size: 1.0 },
  phoenix:        { name: '凤凰',       particleColor1: '#FF6600', particleColor2: '#FFCC00', particleShape: 'ember',  bodyColor: '#4A2A0A', eyeColor: '#FFAA00', size: 1.1 },
  nymph:          { name: '水妖',       particleColor1: '#00AACC', particleColor2: '#00DDFF', particleShape: 'bubble', bodyColor: '#1A3A4A', eyeColor: '#00CCFF', size: 0.9 },
  unicorn:        { name: '独角兽',     particleColor1: '#AACCFF', particleColor2: '#FFFFFF', particleShape: 'star',   bodyColor: '#3A3A4A', eyeColor: '#CCDDFF', size: 1.1 },
  treant:         { name: '树精',       particleColor1: '#33AA33', particleColor2: '#88CC44', particleShape: 'leaf',   bodyColor: '#2A3A1A', eyeColor: '#44CC44', size: 1.3 },
  gargoyle:       { name: '石像鬼',     particleColor1: '#666688', particleColor2: '#8888AA', particleShape: 'circle', bodyColor: '#3A3A3A', eyeColor: '#8888CC', size: 1.0 },
  griffin:        { name: '狮鹫',       particleColor1: '#CCAA33', particleColor2: '#FFDD66', particleShape: 'star',   bodyColor: '#4A3A1A', eyeColor: '#FFCC33', size: 1.2 },
  troll:          { name: '巨魔',       particleColor1: '#668833', particleColor2: '#99AA55', particleShape: 'leaf',   bodyColor: '#2A3A1A', eyeColor: '#88AA33', size: 1.4 },
  elk:            { name: '精灵鹿',     particleColor1: '#88CCAA', particleColor2: '#BBFFDD', particleShape: 'star',   bodyColor: '#2A3A2A', eyeColor: '#88FFCC', size: 1.0 },
  ancient_dragon: { name: '远古巨龙',   particleColor1: '#FF44FF', particleColor2: '#44FFFF', particleShape: 'star',   bodyColor: '#2A1A3A', eyeColor: '#FF88FF', size: 1.5 },
  salamander:     { name: '火蜥蜴',     particleColor1: '#FF2200', particleColor2: '#FF8800', particleShape: 'ember',  bodyColor: '#3A1A0A', eyeColor: '#FF4400', size: 0.8 },
};

export function createCreature(type: CreatureType): CreatureData {
  const cfg = CREATURE_CONFIGS[type];
  return {
    type,
    name: cfg.name,
    hunger: 30,
    mood: 30,
    bond: 10,
    frameIndex: 0,
    animTimer: 0,
    particleColor1: cfg.particleColor1,
    particleColor2: cfg.particleColor2,
    particleShape: cfg.particleShape,
    bodyColor: cfg.bodyColor,
    eyeColor: cfg.eyeColor,
    size: cfg.size,
    opacity: 0,
    celebrationTimer: 0,
  };
}

export function interact(creature: CreatureData, action: InteractionType): CreatureData {
  const response = INTERACTION_MAP[creature.type][action];
  const newHunger = Math.min(100, creature.hunger + response.hunger);
  const newMood = Math.min(100, creature.mood + response.mood);
  const newBond = Math.min(100, creature.bond + response.bond);
  const allFull = newHunger >= 100 && newMood >= 100 && newBond >= 100;
  return {
    ...creature,
    hunger: newHunger,
    mood: newMood,
    bond: newBond,
    celebrationTimer: allFull ? 3000 : creature.celebrationTimer,
  };
}

export function updateCreatureAnimation(creature: CreatureData, dt: number): CreatureData {
  let newTimer = creature.animTimer + dt;
  let newFrame = creature.frameIndex;
  if (newTimer > 200) {
    newTimer -= 200;
    newFrame = (newFrame + 1) % 6;
  }
  let newOpacity = creature.opacity;
  if (newOpacity < 1) {
    newOpacity = Math.min(1, newOpacity + dt / 800);
  }
  let newCelebration = creature.celebrationTimer;
  if (newCelebration > 0) {
    newCelebration = Math.max(0, newCelebration - dt);
  }
  return {
    ...creature,
    animTimer: newTimer,
    frameIndex: newFrame,
    opacity: newOpacity,
    celebrationTimer: newCelebration,
  };
}

export function isCreatureFullyBonded(creature: CreatureData): boolean {
  return creature.hunger >= 100 && creature.mood >= 100 && creature.bond >= 100;
}
