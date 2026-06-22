import {
  computeChainReaction,
  getElementsById,
  type ChainProduct,
  type ChainStep,
  type ChainResult,
  type ElementType,
} from './elixirSystem';
import {
  applyDamageToMonster,
  getResistanceMultiplier,
  isMonsterDefeated,
  type Monster,
} from './monsterSystem';

export interface CombatChainStep extends ChainStep {
  damage: number;
  finalDamage: number;
  weaknessHit: ElementType[];
  elementsInvolved: ElementType[];
}

export interface CombatResult {
  chainResult: ChainResult;
  steps: CombatChainStep[];
  finalProducts: ChainProduct[];
  baseDamage: number;
  finalDamage: number;
  totalWeaknessHits: number;
  monsterBefore: Monster;
  monsterAfter: Monster;
  monsterDefeated: boolean;
  elementsUsed: ElementType[];
}

export interface PlayerState {
  currentHp: number;
  maxHp: number;
}

const dedupeElements = (arr: ElementType[]): ElementType[] => {
  return Array.from(new Set(arr));
};

const collectAllElements = (chainResult: ChainResult): ElementType[] => {
  const all: ElementType[] = [];
  for (const step of chainResult.steps) {
    for (const input of step.inputs) {
      all.push(...getElementsById(input));
    }
    if (step.output) {
      all.push(...step.output.elements);
    }
  }
  for (const remaining of chainResult.remainingItems) {
    all.push(...getElementsById(remaining));
  }
  return dedupeElements(all);
};

const computeStepWeakness = (
  step: ChainStep,
  monster: Monster
): { weaknessHit: ElementType[]; multiplier: number } => {
  const elements: ElementType[] = [];
  for (const input of step.inputs) {
    elements.push(...getElementsById(input));
  }
  if (step.output) {
    elements.push(...step.output.elements);
  }
  const uniqueElements = dedupeElements(elements);
  const weaknessHit: ElementType[] = [];
  let maxMultiplier = 1;

  for (const el of uniqueElements) {
    const mult = getResistanceMultiplier(monster, el);
    if (mult > maxMultiplier) maxMultiplier = mult;
    if (monster.resistances[el] === 'weak') {
      weaknessHit.push(el);
    }
  }
  return { weaknessHit, multiplier: maxMultiplier };
};

export const simulateCombat = (
  sequence: ElementType[],
  monster: Monster
): CombatResult => {
  const chainResult = computeChainReaction(sequence);

  let totalWeaknessHits = 0;
  let runningMonster = { ...monster };
  const combatSteps: CombatChainStep[] = [];
  let cumulativeDamage = 0;

  for (const step of chainResult.steps) {
    const { weaknessHit, multiplier } = computeStepWeakness(step, monster);
    const finalDamage = Math.round(step.damage * multiplier);
    totalWeaknessHits += weaknessHit.length;
    cumulativeDamage += finalDamage;
    runningMonster = applyDamageToMonster(runningMonster, finalDamage);

    const elementsInvolved: ElementType[] = [];
    for (const input of step.inputs) {
      elementsInvolved.push(...getElementsById(input));
    }

    combatSteps.push({
      ...step,
      damage: step.damage,
      finalDamage,
      weaknessHit,
      elementsInvolved: dedupeElements(elementsInvolved),
    });
  }

  for (const remaining of chainResult.remainingItems) {
    const elements = getElementsById(remaining);
    if (elements.length === 0) continue;

    const isProduct = chainResult.finalProducts.some((p) => p.id === remaining);
    if (isProduct) continue;

    const baseDamage = chainResult.totalBaseDamage - chainResult.steps.reduce((s, st) => s + st.damage, 0);
    if (baseDamage <= 0) continue;

    let maxMultiplier = 1;
    const weaknessHit: ElementType[] = [];
    for (const el of elements) {
      const mult = getResistanceMultiplier(monster, el);
      if (mult > maxMultiplier) maxMultiplier = mult;
      if (monster.resistances[el] === 'weak') weaknessHit.push(el);
    }
    const remainDamage = Math.round(baseDamage * maxMultiplier);
    if (remainDamage <= 0) continue;
    totalWeaknessHits += weaknessHit.length;
    cumulativeDamage += remainDamage;
    runningMonster = applyDamageToMonster(runningMonster, remainDamage);

    combatSteps.push({
      inputs: [remaining],
      output: null,
      damage: baseDamage,
      animationColor: '#FFFFFF',
      position: combatSteps.length,
      finalDamage: remainDamage,
      weaknessHit,
      elementsInvolved: elements,
    });
  }

  return {
    chainResult,
    steps: combatSteps,
    finalProducts: chainResult.finalProducts,
    baseDamage: chainResult.totalBaseDamage,
    finalDamage: cumulativeDamage,
    totalWeaknessHits,
    monsterBefore: monster,
    monsterAfter: runningMonster,
    monsterDefeated: isMonsterDefeated(runningMonster),
    elementsUsed: collectAllElements(chainResult),
  };
};

export const applyMonsterAttack = (
  player: PlayerState,
  monster: Monster
): PlayerState => {
  const newHp = Math.max(0, player.currentHp - monster.attackDamage);
  return { ...player, currentHp: newHp };
};

export const isPlayerDefeated = (player: PlayerState): boolean => {
  return player.currentHp <= 0;
};

export const createInitialPlayerState = (maxHp: number = 100): PlayerState => ({
  currentHp: maxHp,
  maxHp,
});
