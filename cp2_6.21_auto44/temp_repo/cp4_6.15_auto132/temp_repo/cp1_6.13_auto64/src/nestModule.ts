import { Card } from './types';
import { findCardById, isDescendant, removeCardFromTree, addChildToCard, updateCardInTree, calculateNestChildPosition } from './cardUtils';

export const nestUtils = {
  canNest(selectedCardId: string, targetCardId: string, cards: Card[]): boolean {
    if (selectedCardId === targetCardId) return false;
    
    const targetCard = findCardById(cards, targetCardId);
    if (!targetCard) return false;
    
    if (isDescendant(targetCard, selectedCardId)) return false;
    
    return true;
  },

  nestCard(selectedCardId: string, targetCardId: string, cards: Card[]): Card[] {
    if (!this.canNest(selectedCardId, targetCardId, cards)) {
      return cards;
    }
    
    const selectedCard = findCardById(cards, selectedCardId);
    const targetCard = findCardById(cards, targetCardId);
    
    if (!selectedCard || !targetCard) return cards;
    
    const cardsWithoutSelected = removeCardFromTree(cards, selectedCardId);
    
    const childIndex = targetCard.children.length;
    const newPos = calculateNestChildPosition(targetCard, childIndex);
    
    const nestedCard: Card = {
      ...selectedCard,
      x: newPos.x,
      y: newPos.y,
      width: newPos.width,
      height: newPos.height,
      parentId: targetCardId,
    };
    
    return addChildToCard(cardsWithoutSelected, targetCardId, nestedCard);
  },

  toggleCollapse(cards: Card[], cardId: string): Card[] {
    return updateCardInTree(cards, cardId, (card) => ({
      ...card,
      collapsed: !card.collapsed,
    }));
  },
};

export function useNest(
  cards: Card[],
  setCards: (cards: Card[]) => void,
  selectedCardId: string | null,
  lastClickedCardId: string | null,
  pushHistory: (cards: Card[]) => void
) {
  const handleNest = () => {
    if (!selectedCardId || !lastClickedCardId) return;
    if (selectedCardId === lastClickedCardId) return;
    
    if (nestUtils.canNest(selectedCardId, lastClickedCardId, cards)) {
      const newCards = nestUtils.nestCard(selectedCardId, lastClickedCardId, cards);
      pushHistory(newCards);
      setCards(newCards);
    }
  };

  const handleToggleCollapse = (cardId: string) => {
    const newCards = nestUtils.toggleCollapse(cards, cardId);
    pushHistory(newCards);
    setCards(newCards);
  };

  return {
    handleNest,
    handleToggleCollapse,
  };
}
