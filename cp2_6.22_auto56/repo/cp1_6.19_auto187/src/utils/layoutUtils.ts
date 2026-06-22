import { Recipe, RecipePosition } from '../module1/types';
import { calculateFlavorCenter, flavorToPixel } from './flavorUtils';

const MIN_DISTANCE = 200;
const MAX_ITERATIONS = 50;

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculatePositions(
  recipes: Recipe[],
  mapWidth: number,
  mapHeight: number
): RecipePosition[] {
  const positions: RecipePosition[] = recipes.map((recipe) => {
    const center = calculateFlavorCenter(recipe.flavorTags);
    const pixel = flavorToPixel(center.x, center.y, mapWidth, mapHeight);
    return {
      recipeId: recipe.id,
      x: pixel.x + (Math.random() - 0.5) * 40,
      y: pixel.y + (Math.random() - 0.5) * 40,
    };
  });

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let moved = false;

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const p1 = positions[i];
        const p2 = positions[j];
        const d = distance(p1, p2);

        if (d < MIN_DISTANCE && d > 0) {
          const pushForce = (MIN_DISTANCE - d) / 2;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const norm = d || 1;

          positions[i] = {
            ...p1,
            x: p1.x - (dx / norm) * pushForce,
            y: p1.y - (dy / norm) * pushForce,
          };
          positions[j] = {
            ...p2,
            x: p2.x + (dx / norm) * pushForce,
            y: p2.y + (dy / norm) * pushForce,
          };
          moved = true;
        }
      }
    }

    const padding = 80;
    for (let i = 0; i < positions.length; i++) {
      positions[i] = {
        ...positions[i],
        x: Math.max(padding, Math.min(mapWidth - padding, positions[i].x)),
        y: Math.max(padding, Math.min(mapHeight - padding, positions[i].y)),
      };
    }

    if (!moved) break;
  }

  return positions;
}
