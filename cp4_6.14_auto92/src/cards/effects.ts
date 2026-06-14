import { CardEffect, EffectState, StateChange, ResolvedEffect } from './types';

const resolveDrawEffect = (
  effect: CardEffect,
  state: EffectState
): StateChange[] => {
  const count = typeof effect.params.count === 'number' ? effect.params.count : 1;
  const actualDraw = Math.min(count, state.deckCount);
  
  return [
    {
      key: 'handCount',
      before: state.handCount,
      after: state.handCount + actualDraw,
      delta: actualDraw
    },
    {
      key: 'deckCount',
      before: state.deckCount,
      after: state.deckCount - actualDraw,
      delta: -actualDraw
    }
  ];
};

const resolveBuffEffect = (
  effect: CardEffect,
  state: EffectState
): StateChange[] => {
  const stat = effect.params.stat as keyof EffectState;
  const value = typeof effect.params.value === 'number' ? effect.params.value : 0;
  
  const currentValue = state[stat];
  if (typeof currentValue !== 'number') return [];
  
  return [
    {
      key: stat as string,
      before: currentValue,
      after: currentValue + value,
      delta: value
    }
  ];
};

const resolveCopyEffect = (
  effect: CardEffect,
  state: EffectState
): StateChange[] => {
  const targetIndex = typeof effect.params.targetIndex === 'number' 
    ? effect.params.targetIndex 
    : 0;
  
  if (state.fieldCards.length === 0 || targetIndex >= state.fieldCards.length) {
    return [];
  }
  
  const targetCard = state.fieldCards[targetIndex];
  const newFieldCards = [...state.fieldCards, targetCard + '(复制)'];
  
  return [
    {
      key: 'fieldCards',
      before: [...state.fieldCards],
      after: newFieldCards
    }
  ];
};

const resolveTransformEffect = (
  effect: CardEffect,
  state: EffectState
): StateChange[] => {
  const fromStat = effect.params.from as keyof EffectState;
  const toStat = effect.params.to as keyof EffectState;
  const ratio = typeof effect.params.ratio === 'number' ? effect.params.ratio : 0.5;
  
  const fromValue = state[fromStat];
  const toValue = state[toStat];
  
  if (typeof fromValue !== 'number' || typeof toValue !== 'number') return [];
  
  const transformAmount = Math.floor(fromValue * ratio);
  
  return [
    {
      key: fromStat as string,
      before: fromValue,
      after: fromValue - transformAmount,
      delta: -transformAmount
    },
    {
      key: toStat as string,
      before: toValue,
      after: toValue + transformAmount,
      delta: transformAmount
    }
  ];
};

const resolveClearEffect = (
  effect: CardEffect,
  state: EffectState
): StateChange[] => {
  const target = effect.params.target as string;
  
  if (target === 'all') {
    const changes: StateChange[] = [];
    
    if (state.attack !== 0) {
      changes.push({
        key: 'attack',
        before: state.attack,
        after: 0,
        delta: -state.attack
      });
    }
    if (state.defense !== 0) {
      changes.push({
        key: 'defense',
        before: state.defense,
        after: 0,
        delta: -state.defense
      });
    }
    
    const counterKeys = Object.keys(state.statusCounters);
    if (counterKeys.length > 0) {
      changes.push({
        key: 'statusCounters',
        before: { ...state.statusCounters },
        after: {}
      });
    }
    
    return changes;
  }
  
  return [];
};

const resolveSingleEffect = (
  effect: CardEffect,
  state: EffectState
): StateChange[] => {
  switch (effect.type) {
    case 'draw':
      return resolveDrawEffect(effect, state);
    case 'buff':
      return resolveBuffEffect(effect, state);
    case 'copy':
      return resolveCopyEffect(effect, state);
    case 'transform':
      return resolveTransformEffect(effect, state);
    case 'clear':
      return resolveClearEffect(effect, state);
    default:
      return [];
  }
};

export const applyChanges = (state: EffectState, changes: StateChange[]): EffectState => {
  const newState = { ...state, statusCounters: { ...state.statusCounters } };
  
  for (const change of changes) {
    if (change.key === 'statusCounters') {
      newState.statusCounters = { ...(change.after as Record<string, number>) };
    } else if (change.key === 'fieldCards') {
      newState.fieldCards = [...(change.after as string[])];
    } else {
      (newState as any)[change.key] = change.after;
    }
  }
  
  return newState;
};

export const resolveChain = (
  effects: CardEffect[],
  initialState: EffectState
): { finalState: EffectState; resolvedEffects: ResolvedEffect[] } => {
  const sortedEffects = [...effects].sort((a, b) => b.priority - a.priority);
  
  let currentState = { ...initialState, statusCounters: { ...initialState.statusCounters }, fieldCards: [...initialState.fieldCards] };
  const resolvedEffects: ResolvedEffect[] = [];
  
  for (const effect of sortedEffects) {
    const changes = resolveSingleEffect(effect, currentState);
    if (changes.length > 0) {
      currentState = applyChanges(currentState, changes);
      resolvedEffects.push({
        effectId: effect.id,
        effectName: effect.name,
        changes,
        timestamp: Date.now()
      });
    }
  }
  
  return { finalState: currentState, resolvedEffects };
};
