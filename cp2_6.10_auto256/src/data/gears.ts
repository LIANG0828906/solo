import type { Gear, LightJadeType } from '@/types';
import { INITIAL_GEARS, COLOR_THEME } from '@/types';

export const createGear = (
  id: string,
  name: string,
  position: { x: number; y: number; z: number },
  teeth: number,
  targetAngle: number,
  jadeSlot: LightJadeType | null
): Gear => {
  const radius = teeth * 0.05;
  return {
    id,
    name,
    position,
    teeth,
    radius,
    currentAngle: 0,
    targetAngle,
    rotationSpeed: 48 / teeth,
    isActive: false,
    jadeSlot,
    embeddedJade: null,
    rotation: 0,
    targetRotation: targetAngle,
    hasJade: false,
    jadeType: null,
    isCorrect: false
  };
};

export const GEAR_CONFIGS: Gear[] = INITIAL_GEARS.map(gear => ({
  ...gear,
  embeddedJade: null,
  rotation: gear.currentAngle,
  targetRotation: gear.targetAngle,
  hasJade: false,
  jadeType: null,
  isCorrect: false
}));

export const initialGears: Gear[] = [
  { id: 'gear-1', name: '中央齿轮', position: { x: 0, y: 0, z: 0 }, teeth: 48, radius: 2.4, rotation: 0, targetRotation: 0, currentAngle: 0, targetAngle: 0, rotationSpeed: 0.5, isActive: false, jadeSlot: 'fullMoon', embeddedJade: null, hasJade: false, jadeType: null, isCorrect: false },
  { id: 'gear-2', name: '北方齿轮', position: { x: 0, y: 3.5, z: 0 }, teeth: 24, radius: 1.2, rotation: 45, targetRotation: 90, currentAngle: 45, targetAngle: 90, rotationSpeed: 1, isActive: false, jadeSlot: 'firstQuarter', embeddedJade: null, hasJade: false, jadeType: null, isCorrect: false },
  { id: 'gear-3', name: '东方齿轮', position: { x: 3.5, y: 0, z: 0 }, teeth: 32, radius: 1.6, rotation: 120, targetRotation: 180, currentAngle: 120, targetAngle: 180, rotationSpeed: 0.75, isActive: false, jadeSlot: 'gibbous', embeddedJade: null, hasJade: false, jadeType: null, isCorrect: false },
  { id: 'gear-4', name: '南方齿轮', position: { x: 0, y: -3.5, z: 0 }, teeth: 16, radius: 0.8, rotation: 200, targetRotation: 270, currentAngle: 200, targetAngle: 270, rotationSpeed: 1.5, isActive: false, jadeSlot: 'crescent', embeddedJade: null, hasJade: false, jadeType: null, isCorrect: false },
  { id: 'gear-5', name: '西方齿轮', position: { x: -3.5, y: 0, z: 0 }, teeth: 20, radius: 1.0, rotation: 300, targetRotation: 0, currentAngle: 300, targetAngle: 0, rotationSpeed: 1.2, isActive: false, jadeSlot: 'newMoon', embeddedJade: null, hasJade: false, jadeType: null, isCorrect: false },
];

export const getGearById = (id: string): Gear | undefined => {
  return GEAR_CONFIGS.find(gear => gear.id === id);
};

export const getGearsBySlotType = (type: LightJadeType): Gear[] => {
  return GEAR_CONFIGS.filter(gear => gear.jadeSlot === type);
};

export const calculateGearRatio = (gear1: Gear, gear2: Gear): number => {
  return gear2.teeth / gear1.teeth;
};

export const isGearAligned = (gear: Gear, tolerance: number = 5): boolean => {
  const normalizedCurrent = ((gear.currentAngle % 360) + 360) % 360;
  const normalizedTarget = ((gear.targetAngle % 360) + 360) % 360;
  const diff = Math.abs(normalizedCurrent - normalizedTarget);
  return Math.min(diff, 360 - diff) <= tolerance;
};

export const areAllGearsAligned = (gears: Gear[]): boolean => {
  return gears.every(gear => isGearAligned(gear));
};

export const resetGear = (gear: Gear): Gear => {
  return {
    ...gear,
    currentAngle: 0,
    isActive: false,
    embeddedJade: null
  };
};

export const rotateGear = (gear: Gear, direction: 1 | -1 = 1): Gear => {
  if (!gear.isActive) return gear;
  return {
    ...gear,
    currentAngle: gear.currentAngle + gear.rotationSpeed * direction
  };
};

export const getAdjacentGears = (gear: Gear, allGears: Gear[]): Gear[] => {
  const distanceThreshold = 4.5;
  return allGears.filter(g => {
    if (g.id === gear.id) return false;
    const dx = g.position.x - gear.position.x;
    const dy = g.position.y - gear.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= distanceThreshold;
  });
};

export const GEAR_COLORS = {
  inactive: COLOR_THEME.moonGray,
  active: COLOR_THEME.jadeGold,
  aligned: '#90EE90',
  misaligned: '#FF6B6B'
};

export const getGearColor = (gear: Gear): string => {
  if (isGearAligned(gear) && gear.isActive) {
    return GEAR_COLORS.aligned;
  }
  if (gear.isActive) {
    return GEAR_COLORS.active;
  }
  return GEAR_COLORS.inactive;
};

export { INITIAL_GEARS };
