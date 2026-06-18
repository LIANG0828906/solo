import { ElementType, ReactionResult, ELEMENTS } from './elementData';

export interface CombatResult {
  damage: number;
  baseDamage: number;
  generateBonus: number;
  overcomeBonus: number;
  effects: VisualEffect[];
  spiritScale: number;
  displayColor: string;
}

export interface ExplosionEffect {
  type: 'explosion';
  x: number;
  y: number;
  radius: number;
  particleCount: number;
  duration: number;
  color: string;
  startTime: number;
}

export interface WrapEffect {
  type: 'wrap';
  x: number;
  y: number;
  duration: number;
  startTime: number;
}

export interface RandomEffect {
  type: 'random';
  element: ElementType;
  startTime: number;
  duration: number;
  x: number;
  y: number;
}

export interface DamageNumberEffect {
  type: 'damage';
  x: number;
  y: number;
  value: number;
  color: string;
  startTime: number;
  duration: number;
}

export type VisualEffect = ExplosionEffect | WrapEffect | RandomEffect | DamageNumberEffect;

export interface SpiritState {
  element: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  breathePhase: number;
  floatPhase: number;
}

export function calculateCombat(
  chain: ElementType[],
  reaction: ReactionResult,
  canvasWidth: number,
  canvasHeight: number,
  now: number
): CombatResult {
  const chainLength = chain.length;
  const baseDamage = chainLength * 10;

  const generateBonus = reaction.generateCount * 0.15;
  let overcomeBonus = 0;
  if (reaction.consecutiveOvercomes >= 2) {
    overcomeBonus = Math.floor(reaction.consecutiveOvercomes / 2) * 0.5;
  }

  const totalMultiplier = 1 + generateBonus + overcomeBonus;
  const damage = Math.round(baseDamage * totalMultiplier);

  const spiritScale = reaction.generateCount > 0 ? 1.3 : 1.0;

  const effects: VisualEffect[] = [];

  const spiritX = canvasWidth / 2;
  const spiritY = canvasHeight / 2;

  for (const r of reaction.reactions) {
    if (r.type === 'overcome') {
      const offsetX = (r.index - (chain.length - 2) / 2) * 60;
      effects.push({
        type: 'explosion',
        x: spiritX + offsetX,
        y: spiritY - 60,
        radius: 50,
        particleCount: 30,
        duration: 1000,
        color: ELEMENTS[r.from].color,
        startTime: now,
      });
    } else if (r.type === 'generate') {
      effects.push({
        type: 'wrap',
        x: spiritX,
        y: spiritY,
        duration: 1500,
        startTime: now,
      });
    }
  }

  const mainElementColor = ELEMENTS[reaction.mainElement].color;
  effects.push({
    type: 'damage',
    x: spiritX,
    y: spiritY - 90,
    value: damage,
    color: mainElementColor,
    startTime: now,
    duration: 1500,
  });

  return {
    damage,
    baseDamage,
    generateBonus,
    overcomeBonus,
    effects,
    spiritScale,
    displayColor: mainElementColor,
  };
}

export function createInitialSpirit(element: ElementType, canvasWidth: number, canvasHeight: number): SpiritState {
  return {
    element,
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    width: 80,
    height: 100,
    scale: 1,
    breathePhase: 0,
    floatPhase: 0,
  };
}

export function shouldTriggerRandomEffect(probability: number = 0.3): boolean {
  return Math.random() < probability;
}

export function createRandomEffect(spirit: SpiritState, now: number): RandomEffect | null {
  if (!shouldTriggerRandomEffect()) return null;

  const angle = Math.random() * Math.PI * 2;
  const distance = 40 + Math.random() * 30;
  return {
    type: 'random',
    element: spirit.element,
    startTime: now,
    duration: 800,
    x: spirit.x + Math.cos(angle) * distance,
    y: spirit.y + Math.sin(angle) * distance,
  };
}
