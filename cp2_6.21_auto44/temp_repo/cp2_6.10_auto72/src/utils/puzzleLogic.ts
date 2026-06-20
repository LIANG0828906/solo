export const CELESTIAL_SYMBOLS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export type CelestialSymbol = typeof CELESTIAL_SYMBOLS[number];

export interface LockRingState {
  id: number;
  angle: number;
  currentSymbol: CelestialSymbol;
  isLocked: boolean;
  isSuccess: boolean;
  isFailed: boolean;
}

export const DEGREES_PER_SYMBOL = 30;

export function angleToSymbol(angle: number): CelestialSymbol {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  const index = Math.round(normalizedAngle / DEGREES_PER_SYMBOL) % 12;
  return CELESTIAL_SYMBOLS[index];
}

export function snapToNearestTick(angle: number): number {
  return Math.round(angle / DEGREES_PER_SYMBOL) * DEGREES_PER_SYMBOL;
}

export function validateCombination(
  current: CelestialSymbol[],
  target: CelestialSymbol[]
): boolean {
  const startTime = performance.now();
  const result = current.every((symbol, index) => symbol === target[index]);
  const endTime = performance.now();
  console.debug(`校验耗时: ${(endTime - startTime).toFixed(3)}ms`);
  return result;
}

export function calculateRotation(
  centerX: number,
  centerY: number,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
): number {
  const startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
  const currentAngle = Math.atan2(currentY - centerY, currentX - centerX) * (180 / Math.PI);
  return currentAngle - startAngle;
}

export function getRandomAngle(): number {
  return Math.floor(Math.random() * 12) * DEGREES_PER_SYMBOL;
}

export function generateTargetCombination(): CelestialSymbol[] {
  return ['辰', '申', '子'];
}

export function createInitialRingState(id: number): LockRingState {
  const angle = getRandomAngle();
  return {
    id,
    angle,
    currentSymbol: angleToSymbol(angle),
    isLocked: false,
    isSuccess: false,
    isFailed: false,
  };
}
