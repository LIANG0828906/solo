import {
  Card,
  BoardCard,
  Position,
  PlayerState,
  GameState,
  GamePhase,
  TurnPlayer,
  LogType,
  BattleLogEntry,
  SkillType,
  SkillEffect,
} from '../card/CardTypes';
import {
  shuffleDeck,
  drawCards,
  createBoardCard,
  getCardAtPosition,
  getEmptyPositions,
  hasTauntEnemies,
  getTauntEnemies,
  BOARD_ROWS,
  BOARD_COLS,
  INITIAL_HAND_SIZE,
} from '../card/CardDeck';
import { v4 as uuidv4 } from 'uuid';

export const MAX_HEALTH = 20;
export const MAX_MANA = 10;
export const STARTING_MANA = 1;

export function createInitialPlayerState(
  id: string,
  name: string,
  deck: Card[]
): PlayerState {
  const shuffledDeck = shuffleDeck([...deck]);
  const { deck: remainingDeck, hand } = drawCards(
    shuffledDeck,
    [],
    INITIAL_HAND_SIZE
  );

  return {
    id,
    name,
    health: MAX_HEALTH,
    maxHealth: MAX_HEALTH,
    mana: id === 'player' ? STARTING_MANA : 0,
    maxMana: id === 'player' ? STARTING_MANA : 0,
    hand,
    deck: remainingDeck,
    board: [],
    graveyard: [],
  };
}

export function createInitialGameState(
  playerDeck: Card[],
  aiDeck: Card[]
): GameState {
  return {
    phase: GamePhase.PREPARING,
    turn: TurnPlayer.PLAYER,
    turnNumber: 1,
    player: createInitialPlayerState('player', '玩家', playerDeck),
    ai: createInitialPlayerState('ai', 'AI', aiDeck),
    logs: [],
    winner: null,
    selectedCardIndex: null,
    selectedBoardCardId: null,
    isDragging: false,
    dragCard: null,
    skillEffectPlaying: null,
  };
}

export function createLogEntry(
  type: LogType,
  message: string
): BattleLogEntry {
  return {
    id: uuidv4(),
    timestamp: Date.now(),
    type,
    message,
  };
}

export function startGame(state: GameState): GameState {
  const logs = [
    ...state.logs,
    createLogEntry(LogType.SYSTEM, '对战开始！'),
    createLogEntry(LogType.SYSTEM, '你的回合开始'),
  ];

  return {
    ...state,
    phase: GamePhase.PLAYING,
    logs,
  };
}

export function applyPassiveBuffs(
  board: BoardCard[],
  owner: 'player' | 'ai'
): BoardCard[] {
  const ownedCards = board.filter((card) => card.owner === owner);
  let totalAttackBuff = 0;
  let totalDefenseBuff = 0;

  for (const card of ownedCards) {
    if (
      card.skillType === SkillType.PASSIVE_GLOBAL &&
      card.skillEffect === SkillEffect.BUFF_ATTACK_ALLIES
    ) {
      totalAttackBuff += card.skillValue;
    }
    if (
      card.skillType === SkillType.PASSIVE_GLOBAL &&
      card.skillEffect === SkillEffect.BUFF_DEFENSE_ALLIES
    ) {
      totalDefenseBuff += card.skillValue;
    }
  }

  return board.map((card) => {
    if (card.owner === owner) {
      const baseAttack = card.attack;
      const baseDefense = card.maxDefense;
      return {
        ...card,
        currentAttack: baseAttack + totalAttackBuff,
        currentDefense: Math.min(
          baseDefense + totalDefenseBuff,
          card.currentDefense + totalDefenseBuff
        ),
        maxDefense: baseDefense + totalDefenseBuff,
      };
    }
    return card;
  });
}

export function playCard(
  state: GameState,
  cardIndex: number,
  position: Position,
  player: 'player' | 'ai'
): { state: GameState; success: boolean; message: string } {
  const playerState = player === 'player' ? state.player : state.ai;
  const card = playerState.hand[cardIndex];

  if (!card) {
    return { state, success: false, message: '卡牌不存在' };
  }

  if (card.cost > playerState.mana) {
    return { state, success: false, message: '费用不足' };
  }

  if (getCardAtPosition(playerState.board, position)) {
    return { state, success: false, message: '该位置已有卡牌' };
  }

  const emptyPositions = getEmptyPositions(
    [...state.player.board, ...state.ai.board],
    player
  );
  const isValidPosition = emptyPositions.some(
    (p) => p.row === position.row && p.col === position.col
  );

  if (!isValidPosition) {
    return { state, success: false, message: '无效的召唤位置' };
  }

  const boardCard = createBoardCard(card, position, player);
  const newHand = playerState.hand.filter((_, i) => i !== cardIndex);
  const newMana = playerState.mana - card.cost;
  const newBoard = [...playerState.board, boardCard];

  let newState = { ...state };
  const allBoard = [...newBoard, ...(player === 'player' ? state.ai.board : state.player.board)];
  const buffedBoard = applyPassiveBuffs(allBoard, player);

  const playerBoard = buffedBoard.filter((c) => c.owner === player);
  const enemyBoard = buffedBoard.filter((c) => c.owner !== player);

  if (player === 'player') {
    newState.player = {
      ...playerState,
      hand: newHand,
      mana: newMana,
      board: playerBoard,
    };
    newState.ai = { ...state.ai, board: enemyBoard };
  } else {
    newState.ai = {
      ...playerState,
      hand: newHand,
      mana: newMana,
      board: playerBoard,
    };
    newState.player = { ...state.player, board: enemyBoard };
  }

  const logType = player === 'player' ? LogType.PLAYER : LogType.AI;
  const playerName = player === 'player' ? '你' : 'AI';
  const log = createLogEntry(logType, `${playerName}召唤了${card.name}`);
  newState.logs = [...newState.logs, log];

  if (card.skillType === SkillType.ACTIVE_SUMMON && card.skillEffect) {
    newState = applySummonSkill(newState, boardCard, player);
  }

  return { state: newState, success: true, message: '召唤成功' };
}

function applySummonSkill(
  state: GameState,
  card: BoardCard,
  owner: 'player' | 'ai'
): GameState {
  let newState = { ...state };
  const enemyOwner = owner === 'player' ? 'ai' : 'player';
  const ownerName = owner === 'player' ? '你的' : 'AI的';

  switch (card.skillEffect) {
    case SkillEffect.DAMAGE_ALL_ENEMIES: {
      const enemies = enemyOwner === 'player' ? newState.player.board : newState.ai.board;
      let damagedEnemies = enemies.map((e) => ({
        ...e,
        currentDefense: e.currentDefense - card.skillValue,
      }));
      const deadEnemies = damagedEnemies.filter((e) => e.currentDefense <= 0);
      damagedEnemies = damagedEnemies.filter((e) => e.currentDefense > 0);

      if (enemyOwner === 'player') {
        newState.player = {
          ...newState.player,
          board: damagedEnemies,
          graveyard: [...newState.player.graveyard, ...deadEnemies.map((e) => e as unknown as Card)],
        };
      } else {
        newState.ai = {
          ...newState.ai,
          board: damagedEnemies,
          graveyard: [...newState.ai.graveyard, ...deadEnemies.map((e) => e as unknown as Card)],
        };
      }

      const log = createLogEntry(
        LogType.SYSTEM,
        `${ownerName}${card.name}的技能触发，对所有敌方卡牌造成${card.skillValue}点伤害`
      );
      newState.logs = [...newState.logs, log];
      newState.skillEffectPlaying = card.skillEffect;
      break;
    }

    case SkillEffect.DAMAGE_FRONT_ENEMY: {
      const enemies = enemyOwner === 'player' ? newState.player.board : newState.ai.board;
      const frontEnemy = enemies.find(
        (e) => e.position.col === card.position.col && e.position.row < card.position.row
      );

      if (frontEnemy) {
        let damagedEnemy = {
          ...frontEnemy,
          currentDefense: frontEnemy.currentDefense - card.skillValue,
        };

        if (enemyOwner === 'player') {
          if (damagedEnemy.currentDefense <= 0) {
            newState.player = {
              ...newState.player,
              board: newState.player.board.filter((e) => e.instanceId !== frontEnemy.instanceId),
              graveyard: [...newState.player.graveyard, damagedEnemy as unknown as Card],
            };
          } else {
            newState.player = {
              ...newState.player,
              board: newState.player.board.map((e) =>
                e.instanceId === frontEnemy.instanceId ? damagedEnemy : e
              ),
            };
          }
        } else {
          if (damagedEnemy.currentDefense <= 0) {
            newState.ai = {
              ...newState.ai,
              board: newState.ai.board.filter((e) => e.instanceId !== frontEnemy.instanceId),
              graveyard: [...newState.ai.graveyard, damagedEnemy as unknown as Card],
            };
          } else {
            newState.ai = {
              ...newState.ai,
              board: newState.ai.board.map((e) =>
                e.instanceId === frontEnemy.instanceId ? damagedEnemy : e
              ),
            };
          }
        }

        const log = createLogEntry(
          LogType.SYSTEM,
          `${ownerName}${card.name}的技能触发，对${frontEnemy.name}造成${card.skillValue}点伤害`
        );
        newState.logs = [...newState.logs, log];
      }
      break;
    }

    case SkillEffect.HEAL_ALL_ALLIES: {
      const allies = owner === 'player' ? newState.player.board : newState.ai.board;
      const healedAllies = allies.map((a) => ({
        ...a,
        currentDefense: Math.min(a.maxDefense, a.currentDefense + card.skillValue),
      }));

      if (owner === 'player') {
        newState.player = { ...newState.player, board: healedAllies };
      } else {
        newState.ai = { ...newState.ai, board: healedAllies };
      }

      const log = createLogEntry(
        LogType.SYSTEM,
        `${ownerName}${card.name}的技能触发，为所有友方卡牌恢复${card.skillValue}点防御`
      );
      newState.logs = [...newState.logs, log];
      break;
    }

    case SkillEffect.DRAW_CARD: {
      const playerState = owner === 'player' ? newState.player : newState.ai;
      const { deck, hand, drawn } = drawCards(
        playerState.deck,
        playerState.hand,
        card.skillValue
      );

      if (owner === 'player') {
        newState.player = { ...newState.player, deck, hand };
      } else {
        newState.ai = { ...newState.ai, deck, hand };
      }

      const log = createLogEntry(
        LogType.SYSTEM,
        `${ownerName}${card.name}的技能触发，抽了${drawn.length}张牌`
      );
      newState.logs = [...newState.logs, log];
      break;
    }

    case SkillEffect.FREEZE: {
      const enemies = enemyOwner === 'player' ? newState.player.board : newState.ai.board;
      const targets = enemies.slice(0, card.skillValue).map((e) => ({
        ...e,
        isFrozen: true,
      }));

      if (enemyOwner === 'player') {
        newState.player = {
          ...newState.player,
          board: newState.player.board.map((e) => {
            const target = targets.find((t) => t.instanceId === e.instanceId);
            return target || e;
          }),
        };
      } else {
        newState.ai = {
          ...newState.ai,
          board: newState.ai.board.map((e) => {
            const target = targets.find((t) => t.instanceId === e.instanceId);
            return target || e;
          }),
        };
      }

      const log = createLogEntry(
        LogType.SYSTEM,
        `${ownerName}${card.name}的技能触发，冻结了${targets.length}个敌方卡牌`
      );
      newState.logs = [...newState.logs, log];
      break;
    }

    default:
      break;
  }

  return newState;
}

export function attack(
  state: GameState,
  attackerId: string,
  targetId: string | null,
  attackerOwner: 'player' | 'ai'
): { state: GameState; success: boolean; message: string } {
  const attackerBoard =
    attackerOwner === 'player' ? state.player.board : state.ai.board;
  const defenderOwner = attackerOwner === 'player' ? 'ai' : 'player';
  const defenderBoard =
    defenderOwner === 'player' ? state.player.board : state.ai.board;

  const attacker = attackerBoard.find((c) => c.instanceId === attackerId);

  if (!attacker) {
    return { state, success: false, message: '攻击者不存在' };
  }

  if (!attacker.canAttack || attacker.hasAttacked) {
    return { state, success: false, message: '该卡牌本回合无法攻击' };
  }

  if (attacker.isFrozen) {
    return { state, success: false, message: '该卡牌被冻结' };
  }

  if (hasTauntEnemies([...attackerBoard, ...defenderBoard], attackerOwner)) {
    const tauntEnemies = getTauntEnemies(
      [...attackerBoard, ...defenderBoard],
      attackerOwner
    );
    if (targetId && !tauntEnemies.some((e) => e.instanceId === targetId)) {
      return { state, success: false, message: '必须先攻击有嘲讽的卡牌' };
    }
  }

  let newState = { ...state };
  const attackerName = attackerOwner === 'player' ? '你' : 'AI';

  if (targetId) {
    const target = defenderBoard.find((c) => c.instanceId === targetId);
    if (!target) {
      return { state, success: false, message: '目标不存在' };
    }

    let attackDamage = attacker.currentAttack;
    let counterDamage = target.currentAttack;

    if (target.isShielded) {
      attackDamage = Math.max(0, attackDamage - 2);
    }
    if (attacker.isShielded) {
      counterDamage = Math.max(0, counterDamage - 2);
    }

    if (attacker.hasPierce) {
      attackDamage = attacker.currentAttack + (attacker.skillValue || 0);
    }

    const newTargetDefense = target.currentDefense - attackDamage;
    const newAttackerDefense = attacker.currentDefense - counterDamage;

    let newAttackerBoard = attackerBoard.map((c) => {
      if (c.instanceId === attackerId) {
        return {
          ...c,
          currentDefense: newAttackerDefense,
          hasAttacked: true,
          isShielded: false,
        };
      }
      return c;
    });

    let newDefenderBoard = defenderBoard.map((c) => {
      if (c.instanceId === targetId) {
        return {
          ...c,
          currentDefense: newTargetDefense,
          isShielded: false,
        };
      }
      return c;
    });

    const deadAttackers = newAttackerBoard.filter((c) => c.currentDefense <= 0);
    const deadDefenders = newDefenderBoard.filter((c) => c.currentDefense <= 0);

    newAttackerBoard = newAttackerBoard.filter((c) => c.currentDefense > 0);
    newDefenderBoard = newDefenderBoard.filter((c) => c.currentDefense > 0);

    if (attacker.hasLifesteal && attackDamage > 0) {
      const healAmount = attackDamage + (attacker.skillValue || 0);
      if (attackerOwner === 'player') {
        newState.player = {
          ...newState.player,
          health: Math.min(
            newState.player.maxHealth,
            newState.player.health + healAmount
          ),
        };
      } else {
        newState.ai = {
          ...newState.ai,
          health: Math.min(newState.ai.maxHealth, newState.ai.health + healAmount),
        };
      }
    }

    if (attacker.skillType === SkillType.ACTIVE_ATTACK) {
      newState = applyAttackSkill(newState, attacker, target, attackerOwner);
    }

    if (attackerOwner === 'player') {
      newState.player = {
        ...newState.player,
        board: newAttackerBoard,
        graveyard: [
          ...newState.player.graveyard,
          ...deadAttackers.map((c) => c as unknown as Card),
        ],
      };
      newState.ai = {
        ...newState.ai,
        board: newDefenderBoard,
        graveyard: [
          ...newState.ai.graveyard,
          ...deadDefenders.map((c) => c as unknown as Card),
        ],
      };
    } else {
      newState.ai = {
        ...newState.ai,
        board: newAttackerBoard,
        graveyard: [
          ...newState.ai.graveyard,
          ...deadAttackers.map((c) => c as unknown as Card),
        ],
      };
      newState.player = {
        ...newState.player,
        board: newDefenderBoard,
        graveyard: [
          ...newState.player.graveyard,
          ...deadDefenders.map((c) => c as unknown as Card),
        ],
      };
    }

    const log = createLogEntry(
      attackerOwner === 'player' ? LogType.PLAYER : LogType.AI,
      `${attackerName}的${attacker.name}攻击了${target.name}，造成${attackDamage}点伤害`
    );
    newState.logs = [...newState.logs, log];
  } else {
    if (defenderBoard.length > 0) {
      return { state, success: false, message: '战场上有敌方卡牌时不能直接攻击英雄' };
    }

    const damage = attacker.currentAttack;

    if (defenderOwner === 'player') {
      newState.player = {
        ...newState.player,
        health: newState.player.health - damage,
      };
    } else {
      newState.ai = {
        ...newState.ai,
        health: newState.ai.health - damage,
      };
    }

    const newAttackerBoard = attackerBoard.map((c) => {
      if (c.instanceId === attackerId) {
        return { ...c, hasAttacked: true };
      }
      return c;
    });

    if (attackerOwner === 'player') {
      newState.player = { ...newState.player, board: newAttackerBoard };
    } else {
      newState.ai = { ...newState.ai, board: newAttackerBoard };
    }

    if (attacker.hasLifesteal) {
      const healAmount = damage + (attacker.skillValue || 0);
      if (attackerOwner === 'player') {
        newState.player = {
          ...newState.player,
          health: Math.min(newState.player.maxHealth, newState.player.health + healAmount),
        };
      } else {
        newState.ai = {
          ...newState.ai,
          health: Math.min(newState.ai.maxHealth, newState.ai.health + healAmount),
        };
      }
    }

    const log = createLogEntry(
      attackerOwner === 'player' ? LogType.PLAYER : LogType.AI,
      `${attackerName}的${attacker.name}直接攻击，造成${damage}点伤害`
    );
    newState.logs = [...newState.logs, log];
  }

  newState = checkGameEnd(newState);

  return { state: newState, success: true, message: '攻击成功' };
}

function applyAttackSkill(
  state: GameState,
  attacker: BoardCard,
  target: BoardCard,
  attackerOwner: 'player' | 'ai'
): GameState {
  let newState = { ...state };
  const defenderOwner = attackerOwner === 'player' ? 'ai' : 'player';
  const ownerName = attackerOwner === 'player' ? '你的' : 'AI的';

  switch (attacker.skillEffect) {
    case SkillEffect.BURN: {
      const defenderBoard =
        defenderOwner === 'player' ? newState.player.board : newState.ai.board;
      const updatedBoard = defenderBoard.map((c) =>
        c.instanceId === target.instanceId
          ? { ...c, burnDamage: c.burnDamage + attacker.skillValue }
          : c
      );

      if (defenderOwner === 'player') {
        newState.player = { ...newState.player, board: updatedBoard };
      } else {
        newState.ai = { ...newState.ai, board: updatedBoard };
      }

      const log = createLogEntry(
        LogType.SYSTEM,
        `${ownerName}${attacker.name}的灼烧效果触发，${target.name}受到${attacker.skillValue}点灼烧伤害`
      );
      newState.logs = [...newState.logs, log];
      break;
    }

    case SkillEffect.FREEZE: {
      const defenderBoard =
        defenderOwner === 'player' ? newState.player.board : newState.ai.board;
      const updatedBoard = defenderBoard.map((c) =>
        c.instanceId === target.instanceId ? { ...c, isFrozen: true } : c
      );

      if (defenderOwner === 'player') {
        newState.player = { ...newState.player, board: updatedBoard };
      } else {
        newState.ai = { ...newState.ai, board: updatedBoard };
      }

      const log = createLogEntry(
        LogType.SYSTEM,
        `${ownerName}${attacker.name}的冰冻效果触发，${target.name}被冻结`
      );
      newState.logs = [...newState.logs, log];
      break;
    }

    case SkillEffect.DRAW_CARD: {
      const playerState =
        attackerOwner === 'player' ? newState.player : newState.ai;
      const { deck, hand } = drawCards(
        playerState.deck,
        playerState.hand,
        attacker.skillValue
      );

      if (attackerOwner === 'player') {
        newState.player = { ...newState.player, deck, hand };
      } else {
        newState.ai = { ...newState.ai, deck, hand };
      }

      const log = createLogEntry(
        LogType.SYSTEM,
        `${ownerName}${attacker.name}的技能触发，抽了${attacker.skillValue}张牌`
      );
      newState.logs = [...newState.logs, log];
      break;
    }

    default:
      break;
  }

  return newState;
}

export function endTurn(state: GameState): GameState {
  let newState = { ...state };
  const currentPlayer = state.turn;
  const nextPlayer = currentPlayer === TurnPlayer.PLAYER ? TurnPlayer.AI : TurnPlayer.PLAYER;

  const currentBoard =
    currentPlayer === TurnPlayer.PLAYER ? newState.player.board : newState.ai.board;

  const burnedBoard = currentBoard.map((card) => {
    if (card.burnDamage > 0) {
      return {
        ...card,
        currentDefense: card.currentDefense - card.burnDamage,
      };
    }
    return card;
  });

  const deadCards = burnedBoard.filter((c) => c.currentDefense <= 0);
  const aliveBoard = burnedBoard.filter((c) => c.currentDefense > 0);

  if (currentPlayer === TurnPlayer.PLAYER) {
    newState.player = {
      ...newState.player,
      board: aliveBoard,
      graveyard: [
        ...newState.player.graveyard,
        ...deadCards.map((c) => c as unknown as Card),
      ],
    };
  } else {
    newState.ai = {
      ...newState.ai,
      board: aliveBoard,
      graveyard: [
        ...newState.ai.graveyard,
        ...deadCards.map((c) => c as unknown as Card),
      ],
    };
  }

  newState.turn = nextPlayer;
  if (nextPlayer === TurnPlayer.PLAYER) {
    newState.turnNumber += 1;
  }

  const nextPlayerState =
    nextPlayer === TurnPlayer.PLAYER ? newState.player : newState.ai;
  const newMaxMana = Math.min(MAX_MANA, nextPlayerState.maxMana + 1);
  const { deck, hand, drawn } = drawCards(
    nextPlayerState.deck,
    nextPlayerState.hand,
    1
  );

  const nextBoard = nextPlayer === TurnPlayer.PLAYER ? newState.player.board : newState.ai.board;
  const refreshedBoard = nextBoard.map((card) => ({
    ...card,
    canAttack: !card.isFrozen,
    hasAttacked: false,
    isFrozen: false,
    burnDamage: 0,
  }));

  if (nextPlayer === TurnPlayer.PLAYER) {
    newState.player = {
      ...newState.player,
      maxMana: newMaxMana,
      mana: newMaxMana,
      deck,
      hand,
      board: refreshedBoard,
    };
  } else {
    newState.ai = {
      ...newState.ai,
      maxMana: newMaxMana,
      mana: newMaxMana,
      deck,
      hand,
      board: refreshedBoard,
    };
  }

  const allBoard = [...newState.player.board, ...newState.ai.board];
  const playerBuffed = applyPassiveBuffs(allBoard, 'player');
  const aiBuffed = applyPassiveBuffs(playerBuffed, 'ai');

  newState.player = {
    ...newState.player,
    board: aiBuffed.filter((c) => c.owner === 'player'),
  };
  newState.ai = {
    ...newState.ai,
    board: aiBuffed.filter((c) => c.owner === 'ai'),
  };

  const playerName = nextPlayer === TurnPlayer.PLAYER ? '你的' : 'AI的';
  const log = createLogEntry(LogType.SYSTEM, `${playerName}回合开始`);
  newState.logs = [...newState.logs, log];

  newState = checkGameEnd(newState);

  return newState;
}

export function checkGameEnd(state: GameState): GameState {
  if (state.player.health <= 0) {
    return {
      ...state,
      phase: GamePhase.ENDED,
      winner: TurnPlayer.AI,
      logs: [
        ...state.logs,
        createLogEntry(LogType.SYSTEM, '游戏结束，AI获胜！'),
      ],
    };
  }

  if (state.ai.health <= 0) {
    return {
      ...state,
      phase: GamePhase.ENDED,
      winner: TurnPlayer.PLAYER,
      logs: [
        ...state.logs,
        createLogEntry(LogType.SYSTEM, '游戏结束，你获胜了！'),
      ],
    };
  }

  return state;
}

export function canPlayCard(
  state: GameState,
  cardIndex: number,
  player: 'player' | 'ai'
): boolean {
  const playerState = player === 'player' ? state.player : state.ai;
  const card = playerState.hand[cardIndex];

  if (!card) return false;
  if (card.cost > playerState.mana) return false;

  const emptyPositions = getEmptyPositions(
    [...state.player.board, ...state.ai.board],
    player
  );
  return emptyPositions.length > 0;
}

export function canAttackTarget(
  state: GameState,
  attackerId: string,
  targetId: string,
  attackerOwner: 'player' | 'ai'
): boolean {
  const attackerBoard =
    attackerOwner === 'player' ? state.player.board : state.ai.board;
  const defenderOwner = attackerOwner === 'player' ? 'ai' : 'player';
  const defenderBoard =
    defenderOwner === 'player' ? state.player.board : state.ai.board;

  const attacker = attackerBoard.find((c) => c.instanceId === attackerId);
  const target = defenderBoard.find((c) => c.instanceId === targetId);

  if (!attacker || !target) return false;
  if (!attacker.canAttack || attacker.hasAttacked) return false;
  if (attacker.isFrozen) return false;

  if (hasTauntEnemies([...attackerBoard, ...defenderBoard], attackerOwner)) {
    if (!target.hasTaunt) return false;
  }

  return true;
}
