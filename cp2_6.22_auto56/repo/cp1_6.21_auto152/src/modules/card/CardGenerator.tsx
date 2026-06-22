import React, { useEffect } from 'react';
import { useGameContext } from '@/context/GameContext';
import type { Card } from '@/types/game';

const BONUS_CARD_POOL: { name: string; type: Card['type']; value: number }[] = [
  { name: '重击', type: 'attack', value: 20 },
  { name: '铁壁', type: 'defense', value: 25 },
  { name: '深层洞察', type: 'skill', value: 3 },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function createCard(name: string, type: Card['type'], value: number): Card {
  const descriptions: Record<Card['type'], string> = {
    attack: `造成 ${value} 点伤害`,
    defense: `获得 ${value} 点护盾`,
    skill: `抽 ${value} 张牌`,
  };
  return { id: generateId(), name, type, value, description: descriptions[type] };
}

export function generateInitialDeck(): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < 6; i++) deck.push(createCard('斩击', 'attack', 10));
  for (let i = 0; i < 4; i++) deck.push(createCard('格挡', 'defense', 15));
  for (let i = 0; i < 2; i++) deck.push(createCard('洞察', 'skill', 2));
  return deck;
}

export function generateBonusCards(round: number): Card[] {
  let probability = 0;
  if (round >= 7) {
    probability = 0.5;
  } else if (round >= 4) {
    probability = 0.3;
  } else {
    return [];
  }

  const bonusCards: Card[] = [];
  if (Math.random() < probability) {
    const tpl = BONUS_CARD_POOL[Math.floor(Math.random() * BONUS_CARD_POOL.length)];
    bonusCards.push(createCard(tpl.name, tpl.type, tpl.value));
  }
  return bonusCards;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function drawCardsFromDeck(
  deck: Card[],
  hand: Card[],
  count: number,
): { deck: Card[]; hand: Card[]; drawn: number } {
  const newDeck = [...deck];
  let newHand = [...hand];
  const toDraw = Math.min(count, newDeck.length);
  for (let i = 0; i < toDraw; i++) {
    const card = newDeck.shift();
    if (card) newHand.push(card);
  }
  while (newHand.length > 10) {
    newHand.pop();
  }
  return { deck: newDeck, hand: newHand, drawn: toDraw };
}

export function CardGenerator({ children }: { children: React.ReactNode }) {
  const { round, deck, drawCards } = useGameContext();

  useEffect(() => {
    if (round > 1) {
      const bonusCards = generateBonusCards(round);
      if (bonusCards.length > 0) {
        drawCards(0); // trigger context awareness — bonus cards are added by nextWave calling this module
      }
    }
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  return React.createElement(React.Fragment, null, children);
}
