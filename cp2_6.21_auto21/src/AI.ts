import {
  GameState,
  Target,
  canPlayCard,
  playMinionCard,
  playSpellCard,
  playWeaponCard,
  canAttackTarget,
  attackTarget,
  needsTarget,
} from './gameEngine';
import {
  PlayerState,
  BoardMinion,
  findEmptyCell,
  getBoardMinions,
  BOARD_ROWS,
  BOARD_COLS,
} from './player';
import { Card, MinionCard, SpellCard, SpellEffect } from './card';

export interface ScoredCard {
  index: number;
  card: Card;
  score: number;
}

export interface ScoredTarget {
  target: Target;
  score: number;
}

export function evaluateCard(card: Card, player: PlayerState, enemy: PlayerState): number {
  let score = 0;

  if (card.type === 'minion') {
    const m = card as MinionCard;
    score += m.attack * 2;
    score += m.health * 1.5;
    if (m.taunt) score += 3;
    if (m.charge) score += 2;
    if (m.battlecry) {
      score += evaluateEffect(m.battlecry, player, enemy);
    }
    score += (10 - card.cost) * 0.5;
  } else if (card.type === 'spell') {
    const s = card as SpellCard;
    score += evaluateEffect(s.effect, player, enemy);
  } else if (card.type === 'weapon') {
    score += card.attack * card.durability;
    score += 2;
  }

  return score;
}

function evaluateEffect(effect: SpellEffect, player: PlayerState, enemy: PlayerState): number {
  let score = 0;
  switch (effect.type) {
    case 'damage':
      score += (effect.value || 0) * 1.5;
      break;
    case 'aoe_damage': {
      const enemyMinions = getBoardMinions(enemy);
      score += (effect.value || 0) * enemyMinions.length * 1.5;
      break;
    }
    case 'heal':
      score += (effect.value || 0) * 1.2;
      if (player.hero.health < 15) score += 3;
      break;
    case 'heal_all':
      score += (effect.value || 0) * 2;
      if (player.hero.health < 15) score += 5;
      break;
    case 'draw':
      score += (effect.count || 1) * 3;
      break;
    case 'summon':
      score += (effect.count || 1) * 4;
      break;
    case 'buff':
      score += (effect.value || 0) * 2;
      break;
    case 'freeze':
      score += 4;
      break;
  }
  return score;
}

export function getPlayableCards(state: GameState, playerId: 'player' | 'ai'): ScoredCard[] {
  const player = playerId === 'player' ? state.player : state.ai;
  const enemy = playerId === 'player' ? state.ai : state.player;
  const scored: ScoredCard[] = [];

  for (let i = 0; i < player.hand.length; i++) {
    if (canPlayCard(state, playerId, i)) {
      const card = player.hand[i];
      scored.push({
        index: i,
        card,
        score: evaluateCard(card, player, enemy),
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function chooseTargetForSpell(
  state: GameState,
  casterId: 'player' | 'ai',
  effect: SpellEffect
): Target | null {
  const enemyId = casterId === 'player' ? 'ai' : 'player';
  const caster = casterId === 'player' ? state.player : state.ai;
  const enemy = enemyId === 'player' ? state.player : state.ai;

  if (effect.type === 'damage') {
    if (effect.target === 'enemy' || effect.target === 'any') {
      const targets = getAttackableMinionTargets(state, enemyId);
      targets.push({ target: { type: 'hero', side: enemyId }, score: enemy.hero.health <= (effect.value || 0) ? 100 : 10 });
      targets.sort((a, b) => b.score - a.score);
      return targets[0]?.target || null;
    }
  }

  if (effect.type === 'heal') {
    const targets: ScoredTarget[] = [];
    if (caster.hero.health < caster.hero.maxHealth) {
      targets.push({
        target: { type: 'hero', side: casterId },
        score: (caster.hero.maxHealth - caster.hero.health) * 2,
      });
    }
    const casterMinions = getBoardMinions(caster);
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const m = caster.board[row][col];
        if (m && m.currentHealth < m.maxHealth) {
          targets.push({
            target: { type: 'minion', side: casterId, row, col, instanceId: m.instanceId },
            score: (m.maxHealth - m.currentHealth) * 1.5,
          });
        }
      }
    }
    targets.sort((a, b) => b.score - a.score);
    return targets[0]?.target || null;
  }

  if (effect.type === 'buff') {
    const targets: ScoredTarget[] = [];
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const m = caster.board[row][col];
        if (m) {
          targets.push({
            target: { type: 'minion', side: casterId, row, col, instanceId: m.instanceId },
            score: m.attack + (m.canAttack ? 5 : 0),
          });
        }
      }
    }
    targets.sort((a, b) => b.score - a.score);
    return targets[0]?.target || null;
  }

  return null;
}

function getAttackableMinionTargets(state: GameState, side: 'player' | 'ai'): ScoredTarget[] {
  const player = side === 'player' ? state.player : state.ai;
  const targets: ScoredTarget[] = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const m = player.board[row][col];
      if (m) {
        targets.push({
          target: { type: 'minion', side, row, col, instanceId: m.instanceId },
          score: m.attack * 0.5 + (5 - m.currentHealth) * 2,
        });
      }
    }
  }
  return targets;
}

export function chooseAttackTarget(
  state: GameState,
  attackerSide: 'player' | 'ai',
  attackerRow: number,
  attackerCol: number
): Target | null {
  const defenderSide = attackerSide === 'player' ? 'ai' : 'player';
  const attackerPlayer = attackerSide === 'player' ? state.player : state.ai;
  const defenderPlayer = defenderSide === 'player' ? state.player : state.ai;
  const attacker = attackerPlayer.board[attackerRow][attackerCol];
  if (!attacker) return null;

  const targets: ScoredTarget[] = [];
  const enemyMinions = getBoardMinions(defenderPlayer);
  const hasTaunt = enemyMinions.some((m) => m.taunt);

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const m = defenderPlayer.board[row][col];
      if (!m) continue;
      if (hasTaunt && !m.taunt) continue;

      const target: Target = { type: 'minion', side: defenderSide, row, col, instanceId: m.instanceId };
      if (!canAttackTarget(state, attackerSide, attackerRow, attackerCol, target)) continue;

      let score = 0;
      if (m.currentHealth <= attacker.attack) {
        score += 20 + m.attack * 2;
      } else {
        score += 5 - Math.abs(attacker.attack - m.currentHealth);
      }
      if (attacker.currentHealth <= m.attack) {
        score -= 10;
      }
      if (m.taunt) score += 10;
      targets.push({ target, score });
    }
  }

  if (!hasTaunt) {
    const heroTarget: Target = { type: 'hero', side: defenderSide };
    if (canAttackTarget(state, attackerSide, attackerRow, attackerCol, heroTarget)) {
      let score = attacker.attack * 2;
      if (defenderPlayer.hero.health <= attacker.attack) {
        score += 1000;
      }
      targets.push({ target: heroTarget, score });
    }
  }

  targets.sort((a, b) => b.score - a.score);
  return targets[0]?.target || null;
}

export function findBestPlacement(state: GameState, side: 'player' | 'ai'): { row: number; col: number } | null {
  const player = side === 'player' ? state.player : state.ai;
  return findEmptyCell(player);
}

export interface AIDecision {
  type: 'play_card' | 'attack' | 'end_turn';
  cardIndex?: number;
  row?: number;
  col?: number;
  target?: Target;
}

export function makeAIDecision(state: GameState): AIDecision | null {
  const aiId: 'player' | 'ai' = 'ai';

  const playable = getPlayableCards(state, aiId);
  if (playable.length > 0) {
    const best = playable[0];
    const card = best.card;

    if (card.type === 'minion') {
      const placement = findBestPlacement(state, aiId);
      if (placement) {
        return {
          type: 'play_card',
          cardIndex: best.index,
          row: placement.row,
          col: placement.col,
        };
      }
    } else if (card.type === 'spell') {
      const spell = card as SpellCard;
      if (needsTarget(spell.effect)) {
        const target = chooseTargetForSpell(state, aiId, spell.effect);
        if (target) {
          return {
            type: 'play_card',
            cardIndex: best.index,
            target,
          };
        }
      } else {
        return {
          type: 'play_card',
          cardIndex: best.index,
        };
      }
    } else if (card.type === 'weapon') {
      return {
        type: 'play_card',
        cardIndex: best.index,
      };
    }
  }

  const ai = state.ai;
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const m = ai.board[row][col];
      if (m && m.canAttack && m.attacksThisTurn < m.maxAttacksPerTurn && !m.frozen) {
        const target = chooseAttackTarget(state, aiId, row, col);
        if (target) {
          return {
            type: 'attack',
            row,
            col,
            target,
          };
        }
      }
    }
  }

  return { type: 'end_turn' };
}

export function executeAIDecision(state: GameState, decision: AIDecision): boolean {
  const aiId: 'player' | 'ai' = 'ai';

  switch (decision.type) {
    case 'play_card': {
      if (decision.cardIndex === undefined) return false;
      const card = state.ai.hand[decision.cardIndex];
      if (!card) return false;

      if (card.type === 'minion' && decision.row !== undefined && decision.col !== undefined) {
        return playMinionCard(state, aiId, decision.cardIndex, decision.row, decision.col);
      } else if (card.type === 'spell') {
        return playSpellCard(state, aiId, decision.cardIndex, decision.target || null);
      } else if (card.type === 'weapon') {
        return playWeaponCard(state, aiId, decision.cardIndex);
      }
      return false;
    }
    case 'attack': {
      if (decision.row === undefined || decision.col === undefined || !decision.target) return false;
      return attackTarget(state, aiId, decision.row, decision.col, decision.target);
    }
    case 'end_turn':
      return true;
  }
}
