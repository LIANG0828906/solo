import { BattleConfig, BattleEvent, Card, EventType, PlayerConfig } from './types';

function createDefaultPlayer(name: string): PlayerConfig {
  const attackCards: Card[] = [
    { type: 'attack', name: '重击', power: 18 },
    { type: 'attack', name: '斩击', power: 15 },
    { type: 'attack', name: '穿刺', power: 12 },
    { type: 'attack', name: '挥砍', power: 20 },
    { type: 'attack', name: '暴击', power: 25 }
  ];
  const defenseCards: Card[] = [
    { type: 'defense', name: '铁壁', power: 15 },
    { type: 'defense', name: '护盾', power: 10 },
    { type: 'defense', name: '格挡', power: 12 },
    { type: 'defense', name: '坚韧', power: 18 }
  ];
  const healCards: Card[] = [
    { type: 'heal', name: '治愈术', power: 10 },
    { type: 'heal', name: '回复药', power: 8 },
    { type: 'heal', name: '生命之泉', power: 15 },
    { type: 'heal', name: '再生', power: 12 }
  ];

  return {
    name,
    hp: 100,
    maxHp: 100,
    shield: 0,
    cards: [...attackCards, ...defenseCards, ...healCards]
  };
}

export function createDefaultConfig(): BattleConfig {
  return {
    rounds: 10,
    cardsPerRound: 3,
    playerA: createDefaultPlayer('玩家A'),
    playerB: createDefaultPlayer('玩家B')
  };
}

function pickRandomCards(cards: Card[], count: number): Card[] {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function calculateDamage(attackPower: number, defensePower: number): { reductionPercent: number; finalDamage: number } {
  const reductionPercent = defensePower / (defensePower + 100);
  const finalDamage = Math.max(0, Math.round(attackPower * (1 - reductionPercent)));
  return { reductionPercent: reductionPercent * 100, finalDamage };
}

export function generateBattleLog(config: BattleConfig = createDefaultConfig()): BattleEvent[] {
  const events: BattleEvent[] = [];
  let eventId = 0;
  let timestamp = 0;

  const playerA: PlayerConfig = { ...config.playerA, hp: config.playerA.maxHp, shield: 0 };
  const playerB: PlayerConfig = { ...config.playerB, hp: config.playerB.maxHp, shield: 0 };

  for (let round = 1; round <= config.rounds; round++) {
    const cardsA = pickRandomCards(playerA.cards, config.cardsPerRound);
    const cardsB = pickRandomCards(playerB.cards, config.cardsPerRound);

    const actions: { source: PlayerConfig; target: PlayerConfig; sourceName: string; targetName: string; card: Card }[] = [];

    for (let i = 0; i < config.cardsPerRound; i++) {
      actions.push({ source: playerA, target: playerB, sourceName: '玩家A', targetName: '玩家B', card: cardsA[i] });
      actions.push({ source: playerB, target: playerA, sourceName: '玩家B', targetName: '玩家A', card: cardsB[i] });
    }

    actions.sort(() => Math.random() - 0.5);

    for (const action of actions) {
      const { source, target, sourceName, targetName, card } = action;

      if (card.type === 'attack') {
        const { reductionPercent, finalDamage } = calculateDamage(card.power, target.shield);
        events.push({
          id: eventId++,
          round,
          type: 'attack' as EventType,
          source: sourceName,
          target: targetName,
          value: -finalDamage,
          attackPower: card.power,
          defensePower: target.shield,
          reductionPercent: Math.round(reductionPercent * 10) / 10,
          finalDamage,
          timestamp: timestamp++
        });
        target.hp = Math.max(0, target.hp - finalDamage);
        target.shield = Math.max(0, target.shield - Math.round(card.power * 0.3));
      } else if (card.type === 'defense') {
        events.push({
          id: eventId++,
          round,
          type: 'defense' as EventType,
          source: sourceName,
          target: '屏障',
          value: card.power,
          timestamp: timestamp++
        });
        source.shield = Math.min(100, source.shield + card.power);
      } else if (card.type === 'heal') {
        const actualHeal = Math.min(card.power, source.maxHp - source.hp);
        events.push({
          id: eventId++,
          round,
          type: 'heal' as EventType,
          source: sourceName,
          target: '自身',
          value: actualHeal,
          timestamp: timestamp++
        });
        source.hp = Math.min(source.maxHp, source.hp + actualHeal);
      }

      if (playerA.hp <= 0 || playerB.hp <= 0) {
        break;
      }
    }

    if (playerA.hp <= 0 || playerB.hp <= 0) {
      break;
    }
  }

  return events;
}
