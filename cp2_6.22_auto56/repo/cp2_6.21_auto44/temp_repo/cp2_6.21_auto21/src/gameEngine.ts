import {
  Card,
  MinionCard,
  SpellCard,
  WeaponCard,
  SpellEffect,
  TOKEN_CARDS,
  tokenDefinitionToMinionCard,
  DeathrattleEffect,
} from './card';
import {
  PlayerState,
  BoardMinion,
  BOARD_ROWS,
  BOARD_COLS,
  createBoardMinion,
  placeMinion,
  removeDeadMinions,
  damageHero,
  damageMinion,
  healHero,
  drawCards,
  findEmptyCell,
  getBoardMinions,
  canMinionAttack,
} from './player';

export type Phase = 'draw' | 'main' | 'combat' | 'end';

export interface Target {
  type: 'hero' | 'minion';
  side: 'player' | 'ai';
  row?: number;
  col?: number;
  instanceId?: string;
}

export interface GameState {
  turn: number;
  currentPlayer: 'player' | 'ai';
  phase: Phase;
  player: PlayerState;
  ai: PlayerState;
  selectedCardIndex: number | null;
  selectedMinion: { side: 'player' | 'ai'; row: number; col: number } | null;
  pendingTarget: { cardIndex: number; effect: SpellEffect } | null;
  cardsPlayedThisTurn: number;
  attacksMadeThisTurn: number;
  gameOver: boolean;
  winner: 'player' | 'ai' | null;
  isAiThinking: boolean;
  battleLog: string[];
  animationState: {
    flyingCard: { from: { x: number; y: number }; to: { x: number; y: number } } | null;
    screenShake: boolean;
    damagingTargets: string[];
  };
}

export type DeathrattleCallback = (
  state: GameState,
  ownerSide: 'player' | 'ai',
  deadMinion: BoardMinion,
  deathrattle: DeathrattleEffect
) => void;

export const deathrattleCallbacks: DeathrattleCallback[] = [];

export function registerDeathrattleCallback(callback: DeathrattleCallback): void {
  deathrattleCallbacks.push(callback);
}

function triggerDeathrattles(
  state: GameState,
  ownerSide: 'player' | 'ai',
  deadMinions: BoardMinion[]
): void {
  deadMinions.forEach((minion) => {
    if (minion.deathrattle) {
      addLog(state, `${minion.name} 的亡语触发！`);
      executeDeathrattle(state, ownerSide, minion, minion.deathrattle);
      deathrattleCallbacks.forEach((cb) => {
        cb(state, ownerSide, minion, minion.deathrattle!);
      });
    }
  });
}

function executeDeathrattle(
  state: GameState,
  ownerSide: 'player' | 'ai',
  deadMinion: BoardMinion,
  deathrattle: DeathrattleEffect
): void {
  const owner = ownerSide === 'player' ? state.player : state.ai;
  const enemySide = ownerSide === 'player' ? 'ai' : 'player';
  const enemy = enemySide === 'player' ? state.player : state.ai;

  switch (deathrattle.type) {
    case 'damage': {
      if (deathrattle.target === 'all' || deathrattle.target === 'enemy') {
        const targetPlayer = deathrattle.target === 'all' ? enemy : enemy;
        const minions = getBoardMinions(targetPlayer);
        minions.forEach((m) => {
          damageMinion(m, deathrattle.value || 0);
          state.animationState.damagingTargets.push(m.instanceId);
        });
        if (deathrattle.target === 'all') {
          damageHero(targetPlayer, deathrattle.value || 0);
        }
        state.animationState.screenShake = true;
      }
      break;
    }
    case 'summon': {
      if (deathrattle.token) {
        const tokenCard = tokenDefinitionToMinionCard(deathrattle.token);
        for (let i = 0; i < (deathrattle.count || 1); i++) {
          const emptyCell = findEmptyCell(owner);
          if (emptyCell) {
            const minion = createBoardMinion(tokenCard);
            placeMinion(owner, minion, emptyCell.row, emptyCell.col);
          }
        }
        addLog(state, `召唤了 ${deathrattle.count} 个 ${deathrattle.token.name}`);
      }
      break;
    }
    case 'draw': {
      const drawn = drawCards(owner, deathrattle.count || 1);
      addLog(state, `抽了 ${drawn.length} 张牌`);
      break;
    }
    case 'heal': {
      healHero(owner, deathrattle.value || 0);
      const minions = getBoardMinions(owner);
      if (deathrattle.target === 'all' || deathrattle.target === 'friendly') {
        minions.forEach((m) => {
          m.currentHealth = Math.min(m.maxHealth, m.currentHealth + (deathrattle.value || 0));
        });
      }
      addLog(state, `恢复了 ${deathrattle.value} 点生命值`);
      break;
    }
  }
}

export function canPlayCard(
  state: GameState,
  playerId: 'player' | 'ai',
  cardIndex: number
): boolean {
  const player = playerId === 'player' ? state.player : state.ai;
  if (state.currentPlayer !== playerId) return false;
  if (state.phase !== 'main') return false;
  if (cardIndex < 0 || cardIndex >= player.hand.length) return false;
  const card = player.hand[cardIndex];
  return card.cost <= player.mana.current;
}

export function playMinionCard(
  state: GameState,
  playerId: 'player' | 'ai',
  cardIndex: number,
  row: number,
  col: number
): boolean {
  if (!canPlayCard(state, playerId, cardIndex)) return false;
  const player = playerId === 'player' ? state.player : state.ai;
  const card = player.hand[cardIndex] as MinionCard;
  if (card.type !== 'minion') return false;
  if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return false;
  if (player.board[row][col]) return false;

  player.mana.current -= card.cost;
  player.hand.splice(cardIndex, 1);
  state.cardsPlayedThisTurn++;

  const minion = createBoardMinion(card);
  placeMinion(player, minion, row, col);

  addLog(state, `${player.name} 召唤了 ${card.name}`);

  if (card.battlecry) {
    executeSpellEffect(state, playerId, card.battlecry, null);
  }

  cleanupDeadMinions(state);
  checkGameOver(state);
  return true;
}

export function playSpellCard(
  state: GameState,
  playerId: 'player' | 'ai',
  cardIndex: number,
  target: Target | null
): boolean {
  if (!canPlayCard(state, playerId, cardIndex)) return false;
  const player = playerId === 'player' ? state.player : state.ai;
  const card = player.hand[cardIndex] as SpellCard;
  if (card.type !== 'spell') return false;

  if (needsTarget(card.effect) && !target) {
    return false;
  }

  player.mana.current -= card.cost;
  player.hand.splice(cardIndex, 1);
  state.cardsPlayedThisTurn++;

  addLog(state, `${player.name} 施放了 ${card.name}`);
  executeSpellEffect(state, playerId, card.effect, target);

  cleanupDeadMinions(state);
  checkGameOver(state);
  return true;
}

export function playWeaponCard(
  state: GameState,
  playerId: 'player' | 'ai',
  cardIndex: number
): boolean {
  if (!canPlayCard(state, playerId, cardIndex)) return false;
  const player = playerId === 'player' ? state.player : state.ai;
  const card = player.hand[cardIndex] as WeaponCard;
  if (card.type !== 'weapon') return false;

  player.mana.current -= card.cost;
  player.hand.splice(cardIndex, 1);
  state.cardsPlayedThisTurn++;

  player.weapon = {
    cardId: card.id,
    name: card.name,
    attack: card.attack,
    durability: card.durability,
  };

  addLog(state, `${player.name} 装备了 ${card.name}`);
  return true;
}

export function needsTarget(effect: SpellEffect): boolean {
  if (effect.type === 'damage' || effect.type === 'heal' || effect.type === 'buff') {
    return effect.target === 'any' || effect.target === 'enemy' || effect.target === 'friendly';
  }
  return false;
}

function executeSpellEffect(
  state: GameState,
  casterId: 'player' | 'ai',
  effect: SpellEffect,
  target: Target | null
): void {
  const enemyId = casterId === 'player' ? 'ai' : 'player';
  const caster = casterId === 'player' ? state.player : state.ai;
  const enemy = enemyId === 'player' ? state.player : state.ai;

  switch (effect.type) {
    case 'damage': {
      if (target) {
        const targetPlayer = target.side === 'player' ? state.player : state.ai;
        if (target.type === 'hero') {
          damageHero(targetPlayer, effect.value || 0);
          addLog(state, `对 ${targetPlayer.name} 造成 ${effect.value} 点伤害`);
        } else if (target.row !== undefined && target.col !== undefined) {
          const minion = targetPlayer.board[target.row][target.col];
          if (minion) {
            damageMinion(minion, effect.value || 0);
            state.animationState.damagingTargets.push(minion.instanceId);
            addLog(state, `对 ${minion.name} 造成 ${effect.value} 点伤害`);
          }
        }
      }
      state.animationState.screenShake = true;
      break;
    }
    case 'aoe_damage': {
      const targetPlayer = effect.target === 'enemy' ? enemy : caster;
      const minions = getBoardMinions(targetPlayer);
      minions.forEach((m) => {
        damageMinion(m, effect.value || 0);
        state.animationState.damagingTargets.push(m.instanceId);
      });
      state.animationState.screenShake = true;
      addLog(state, `对所有敌方随从造成 ${effect.value} 点伤害`);
      break;
    }
    case 'heal': {
      if (target) {
        const targetPlayer = target.side === 'player' ? state.player : state.ai;
        if (target.type === 'hero') {
          healHero(targetPlayer, effect.value || 0);
          addLog(state, `为 ${targetPlayer.name} 恢复 ${effect.value} 点生命值`);
        } else if (target.row !== undefined && target.col !== undefined) {
          const minion = targetPlayer.board[target.row][target.col];
          if (minion) {
            minion.currentHealth = Math.min(minion.maxHealth, minion.currentHealth + (effect.value || 0));
            addLog(state, `为 ${minion.name} 恢复 ${effect.value} 点生命值`);
          }
        }
      }
      break;
    }
    case 'heal_all': {
      const targetPlayer = effect.target === 'enemy' ? enemy : caster;
      healHero(targetPlayer, effect.value || 0);
      const minions = getBoardMinions(targetPlayer);
      minions.forEach((m) => {
        m.currentHealth = Math.min(m.maxHealth, m.currentHealth + (effect.value || 0));
      });
      addLog(state, `为所有友方角色恢复 ${effect.value} 点生命值`);
      break;
    }
    case 'draw': {
      const drawn = drawCards(caster, effect.count || 1);
      addLog(state, `抽了 ${drawn.length} 张牌`);
      break;
    }
    case 'summon': {
      let tokenCard: MinionCard | null = null;
      if (effect.token) {
        tokenCard = tokenDefinitionToMinionCard(effect.token);
      } else if (effect.summonId) {
        tokenCard = TOKEN_CARDS[effect.summonId] || null;
      }
      if (tokenCard) {
        for (let i = 0; i < (effect.count || 1); i++) {
          const emptyCell = findEmptyCell(caster);
          if (emptyCell) {
            const minion = createBoardMinion(tokenCard);
            placeMinion(caster, minion, emptyCell.row, emptyCell.col);
          }
        }
        addLog(state, `召唤了 ${effect.count} 个 ${tokenCard.name}`);
      }
      break;
    }
    case 'buff': {
      if (target && target.row !== undefined && target.col !== undefined) {
        const targetPlayer = target.side === 'player' ? state.player : state.ai;
        const minion = targetPlayer.board[target.row][target.col];
        if (minion) {
          minion.attack += effect.value || 0;
          addLog(state, `${minion.name} 获得 +${effect.value}/+0`);
        }
      }
      break;
    }
    case 'freeze': {
      if (target && target.row !== undefined && target.col !== undefined) {
        const targetPlayer = target.side === 'player' ? state.player : state.ai;
        const minion = targetPlayer.board[target.row][target.col];
        if (minion) {
          minion.frozen = true;
          minion.canAttack = false;
          addLog(state, `${minion.name} 被冻结了`);
        }
      }
      break;
    }
  }
}

export function canAttackTarget(
  state: GameState,
  attackerSide: 'player' | 'ai',
  attackerRow: number,
  attackerCol: number,
  target: Target
): boolean {
  const attackerPlayer = attackerSide === 'player' ? state.player : state.ai;
  const attacker = attackerPlayer.board[attackerRow][attackerCol];
  if (!attacker) return false;
  if (!canMinionAttack(attacker)) return false;
  if (state.currentPlayer !== attackerSide) return false;

  const defenderSide = target.side;
  if (defenderSide === attackerSide) return false;

  const defenderPlayer = defenderSide === 'player' ? state.player : state.ai;
  const enemyMinions = getBoardMinions(defenderPlayer);
  const hasTaunt = enemyMinions.some((m) => m.taunt);

  if (hasTaunt) {
    if (target.type === 'hero') return false;
    if (target.row !== undefined && target.col !== undefined) {
      const targetMinion = defenderPlayer.board[target.row][target.col];
      if (!targetMinion || !targetMinion.taunt) return false;
    }
  }

  if (target.type === 'minion' && target.row !== undefined && target.col !== undefined) {
    const targetMinion = defenderPlayer.board[target.row][target.col];
    if (!targetMinion) return false;
  }

  return true;
}

export function attackTarget(
  state: GameState,
  attackerSide: 'player' | 'ai',
  attackerRow: number,
  attackerCol: number,
  target: Target
): boolean {
  if (!canAttackTarget(state, attackerSide, attackerRow, attackerCol, target)) return false;

  const attackerPlayer = attackerSide === 'player' ? state.player : state.ai;
  const defenderSide = target.side;
  const defenderPlayer = defenderSide === 'player' ? state.player : state.ai;

  const attacker = attackerPlayer.board[attackerRow][attackerCol];
  if (!attacker) return false;

  state.animationState.screenShake = true;
  state.attacksMadeThisTurn++;

  if (target.type === 'hero') {
    damageHero(defenderPlayer, attacker.attack);
    addLog(state, `${attacker.name} 攻击了 ${defenderPlayer.name}，造成 ${attacker.attack} 点伤害`);
  } else if (target.row !== undefined && target.col !== undefined) {
    const defender = defenderPlayer.board[target.row][target.col];
    if (defender) {
      const overflowDamage = Math.max(0, attacker.attack - defender.maxHealth);
      damageMinion(defender, attacker.attack);
      damageMinion(attacker, defender.attack);
      state.animationState.damagingTargets.push(attacker.instanceId);
      state.animationState.damagingTargets.push(defender.instanceId);
      const logMsg = overflowDamage > 0
        ? `${attacker.name} 与 ${defender.name} 交战，溢出伤害 ${overflowDamage}`
        : `${attacker.name} 与 ${defender.name} 交战`;
      addLog(state, logMsg);
    }
  }

  attacker.attacksThisTurn++;
  if (!canMinionAttack(attacker)) {
    attacker.canAttack = false;
  }

  cleanupDeadMinions(state);
  checkGameOver(state);
  return true;
}

function cleanupDeadMinions(state: GameState): void {
  let allDead: { side: 'player' | 'ai'; minion: BoardMinion }[] = [];
  let hasDeaths = true;
  let iterations = 0;
  const maxIterations = 10;

  while (hasDeaths && iterations < maxIterations) {
    hasDeaths = false;
    iterations++;

    const playerDead = removeDeadMinions(state.player);
    const aiDead = removeDeadMinions(state.ai);

    playerDead.forEach((m) => {
      allDead.push({ side: 'player', minion: m });
      addLog(state, `${state.player.name} 的 ${m.name} 被消灭了`);
      hasDeaths = true;
    });
    aiDead.forEach((m) => {
      allDead.push({ side: 'ai', minion: m });
      addLog(state, `${state.ai.name} 的 ${m.name} 被消灭了`);
      hasDeaths = true;
    });

    allDead.forEach(({ side, minion }) => {
      triggerDeathrattles(state, side, [minion]);
    });
    allDead = [];
  }
}

export function canTransitionToEnd(state: GameState): boolean {
  return true;
}

export function checkGameOver(state: GameState): void {
  if (state.player.hero.health <= 0) {
    state.gameOver = true;
    state.winner = 'ai';
    addLog(state, `${state.ai.name} 获胜！`);
  } else if (state.ai.hero.health <= 0) {
    state.gameOver = true;
    state.winner = 'player';
    addLog(state, `${state.player.name} 获胜！`);
  }
}

export function addLog(state: GameState, message: string): void {
  state.battleLog.push(`[回合${state.turn}] ${message}`);
  if (state.battleLog.length > 50) {
    state.battleLog.shift();
  }
}
