import type { Card, Player } from '../types';

export function aiSelectCard(opponent: Player, playerHandSize: number): Card | null {
  const playableCards = opponent.hand.filter((card) => card.cost <= opponent.energy);
  if (playableCards.length === 0) return null;

  const attackCards = playableCards
    .filter((c) => c.type === 'attack')
    .sort((a, b) => b.cost - a.cost);

  if (attackCards.length > 0) {
    return attackCards[0];
  }

  const defenseCards = playableCards.filter((c) => c.type === 'defense');
  if (opponent.health <= 15 && defenseCards.length > 0) {
    return defenseCards.sort((a, b) => b.value - a.value)[0];
  }

  const specialCards = playableCards.filter((c) => c.type === 'special');
  const discardCards = specialCards.filter((c) => c.effect === 'discard');
  if (playerHandSize >= 4 && discardCards.length > 0) {
    return discardCards[0];
  }

  const randomIndex = Math.floor(Math.random() * playableCards.length);
  return playableCards[randomIndex];
}
