import type { LightJade, LightJadeType } from '@/types';
import { LIGHT_JADE_CONFIG, COLOR_THEME } from '@/types';

export const LIGHT_JADE_TYPES: LightJadeType[] = ['newMoon', 'crescent', 'firstQuarter', 'gibbous', 'fullMoon'];

export const getLightJadeInfo = (type: LightJadeType) => {
  return LIGHT_JADE_CONFIG[type];
};

export const createLightJade = (
  type: LightJadeType,
  position: { x: number; y: number; z: number },
  id?: string
): LightJade => {
  const info = getLightJadeInfo(type);
  return {
    id: id || `jade-${type}-${Date.now()}`,
    type,
    name: info.name,
    color: COLOR_THEME.jadeGold,
    collected: false,
    position
  };
};

export const INITIAL_LIGHT_JADES: LightJade[] = [
  createLightJade('newMoon', { x: -5, y: -2, z: 0 }, 'jade-newMoon-1'),
  createLightJade('crescent', { x: 2, y: -4, z: 0 }, 'jade-crescent-1'),
  createLightJade('firstQuarter', { x: 4, y: 3, z: 0 }, 'jade-firstQuarter-1'),
  createLightJade('gibbous', { x: -3, y: 4, z: 0 }, 'jade-gibbous-1'),
  createLightJade('fullMoon', { x: 0, y: 0, z: 2 }, 'jade-fullMoon-1')
];

export const LIGHT_JADE_SPAWN_POSITIONS: { x: number; y: number; z: number }[] = [
  { x: -5, y: -2, z: 0 },
  { x: 2, y: -4, z: 0 },
  { x: 4, y: 3, z: 0 },
  { x: -3, y: 4, z: 0 },
  { x: 5, y: -1, z: 0 },
  { x: -4, y: -3, z: 0 },
  { x: 1, y: 5, z: 0 },
  { x: -1, y: -5, z: 0 }
];

export const getRandomSpawnPosition = () => {
  const index = Math.floor(Math.random() * LIGHT_JADE_SPAWN_POSITIONS.length);
  return LIGHT_JADE_SPAWN_POSITIONS[index];
};

export const lightJadeTypes = LIGHT_JADE_TYPES;
export const lightJadeConfig = LIGHT_JADE_CONFIG;

export { LIGHT_JADE_CONFIG, COLOR_THEME };
