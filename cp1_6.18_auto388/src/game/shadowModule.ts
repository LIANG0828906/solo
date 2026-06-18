import { ShadowClone, ShadowRect, PlayerState, Vec2 } from './types';
import { v4 as uuidv4 } from 'uuid';

const SHADOW_LENGTH = 120;
const SHADOW_HEIGHT = 16;

export function createShadowClone(
  player: PlayerState,
  releasePos: Vec2
): ShadowClone {
  const dirX = player.facingRight ? -1 : 1;
  const shadowRect: ShadowRect = {
    x: releasePos.x + dirX * 20,
    y: releasePos.y + 12,
    width: SHADOW_LENGTH,
    height: SHADOW_HEIGHT,
  };

  if (dirX < 0) {
    shadowRect.x = releasePos.x - 20 - SHADOW_LENGTH;
  }

  return {
    id: uuidv4(),
    pos: { ...releasePos },
    direction: { x: dirX, y: 0 },
    shadowRect,
  };
}

export function updateShadowPositions(
  shadows: ShadowClone[],
  player: PlayerState
): ShadowClone[] {
  return shadows.map((shadow) => {
    const dirX = player.facingRight ? -1 : 1;
    const newRect: ShadowRect = {
      x: shadow.pos.x + dirX * 20,
      y: shadow.pos.y + 12,
      width: SHADOW_LENGTH,
      height: SHADOW_HEIGHT,
    };
    if (dirX < 0) {
      newRect.x = shadow.pos.x - 20 - SHADOW_LENGTH;
    }
    return { ...shadow, direction: { x: dirX, y: 0 }, shadowRect: newRect };
  });
}

export function findNearestShadowAt(
  shadows: ShadowClone[],
  pos: Vec2,
  threshold: number = 30
): ShadowClone | null {
  let nearest: ShadowClone | null = null;
  let nearestDist = threshold;

  for (const shadow of shadows) {
    const dx = shadow.pos.x - pos.x;
    const dy = shadow.pos.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = shadow;
    }
  }

  return nearest;
}
