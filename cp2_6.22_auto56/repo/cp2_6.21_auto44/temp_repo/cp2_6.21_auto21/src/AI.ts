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
  canMinionAttack,
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

function calculateMinionBaseScore(m: MinionCard): number {
  return m.attack * 2 + m.health * 1.5;
}

function calculateCostEfficiency(card: Card, baseScore: number): number {
  if (card.cost === 0) return baseScore;
  const expectedValue = card.cost * 2 + 1;
  const efficiency = baseScore / Math.max(expectedValue, 1);
  if (efficiency < 0.7) {
    return baseScore - 5;
  } else if (efficiency < 0.9) {
    return baseScore - 2;
  } else if (efficiency > 1.2) {
    return baseScore + 3;
  }
  return baseScore;
}

export function evaluateCard(card: Card, player: PlayerState, enemy: PlayerState): number {
  let score = 0;

  if (card.type === 'minion') {
    const m = card as MinionCard;
    let minionScore = calculateMinionBaseScore(m);

    if (m.taunt) minionScore += 3;
    if (m.charge) minionScore += 4;
    if (m.battlecry) {
      minionScore += evaluateEffect(m.battlecry, player, enemy);
    }
    if (m.deathrattle) {
      minionScore += 2;
    }

    const boardFull = getBoardMinions(player).length >= BOARD_ROWS * BOARD_COLS - 1;
    if (boardFull) minionScore -= 4;

    score = calculateCostEfficiency(card, minionScore);
    score += (10 - card.cost) * 0.3;
  } else if (card.type === 'spell') {
    const s = card as SpellCard;
    let spellScore = evaluateEffect(s.effect, player, enemy);
    score = calculateCostEfficiency(card, spellScore);
  } else if (card.type === 'weapon') {
    const weaponValue = card.attack * card.durability;
    let weaponScore = weaponValue + 2;

    const hasEnemyTaunt = getBoardMinions(enemy).some((m) => m.taunt);
    if (hasEnemyTaunt) weaponScore += 2;

    score = calculateCostEfficiency(card, weaponScore);
  }

  return Math.round(score * 100) / 100;
}

function evaluateEffect(effect: SpellEffect, player: PlayerState, enemy: PlayerState): number {
  let score = 0;
  switch (effect.type) {
    case 'damage': {
      const baseDamage = effect.value || 0;
      score += baseDamage * 1.5;

      if (effect.target === 'any' || effect.target === 'enemy') {
        if (enemy.hero.health <= baseDamage) {
          score += 500;
        }
        const enemyMinions = getBoardMinions(enemy);
        for (const m of enemyMinions) {
          if (m.currentHealth <= baseDamage) {
            score += 5 + m.attack * 1.5;
          }
        }
      }
      break;
    }
    case 'aoe_damage': {
      const damage = effect.value || 0;
      const enemyMinions = getBoardMinions(enemy);
      let killCount = 0;
      let totalDamage = 0;
      let threatRemoved = 0;

      enemyMinions.forEach((m) => {
        totalDamage += Math.min(damage, m.currentHealth);
        if (m.currentHealth <= damage) {
          killCount++;
          threatRemoved += m.attack;
        }
      });

      score += totalDamage * 1.5;
      score += killCount * 10;
      score += threatRemoved * 2;

      if (killCount === enemyMinions.length && enemyMinions.length >= 2) {
        score += 30;
      }

      const friendlyMinions = getBoardMinions(player);
      if (effect.target === 'all' || effect.target === 'friendly') {
        let friendlyLoss = 0;
        friendlyMinions.forEach((m) => {
          if (m.currentHealth <= damage) {
            friendlyLoss += m.attack * 2 + m.maxHealth;
          }
        });
        score -= friendlyLoss;
      }
      break;
    }
    case 'heal': {
      const healAmount = effect.value || 0;
      const healthDeficit = player.hero.maxHealth - player.hero.health;
      const actualHeal = Math.min(healAmount, healthDeficit);
      score += actualHeal * 1.2;

      if (player.hero.health < 10) {
        score += healAmount * 2;
      } else if (player.hero.health < 20) {
        score += healAmount * 0.5;
      }

      if (actualHeal < healAmount * 0.3) {
        score -= 5;
      }
      break;
    }
    case 'heal_all': {
      const healAmount = effect.value || 0;
      let totalHealed = 0;
      const heroDeficit = player.hero.maxHealth - player.hero.health;
      totalHealed += Math.min(healAmount, heroDeficit);

      const playerMinions = getBoardMinions(player);
      playerMinions.forEach((m) => {
        totalHealed += Math.min(healAmount, m.maxHealth - m.currentHealth);
      });

      score += totalHealed * 1.3;
      if (player.hero.health < 15) score += 8;
      break;
    }
    case 'draw': {
      const drawCount = effect.count || 1;
      score += drawCount * 3;

      const currentHandSize = player.hand.length;
      if (currentHandSize <= 3) {
        score += drawCount * 2;
      } else if (currentHandSize >= 8) {
        score -= drawCount * 4;
      }

      if (player.deck.length < drawCount) {
        score -= 3;
      }

      if (player.mana.current <= 2) {
        score += drawCount;
      }
      break;
    }
    case 'summon': {
      const summonCount = effect.count || 1;
      const boardSpace = BOARD_ROWS * BOARD_COLS - getBoardMinions(player).length;
      const actualSummons = Math.min(summonCount, boardSpace);

      let minionValue = 0;
      if (effect.token) {
        minionValue = (effect.token.attack * 2 + effect.token.health * 1.5);
        if (effect.token.charge) minionValue += effect.token.attack * 1.5;
        if (effect.token.taunt) minionValue += 2;
      } else {
        minionValue = 6;
      }

      score += actualSummons * minionValue;
      if (boardSpace < summonCount) {
        score -= (summonCount - boardSpace) * 3;
      }
      break;
    }
    case 'buff': {
      const buffValue = effect.value || 0;
      const playerMinions = getBoardMinions(player);
      if (playerMinions.length === 0) {
        score -= 10;
      } else {
        let bestBuff = 0;
        playerMinions.forEach((m) => {
          let tempScore = buffValue * 1.5;
          if (canMinionAttack(m)) {
            tempScore += buffValue;
          }
          if (m.currentHealth > 3) {
            tempScore += 2;
          }
          if (tempScore > bestBuff) bestBuff = tempScore;
        });
        score += bestBuff;
      }
      break;
    }
    case 'freeze': {
      score += 4;
      const enemyMinions = getBoardMinions(enemy);
      const highThreats = enemyMinions.filter((m) => m.attack >= 4).length;
      score += highThreats * 3;
      break;
    }
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
      const damage = effect.value || 0;

      let heroScore = 5;
      if (enemy.hero.health <= damage) heroScore = 10000;
      targets.push({ target: { type: 'hero', side: enemyId }, score: heroScore });

      targets.sort((a, b) => b.score - a.score);
      return targets[0]?.target || null;
    }
  }

  if (effect.type === 'heal') {
    const targets: ScoredTarget[] = [];
    if (caster.hero.health < caster.hero.maxHealth) {
      const deficit = caster.hero.maxHealth - caster.hero.health;
      targets.push({
        target: { type: 'hero', side: casterId },
        score: deficit * 2 + (caster.hero.health < 15 ? 20 : 0),
      });
    }
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const m = caster.board[row][col];
        if (m && m.currentHealth < m.maxHealth) {
          const deficit = m.maxHealth - m.currentHealth;
          targets.push({
            target: { type: 'minion', side: casterId, row, col, instanceId: m.instanceId },
            score: deficit * 1.5 + m.attack,
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
            score: m.attack * 2 + (canMinionAttack(m) ? 10 : 0) + (m.currentHealth > 3 ? 5 : 0),
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
          score: m.attack * 2 + (5 - m.currentHealth) * 2 + (m.taunt ? 8 : 0),
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
        score += 25 + m.attack * 3 + m.maxHealth;
      } else {
        score += Math.min(attacker.attack, m.currentHealth) * 1.5;
      }
      if (attacker.currentHealth <= m.attack) {
        score -= 15 + attacker.attack * 2;
      }
      if (m.taunt) score += 12;
      if (m.attack >= 5) score += 8;
      targets.push({ target, score });
    }
  }

  if (!hasTaunt) {
    const heroTarget: Target = { type: 'hero', side: defenderSide };
    if (canAttackTarget(state, attackerSide, attackerRow, attackerCol, heroTarget)) {
      let score = attacker.attack * 2.5;
      if (defenderPlayer.hero.health <= attacker.attack) {
        score += 10000;
      }
      if (defenderPlayer.hero.health <= 10) {
        score += attacker.attack * 3;
      }
      if (getBoardMinions(defenderPlayer).length === 0) {
        score += 5;
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
    if (best.score <= 0 && playable.length > 1) {
    }
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
        } else {
          if (playable.length > 1) {
            const altCard = playable.find(
              (c) => !needsTarget((c.card as SpellCard).effect) || c.card.type !== 'spell'
            );
            if (altCard) {
              return makeDecisionFromCard(state, altCard);
            }
          }
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
      if (m && canMinionAttack(m)) {
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

function makeDecisionFromCard(state: GameState, scored: ScoredCard): AIDecision | null {
  const aiId: 'player' | 'ai' = 'ai';
  const card = scored.card;

  if (card.type === 'minion') {
    const placement = findBestPlacement(state, aiId);
    if (placement) {
      return {
        type: 'play_card',
        cardIndex: scored.index,
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
          cardIndex: scored.index,
          target,
        };
      }
    } else {
      return {
        type: 'play_card',
        cardIndex: scored.index,
      };
    }
  } else if (card.type === 'weapon') {
    return {
      type: 'play_card',
      cardIndex: scored.index,
    };
  }
  return null;
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
