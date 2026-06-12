import { v4 as uuidv4 } from 'uuid';
import { Card, CreateCardInput, GroupType } from '../../../shared/types';

let cards: Card[] = [];

const COMPANY_GROUP_MAP: Record<string, GroupType> = {
  'abc.com': 'colleagues',
  'customer.com': 'customers',
  'gmail.com': 'friends',
  'qq.com': 'friends',
  '163.com': 'friends'
};

export function determineGroupByEmail(email: string): GroupType {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 'custom';
  return COMPANY_GROUP_MAP[domain] || 'custom';
}

export function createCard(input: CreateCardInput, ownerId: string): Card {
  const card: Card = {
    id: uuidv4(),
    ...input,
    group: determineGroupByEmail(input.email),
    exchangedAt: Date.now(),
    ownerId
  };
  cards.push(card);
  return card;
}

export function getCardById(id: string): Card | undefined {
  return cards.find(c => c.id === id);
}

export function getCardsByOwner(ownerId: string): Card[] {
  return cards
    .filter(c => c.ownerId === ownerId)
    .sort((a, b) => b.exchangedAt - a.exchangedAt);
}

export function getCardsByGroup(ownerId: string, group: string): Card[] {
  return cards
    .filter(c => c.ownerId === ownerId && c.group === group)
    .sort((a, b) => b.exchangedAt - a.exchangedAt);
}

export function updateCardGroup(cardId: string, group: string): Card | undefined {
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.group = group;
  }
  return card;
}

export function addCardToCollection(card: Card, ownerId: string): Card {
  const existing = cards.find(c => c.id === card.id && c.ownerId === ownerId);
  if (existing) {
    return existing;
  }
  const newCard = {
    ...card,
    ownerId,
    group: determineGroupByEmail(card.email),
    exchangedAt: Date.now()
  };
  cards.push(newCard);
  return newCard;
}

export function getAllCards(): Card[] {
  return cards;
}
