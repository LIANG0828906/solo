import { Position, PotDimensions } from '../types/game';

export const useCollision = () => {
  const isInMouth = (
    pos: Position,
    potCenter: Position,
    mouthDiameter: number
  ): boolean => {
    const radius = mouthDiameter / 2;
    const distance = Math.sqrt(
      Math.pow(pos.x - potCenter.x, 2) +
      Math.pow(pos.y - potCenter.y, 2)
    );
    return distance <= radius;
  };

  const isInEar = (
    pos: Position,
    potCenter: Position,
    earDiameter: number,
    earOffset: number
  ): 'left' | 'right' | null => {
    const radius = earDiameter / 2;
    const leftEarCenter = { x: potCenter.x - earOffset, y: potCenter.y };
    const rightEarCenter = { x: potCenter.x + earOffset, y: potCenter.y };

    const leftDist = Math.sqrt(
      Math.pow(pos.x - leftEarCenter.x, 2) +
      Math.pow(pos.y - leftEarCenter.y, 2)
    );
    const rightDist = Math.sqrt(
      Math.pow(pos.x - rightEarCenter.x, 2) +
      Math.pow(pos.y - rightEarCenter.y, 2)
    );

    if (leftDist <= radius) return 'left';
    if (rightDist <= radius) return 'right';
    return null;
  };

  const checkHit = (
    arrowPos: Position,
    potCenter: Position,
    dimensions: PotDimensions
  ): 'mouth' | 'ear' | 'miss' => {
    if (isInMouth(arrowPos, potCenter, dimensions.mouthDiameter)) {
      return 'mouth';
    }
    if (isInEar(arrowPos, potCenter, dimensions.earDiameter, dimensions.earOffset)) {
      return 'ear';
    }
    return 'miss';
  };

  return { checkHit, isInMouth, isInEar };
};

export const calculateParabola = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  height: number,
  t: number
): { x: number; y: number; rotation: number } => {
  const x = startX + (endX - startX) * t;
  const y = startY + (endY - startY) * t - height * Math.sin(Math.PI * t);

  const dx = endX - startX;
  const dy = (endY - startY) - height * Math.PI * Math.cos(Math.PI * t);
  const rotation = Math.atan2(dy, dx) * (180 / Math.PI);

  return { x, y, rotation };
};
