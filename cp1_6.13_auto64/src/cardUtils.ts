import { Card } from './types';

export function findCardById(cards: Card[], id: string): Card | null {
  for (const card of cards) {
    if (card.id === id) return card;
    if (card.children.length > 0) {
      const found = findCardById(card.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findParentCard(cards: Card[], id: string, parent: Card | null = null): Card | null {
  for (const card of cards) {
    if (card.id === id) return parent;
    if (card.children.length > 0) {
      const found = findParentCard(card.children, id, card);
      if (found !== null || card.children.some(c => c.id === id)) {
        return card.children.some(c => c.id === id) ? card : found;
      }
    }
  }
  return null;
}

export function isDescendant(card: Card, potentialDescendantId: string): boolean {
  for (const child of card.children) {
    if (child.id === potentialDescendantId) return true;
    if (isDescendant(child, potentialDescendantId)) return true;
  }
  return false;
}

export function updateCardInTree(cards: Card[], id: string, updater: (card: Card) => Card): Card[] {
  return cards.map(card => {
    if (card.id === id) {
      return updater(card);
    }
    if (card.children.length > 0) {
      return {
        ...card,
        children: updateCardInTree(card.children, id, updater),
      };
    }
    return card;
  });
}

export function removeCardFromTree(cards: Card[], id: string): Card[] {
  return cards
    .filter(card => card.id !== id)
    .map(card => ({
      ...card,
      children: removeCardFromTree(card.children, id),
    }));
}

export function addChildToCard(cards: Card[], parentId: string, child: Card): Card[] {
  return cards.map(card => {
    if (card.id === parentId) {
      return {
        ...card,
        children: [...card.children, child],
      };
    }
    if (card.children.length > 0) {
      return {
        ...card,
        children: addChildToCard(card.children, parentId, child),
      };
    }
    return card;
  });
}

export function getVisibleCards(cards: Card[]): Card[] {
  const result: Card[] = [];
  for (const card of cards) {
    result.push({
      ...card,
      children: card.collapsed ? [] : getVisibleCards(card.children),
    });
  }
  return result;
}

export function cloneCard(card: Card): Card {
  return {
    ...card,
    id: Math.random().toString(36).substring(2, 11),
    children: card.children.map(cloneCard),
  };
}

export function calculateNestChildPosition(parentCard: Card, childIndex: number = 0): { x: number; y: number; width: number; height: number } {
  const scale = 0.8;
  const newWidth = parentCard.width * scale;
  const newHeight = parentCard.height * scale;
  
  const offsetX = (parentCard.width - newWidth) / 2;
  const offsetY = (parentCard.height - newHeight) / 2;
  
  const stackOffset = childIndex * 10;
  
  return {
    x: offsetX + stackOffset,
    y: offsetY + stackOffset,
    width: newWidth,
    height: newHeight,
  };
}
