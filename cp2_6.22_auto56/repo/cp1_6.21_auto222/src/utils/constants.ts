import type { BuildingConfig, Resources } from '../types';

export const GRID_SIZE = 20;
export const TILE_W = 40;
export const TILE_H = 20;

export const INITIAL_RESOURCES: Resources = {
  oxygen: 100,
  energy: 100,
  metal: 150,
  oxygenMax: 300,
  energyMax: 300,
  metalMax: 500,
};

export const BUILDING_CONFIGS: Record<string, BuildingConfig> = {
  oxygen_tower: {
    type: 'oxygen_tower',
    name: '氧气塔',
    icon: '🫧',
    size: 2,
    color: '#3B82F6',
    production: { oxygen: 2.5, energy: -1, metal: 0 },
    cost: { oxygen: 0, energy: 30, metal: 40 },
  },
  solar_panel: {
    type: 'solar_panel',
    name: '太阳能板',
    icon: '☀️',
    size: 2,
    color: '#F59E0B',
    production: { oxygen: 0, energy: 3, metal: 0 },
    cost: { oxygen: 0, energy: 0, metal: 35 },
  },
  fuel_refinery: {
    type: 'fuel_refinery',
    name: '燃料精炼厂',
    icon: '⚗️',
    size: 3,
    color: '#8B5CF6',
    production: { oxygen: -1, energy: -2, metal: 2 },
    cost: { oxygen: 20, energy: 50, metal: 80 },
  },
  habitat: {
    type: 'habitat',
    name: '居住舱',
    icon: '🏠',
    size: 3,
    color: '#10B981',
    production: { oxygen: -1.5, energy: -1, metal: 0 },
    cost: { oxygen: 40, energy: 60, metal: 100 },
  },
  mining_drill: {
    type: 'mining_drill',
    name: '采矿钻机',
    icon: '⛏️',
    size: 2,
    color: '#EF4444',
    production: { oxygen: 0, energy: -1.5, metal: 3 },
    cost: { oxygen: 0, energy: 40, metal: 50 },
  },
};

export const SANDSTORM_MIN_INTERVAL = 60000;
export const SANDSTORM_MAX_INTERVAL = 120000;
export const SANDSTORM_MIN_DURATION = 15000;
export const SANDSTORM_MAX_DURATION = 20000;
export const SANDSTORM_MULTIPLIER = 1.5;
export const PARTICLE_COUNT = 30;
export const SURVIVAL_TICK_MS = 100;
export const DAY_DURATION_MS = 10000;
