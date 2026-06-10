import type { Flower, Title } from '../types/game';
import { RARITY_WEIGHT } from '../types/game';

export function determineWinner(
  playerFlower: Flower,
  aiFlower: Flower
): 'player' | 'ai' | 'draw' {
  const playerWeight = RARITY_WEIGHT[playerFlower.rarity];
  const aiWeight = RARITY_WEIGHT[aiFlower.rarity];

  if (playerWeight > aiWeight) return 'player';
  if (playerWeight < aiWeight) return 'ai';

  if (playerFlower.pattern === aiFlower.pattern) return 'draw';

  return Math.random() > 0.5 ? 'player' : 'ai';
}

export function calculateTitle(
  wins: number,
  totalRounds: number
): Title {
  if (totalRounds === 0) return '白丁';
  
  const winRate = wins / totalRounds;
  
  if (winRate >= 1.0) return '花魁';
  if (winRate >= 0.8) return '探花';
  if (winRate >= 0.6) return '榜眼';
  if (winRate >= 0.4) return '进士';
  if (winRate >= 0.2) return '秀才';
  return '白丁';
}

export function generateRandomPosition(
  containerWidth: number,
  containerHeight: number,
  itemSize: number,
  existingPositions: Array<{ x: number; y: number }>,
  minDistance: number = 60
): { x: number; y: number } {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const x = Math.random() * (containerWidth - itemSize);
    const y = Math.random() * (containerHeight - itemSize);

    const hasCollision = existingPositions.some(pos => {
      const dx = pos.x - x;
      const dy = pos.y - y;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });

    if (!hasCollision) {
      return { x, y };
    }

    attempts++;
  }

  return {
    x: Math.random() * (containerWidth - itemSize),
    y: Math.random() * (containerHeight - itemSize),
  };
}

export function generateFlowerPositions(
  flowers: Flower[],
  containerWidth: number,
  containerHeight: number
): Array<{ flower: Flower; position: { x: number; y: number }; rotation: number }> {
  const positions: Array<{ flower: Flower; position: { x: number; y: number }; rotation: number }> = [];
  const existingPositions: Array<{ x: number; y: number }> = [];

  flowers.forEach(flower => {
    const size = flower.rarity === 'exotic' ? 70 : flower.rarity === 'rare' ? 60 : 50;
    const pos = generateRandomPosition(containerWidth, containerHeight, size, existingPositions);
    const rotation = (Math.random() - 0.5) * 20;
    
    positions.push({ flower, position: pos, rotation });
    existingPositions.push(pos);
  });

  return positions;
}

export function getRandomHandFlower(hand: Flower[]): Flower | null {
  if (hand.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * hand.length);
  return hand[randomIndex];
}
