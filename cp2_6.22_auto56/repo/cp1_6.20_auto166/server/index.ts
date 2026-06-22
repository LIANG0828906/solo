import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type {
  Card,
  GameState,
  Player,
  BattleLogEntry,
  AIAction,
} from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const CARD_POOL: Omit<Card, 'instanceId'>[] = [
  {
    id: 'minion_1',
    name: '新兵战士',
    cost: 1,
    type: 'minion',
    attack: 1,
    health: 2,
    maxHealth: 2,
    effect: 'none',
    description: '初出茅庐的战士',
  },
  {
    id: 'minion_2',
    name: '盾卫',
    cost: 2,
    type: 'minion',
    attack: 1,
    health: 4,
    maxHealth: 4,
    effect: 'taunt',
    description: '嘲讽 - 敌方必须先攻击此随从',
  },
  {
    id: 'minion_3',
    name: '侦察兵',
    cost: 1,
    type: 'minion',
    attack: 2,
    health: 1,
    maxHealth: 1,
    effect: 'charge',
    description: '冲锋 - 召唤当回合即可攻击',
  },
  {
    id: 'minion_4',
    name: '圣骑士',
    cost: 3,
    type: 'minion',
    attack: 3,
    health: 3,
    maxHealth: 3,
    effect: 'none',
    description: '均衡的神圣战士',
  },
  {
    id: 'minion_5',
    name: '狂战士',
    cost: 4,
    type: 'minion',
    attack: 4,
    health: 3,
    maxHealth: 3,
    effect: 'charge',
    description: '冲锋 - 召唤当回合即可攻击',
  },
  {
    id: 'minion_6',
    name: '钢铁巨像',
    cost: 5,
    type: 'minion',
    attack: 3,
    health: 7,
    maxHealth: 7,
    effect: 'taunt',
    description: '嘲讽 - 坚不可摧的守护者',
  },
  {
    id: 'minion_7',
    name: '火枪手',
    cost: 3,
    type: 'minion',
    attack: 4,
    health: 2,
    maxHealth: 2,
    effect: 'none',
    description: '高攻击的远程射手',
  },
  {
    id: 'minion_8',
    name: '恶魔猎手',
    cost: 6,
    type: 'minion',
    attack: 6,
    health: 5,
    maxHealth: 5,
    effect: 'none',
    description: '强大的高阶战士',
  },
  {
    id: 'minion_9',
    name: '精灵弓手',
    cost: 2,
    type: 'minion',
    attack: 2,
    health: 2,
    maxHealth: 2,
    effect: 'none',
    description: '灵巧的森林守卫',
  },
  {
    id: 'minion_10',
    name: '龙骑士',
    cost: 7,
    type: 'minion',
    attack: 7,
    health: 6,
    maxHealth: 6,
    effect: 'charge',
    description: '冲锋 - 骑龙而来的勇士',
  },
  {
    id: 'spell_1',
    name: '火球术',
    cost: 3,
    type: 'spell',
    spellEffect: 'damage',
    spellValue: 4,
    description: '对敌方目标造成4点伤害',
  },
  {
    id: 'spell_2',
    name: '治疗术',
    cost: 2,
    type: 'spell',
    spellEffect: 'heal',
    spellValue: 5,
    description: '恢复己方英雄5点生命',
  },
  {
    id: 'spell_3',
    name: '力量祝福',
    cost: 2,
    type: 'spell',
    spellEffect: 'buff',
    spellValue: 2,
    description: '使己方随机随从攻击+2生命+2',
  },
  {
    id: 'spell_4',
    name: '智慧祝福',
    cost: 2,
    type: 'spell',
    spellEffect: 'draw',
    spellValue: 2,
    description: '抽2张牌',
  },
  {
    id: 'spell_5',
    name: '烈焰风暴',
    cost: 5,
    type: 'spell',
    spellEffect: 'damage',
    spellValue: 2,
    description: '对所有敌方随从造成2点伤害',
  },
];

const games = new Map<string, GameState>();

const shuffleArray = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (let i = 0; i < 2; i++) {
    CARD_POOL.forEach((card) => {
      deck.push({
        ...card,
        instanceId: uuidv4(),
        canAttack: false,
        hasAttacked: false,
      });
    });
  }
  const shuffled = shuffleArray(deck);
  return shuffled.slice(0, 15);
};

const drawCards = (player: Player, count: number): string[] => {
  const drawn: string[] = [];
  for (let i = 0; i < count; i++) {
    if (player.deck.length === 0) break;
    if (player.hand.length >= 10) break;
    const card = player.deck.shift()!;
    player.hand.push(card);
    drawn.push(card.name);
  }
  return drawn;
};

const createPlayer = (id: 'player' | 'ai'): Player => {
  return {
    id,
    health: 30,
    maxHealth: 30,
    mana: id === 'player' ? 1 : 0,
    maxMana: id === 'player' ? 1 : 0,
    deck: createDeck(),
    hand: [],
    board: [],
  };
};

const addLog = (
  state: GameState,
  actor: 'player' | 'ai',
  action: string,
  detail: string
) => {
  state.battleLogs.push({
    turn: state.turn,
    actor,
    action,
    detail,
    timestamp: Date.now(),
  });
  if (state.battleLogs.length > 500) {
    state.battleLogs = state.battleLogs.slice(-500);
  }
};

const checkGameOver = (state: GameState): void => {
  if (state.player.health <= 0) {
    state.gameOver = true;
    state.winner = 'ai';
    addLog(state, 'ai', 'gameOver', 'AI获胜，玩家英雄被击败');
  } else if (state.ai.health <= 0) {
    state.gameOver = true;
    state.winner = 'player';
    addLog(state, 'player', 'gameOver', '玩家获胜，AI英雄被击败');
  }
};

const applySpellEffect = (
  state: GameState,
  caster: 'player' | 'ai',
  spell: Card,
  targetId?: string
): boolean => {
  const casterPlayer = state[caster];
  const opponentPlayer = state[caster === 'player' ? 'ai' : 'player'];

  switch (spell.spellEffect) {
    case 'damage': {
      if (spell.id === 'spell_5') {
        opponentPlayer.board.forEach((m) => {
          m.health! -= spell.spellValue!;
          state.stats.totalDamage += spell.spellValue!;
        });
        opponentPlayer.board = opponentPlayer.board.filter((m) => m.health! > 0);
        addLog(
          state,
          caster,
          'spell',
          `施放${spell.name}，对所有敌方随从造成${spell.spellValue}点伤害`
        );
      } else {
        if (targetId) {
          if (targetId.endsWith('-hero')) {
            opponentPlayer.health -= spell.spellValue!;
            state.stats.totalDamage += spell.spellValue!;
            addLog(
              state,
              caster,
              'spell',
              `施放${spell.name}对敌方英雄造成${spell.spellValue}点伤害`
            );
          } else {
            const target = opponentPlayer.board.find(
              (m) => m.instanceId === targetId
            );
            if (target) {
              target.health! -= spell.spellValue!;
              state.stats.totalDamage += spell.spellValue!;
              if (target.health! <= 0) {
                opponentPlayer.board = opponentPlayer.board.filter(
                  (m) => m.instanceId !== target.instanceId
                );
                addLog(
                  state,
                  caster,
                  'spell',
                  `施放${spell.name}击杀了${target.name}`
                );
              } else {
                addLog(
                  state,
                  caster,
                  'spell',
                  `施放${spell.name}对${target.name}造成${spell.spellValue}点伤害`
                );
              }
            } else {
              return false;
            }
          }
        } else {
          const tauntMinions = opponentPlayer.board.filter(
            (m) => m.effect === 'taunt'
          );
          const pool = tauntMinions.length > 0 ? tauntMinions : opponentPlayer.board;
          if (pool.length > 0) {
            const target = pool[Math.floor(Math.random() * pool.length)];
            target.health! -= spell.spellValue!;
            state.stats.totalDamage += spell.spellValue!;
            if (target.health! <= 0) {
              opponentPlayer.board = opponentPlayer.board.filter(
                (m) => m.instanceId !== target.instanceId
              );
              addLog(
                state,
                caster,
                'spell',
                `施放${spell.name}击杀了${target.name}`
              );
            } else {
              addLog(
                state,
                caster,
                'spell',
                `施放${spell.name}对${target.name}造成${spell.spellValue}点伤害`
              );
            }
          } else {
            opponentPlayer.health -= spell.spellValue!;
            state.stats.totalDamage += spell.spellValue!;
            addLog(
              state,
              caster,
              'spell',
              `施放${spell.name}对敌方英雄造成${spell.spellValue}点伤害`
            );
          }
        }
      }
      break;
    }
    case 'heal': {
      const healAmount = Math.min(
        spell.spellValue!,
        casterPlayer.maxHealth - casterPlayer.health
      );
      casterPlayer.health += healAmount;
      addLog(
        state,
        caster,
        'spell',
        `施放${spell.name}恢复了${healAmount}点生命`
      );
      break;
    }
    case 'buff': {
      if (casterPlayer.board.length > 0) {
        const target =
          casterPlayer.board[
            Math.floor(Math.random() * casterPlayer.board.length)
          ];
        target.attack! += spell.spellValue!;
        target.health! += spell.spellValue!;
        target.maxHealth! += spell.spellValue!;
        addLog(
          state,
          caster,
          'spell',
          `施放${spell.name}使${target.name}获得+${spell.spellValue}/+${spell.spellValue}`
        );
      } else {
        addLog(state, caster, 'spell', `施放${spell.name}但没有目标可用`);
      }
      break;
    }
    case 'draw': {
      const drawn = drawCards(casterPlayer, spell.spellValue!);
      addLog(
        state,
        caster,
        'spell',
        `施放${spell.name}抽了${drawn.length}张牌`
      );
      break;
    }
  }

  checkGameOver(state);
  return true;
};

const playCardLogic = (
  state: GameState,
  playerId: 'player' | 'ai',
  cardInstanceId: string,
  targetId?: string
): boolean => {
  const player = state[playerId];

  const cardIndex = player.hand.findIndex(
    (c) => c.instanceId === cardInstanceId
  );
  if (cardIndex === -1) return false;

  const card = player.hand[cardIndex];

  if (card.cost > player.mana) return false;

  if (card.type === 'minion' && player.board.length >= 7) return false;

  player.mana -= card.cost;
  player.hand.splice(cardIndex, 1);

  if (card.type === 'minion') {
    card.canAttack = card.effect === 'charge';
    card.hasAttacked = false;
    card.health = card.maxHealth;
    player.board.push(card);
    addLog(
      state,
      playerId,
      'playMinion',
      `召唤了${card.name} (${card.attack}/${card.health})`
    );
    if (playerId === 'player') state.stats.playerCardsPlayed++;
    else state.stats.aiCardsPlayed++;
  } else {
    applySpellEffect(state, playerId, card, targetId);
    if (playerId === 'player') state.stats.playerCardsPlayed++;
    else state.stats.aiCardsPlayed++;
  }

  return true;
};

const attackLogic = (
  state: GameState,
  attackerId: 'player' | 'ai',
  attackerInstanceId: string,
  targetId: string,
  targetType: 'minion' | 'hero'
): boolean => {
  const attackerPlayer = state[attackerId];
  const defenderPlayer = state[attackerId === 'player' ? 'ai' : 'player'];

  const attacker = attackerPlayer.board.find(
    (m) => m.instanceId === attackerInstanceId
  );
  if (!attacker) return false;
  if (!attacker.canAttack || attacker.hasAttacked) return false;

  const tauntMinions = defenderPlayer.board.filter(
    (m) => m.effect === 'taunt'
  );

  if (targetType === 'hero') {
    if (tauntMinions.length > 0) return false;
    defenderPlayer.health -= attacker.attack!;
    state.stats.totalDamage += attacker.attack!;
    attacker.hasAttacked = true;
    addLog(
      state,
      attackerId,
      'attackHero',
      `${attacker.name}攻击敌方英雄造成${attacker.attack}点伤害`
    );
  } else {
    const target = defenderPlayer.board.find(
      (m) => m.instanceId === targetId
    );
    if (!target) return false;
    if (tauntMinions.length > 0 && target.effect !== 'taunt') return false;

    target.health! -= attacker.attack!;
    attacker.health! -= target.attack!;
    state.stats.totalDamage += attacker.attack! + target.attack!;

    addLog(
      state,
      attackerId,
      'attackMinion',
      `${attacker.name}(${attacker.attack})攻击${target.name}(${target.attack})`
    );

    attacker.hasAttacked = true;

    if (target.health! <= 0) {
      defenderPlayer.board = defenderPlayer.board.filter(
        (m) => m.instanceId !== target.instanceId
      );
      addLog(state, attackerId, 'kill', `${target.name}被消灭`);
    }
    if (attacker.health! <= 0) {
      attackerPlayer.board = attackerPlayer.board.filter(
        (m) => m.instanceId !== attacker.instanceId
      );
      addLog(state, attackerId, 'die', `${attacker.name}被消灭`);
    }
  }

  checkGameOver(state);
  return true;
};

const endTurnLogic = (state: GameState): void => {
  if (state.gameOver) return;

  const nextPlayer: 'player' | 'ai' =
    state.currentPlayer === 'player' ? 'ai' : 'player';

  state.currentPlayer = nextPlayer;

  if (nextPlayer === 'player') {
    state.turn++;
    state.stats.totalTurns = state.turn;
  }

  const player = state[nextPlayer];
  player.maxMana = Math.min(10, player.maxMana + 1);
  player.mana = player.maxMana;

  drawCards(player, 1);

  player.board.forEach((m) => {
    m.canAttack = true;
    m.hasAttacked = false;
  });

  addLog(
    state,
    nextPlayer,
    'turnStart',
    `回合${state.turn} - ${nextPlayer === 'player' ? '玩家' : 'AI'}的回合开始，法力值${player.mana}/${player.maxMana}`
  );
};

const makeAIDecision = (state: GameState): AIAction | null => {
  const ai = state.ai;
  const player = state.player;

  const playableCards = ai.hand.filter(
    (c) =>
      c.cost <= ai.mana &&
      (c.type === 'spell' || (c.type === 'minion' && ai.board.length < 7))
  );

  if (playableCards.length > 0) {
    let bestCard = playableCards[0];
    let bestScore = -1;

    for (const card of playableCards) {
      let score = 0;
      if (card.type === 'minion') {
        const stats = (card.attack || 0) + (card.health || 0);
        score = stats * 2 + (card.effect === 'taunt' ? 3 : 0) + (card.effect === 'charge' ? 4 : 0);
        score -= card.cost * 0.5;

        if (ai.board.length === 0) score += 2;
        if (player.health <= 10 && card.effect === 'charge') score += 5;
      } else {
        switch (card.spellEffect) {
          case 'damage':
            if (card.id === 'spell_5') {
              score = player.board.length * 4 + 2;
              if (score > 0) score = Math.max(score, card.cost * 1.5);
            } else {
              const tauntTargets = player.board.filter((m) => m.effect === 'taunt');
              if (tauntTargets.length > 0) {
                const killable = tauntTargets.filter(
                  (m) => m.health! <= (card.spellValue || 0)
                );
                score = killable.length > 0 ? 8 : 3;
              } else if (player.health <= (card.spellValue || 0)) {
                score = 100;
              } else {
                const killable = player.board.filter(
                  (m) => m.health! <= (card.spellValue || 0) && m.attack! >= 3
                );
                score = killable.length > 0 ? 7 : player.health < 15 ? 5 : 2;
              }
            }
            break;
          case 'heal':
            score = ai.health < 20 ? (30 - ai.health) * 0.5 : 0;
            break;
          case 'buff':
            score = ai.board.length * 3;
            break;
          case 'draw':
            score = ai.hand.length < 5 ? 5 : 2;
            break;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestCard = card;
      }
    }

    if (bestScore > 0 || (bestCard.type === 'minion' && bestCard.cost <= ai.mana)) {
      let targetId: string | undefined;
      if (bestCard.type === 'spell' && bestCard.spellEffect === 'damage' && bestCard.id !== 'spell_5') {
        const tauntMinions = player.board.filter((m) => m.effect === 'taunt');
        const pool = tauntMinions.length > 0 ? tauntMinions : player.board;
        const killable = pool
          .filter((m) => m.health! <= (bestCard.spellValue || 0))
          .sort((a, b) => b.attack! - a.attack!);
        if (killable.length > 0) {
          targetId = killable[0].instanceId;
        } else if (player.health <= (bestCard.spellValue || 0)) {
          targetId = 'player-hero';
        } else if (pool.length > 0) {
          const highAttack = [...pool].sort((a, b) => b.attack! - a.attack!)[0];
          if (highAttack.attack! >= 3) {
            targetId = highAttack.instanceId;
          } else if (player.health < 20) {
            targetId = 'player-hero';
          } else {
            targetId = highAttack.instanceId;
          }
        } else {
          targetId = 'player-hero';
        }
      }

      return {
        type: 'playCard',
        cardInstanceId: bestCard.instanceId!,
        targetId,
      };
    }
  }

  const attackers = ai.board.filter(
    (m) => m.canAttack && !m.hasAttacked && (m.attack || 0) > 0
  );

  if (attackers.length > 0) {
    const tauntMinions = player.board.filter((m) => m.effect === 'taunt');

    attackers.sort((a, b) => b.attack! - a.attack!);

    for (const attacker of attackers) {
      if (tauntMinions.length > 0) {
        const target = [...tauntMinions]
          .filter((t) => t.health! <= attacker.attack!)
          .sort((a, b) => b.attack! - a.attack!)[0];
        const finalTarget =
          target ||
          [...tauntMinions].sort((a, b) => a.health! - b.health!)[0];
        return {
          type: 'attack',
          cardInstanceId: attacker.instanceId!,
          targetId: finalTarget.instanceId!,
          targetType: 'minion',
        };
      } else {
        if (player.health <= attacker.attack!) {
          return {
            type: 'attack',
            cardInstanceId: attacker.instanceId!,
            targetId: 'player-hero',
            targetType: 'hero',
          };
        }

        if (player.board.length > 0) {
          const killable = player.board
            .filter(
              (m) =>
                m.health! <= attacker.attack! && attacker.health! > m.attack!
            )
            .sort((a, b) => b.attack! * 2 + b.health! - (a.attack! * 2 + a.health!));

          if (killable.length > 0) {
            const bestTrade = killable[0];
            if (bestTrade.attack! >= 2 || bestTrade.effect === 'taunt') {
              return {
                type: 'attack',
                cardInstanceId: attacker.instanceId!,
                targetId: bestTrade.instanceId!,
                targetType: 'minion',
              };
            }
          }

          const dangerous = player.board
            .filter((m) => m.attack! >= 4 && attacker.health! > m.attack!)
            .sort((a, b) => b.attack! - a.attack!);
          if (dangerous.length > 0 && attacker.health! > 3) {
            return {
              type: 'attack',
              cardInstanceId: attacker.instanceId!,
              targetId: dangerous[0].instanceId!,
              targetType: 'minion',
            };
          }
        }

        return {
          type: 'attack',
          cardInstanceId: attacker.instanceId!,
          targetId: 'player-hero',
          targetType: 'hero',
        };
      }
    }
  }

  return { type: 'endTurn' };
};

app.post('/api/startGame', (_req, res) => {
  try {
    const gameId = uuidv4();
    const player = createPlayer('player');
    const ai = createPlayer('ai');

    drawCards(player, 3);
    drawCards(ai, 4);

    ai.board.forEach((m) => {
      m.canAttack = false;
      m.hasAttacked = false;
    });

    const state: GameState = {
      gameId,
      turn: 1,
      currentPlayer: 'player',
      player,
      ai,
      battleLogs: [],
      gameOver: false,
      winner: null,
      stats: {
        totalTurns: 1,
        playerCardsPlayed: 0,
        aiCardsPlayed: 0,
        totalDamage: 0,
      },
    };

    addLog(state, 'player', 'gameStart', '游戏开始！玩家先手');

    games.set(gameId, state);
    res.json(state);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/playCard', (req, res) => {
  try {
    const { gameId, cardInstanceId, targetId } = req.body;
    const state = games.get(gameId);

    if (!state) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    if (state.gameOver) {
      return res.status(400).json({ error: '游戏已结束' });
    }
    if (state.currentPlayer !== 'player') {
      return res.status(400).json({ error: '不是玩家回合' });
    }

    const card = state.player.hand.find(
      (c) => c.instanceId === cardInstanceId
    );
    if (!card) {
      return res.status(400).json({ error: '卡牌不存在' });
    }
    if (card.cost > state.player.mana) {
      return res.status(400).json({ error: '费用不足' });
    }
    if (card.type === 'minion' && state.player.board.length >= 7) {
      return res.status(400).json({ error: '战场已满' });
    }

    const success = playCardLogic(state, 'player', cardInstanceId, targetId);
    if (!success) {
      return res.status(400).json({ error: '出牌失败' });
    }

    res.json(state);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/attack', (req, res) => {
  try {
    const { gameId, attackerId, targetId, targetType } = req.body;
    const state = games.get(gameId);

    if (!state) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    if (state.gameOver) {
      return res.status(400).json({ error: '游戏已结束' });
    }
    if (state.currentPlayer !== 'player') {
      return res.status(400).json({ error: '不是玩家回合' });
    }

    const attacker = state.player.board.find(
      (m) => m.instanceId === attackerId
    );
    if (!attacker) {
      return res.status(400).json({ error: '攻击者不存在' });
    }
    if (!attacker.canAttack || attacker.hasAttacked) {
      return res.status(400).json({ error: '该随从本回合无法攻击' });
    }

    const success = attackLogic(
      state,
      'player',
      attackerId,
      targetId,
      targetType
    );
    if (!success) {
      return res.status(400).json({ error: '攻击失败，请确认嘲讽机制' });
    }

    res.json(state);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/endTurn', (req, res) => {
  try {
    const { gameId } = req.body;
    const state = games.get(gameId);

    if (!state) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    if (state.gameOver) {
      return res.status(400).json({ error: '游戏已结束' });
    }

    addLog(
      state,
      state.currentPlayer,
      'turnEnd',
      `${state.currentPlayer === 'player' ? '玩家' : 'AI'}结束回合`
    );
    endTurnLogic(state);

    res.json(state);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/aiAction', (req, res) => {
  try {
    const { gameId } = req.query;
    const state = games.get(gameId as string);

    if (!state) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    if (state.gameOver) {
      return res.json(null);
    }
    if (state.currentPlayer !== 'ai') {
      return res.json({ type: 'endTurn' });
    }

    const action = makeAIDecision(state);
    res.json(action);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/executeAIAction', (req, res) => {
  try {
    const { gameId, action } = req.body;
    const state = games.get(gameId);

    if (!state) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    if (state.gameOver) {
      return res.status(400).json({ error: '游戏已结束' });
    }
    if (state.currentPlayer !== 'ai') {
      return res.status(400).json({ error: '不是AI回合' });
    }

    const aiAction: AIAction = action;

    if (aiAction.type === 'playCard') {
      const success = playCardLogic(
        state,
        'ai',
        aiAction.cardInstanceId!,
        aiAction.targetId
      );
      if (!success) {
        return res.status(400).json({ error: 'AI出牌失败' });
      }
    } else if (aiAction.type === 'attack') {
      const success = attackLogic(
        state,
        'ai',
        aiAction.cardInstanceId!,
        aiAction.targetId!,
        aiAction.targetType!
      );
      if (!success) {
        return res.status(400).json({ error: 'AI攻击失败' });
      }
    } else if (aiAction.type === 'endTurn') {
      addLog(state, 'ai', 'turnEnd', 'AI结束回合');
      endTurnLogic(state);
    }

    res.json(state);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/battleLogs', (req, res) => {
  try {
    const { gameId } = req.query;
    const state = games.get(gameId as string);

    if (!state) {
      return res.status(404).json({ error: '游戏不存在' });
    }

    res.json({
      logs: state.battleLogs,
      stats: state.stats,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`⚔️  AI卡牌对战服务器运行在 http://localhost:${PORT}`);
});
