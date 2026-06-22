export enum ResourceType { IRON = 'IRON', CRYSTAL = 'CRYSTAL', GAS = 'GAS' }
export enum FleetState { IDLE = 'IDLE', MOVING_TO_RESOURCE = 'MOVING_TO_RESOURCE', COLLECTING = 'COLLECTING', RETURNING = 'RETURNING', IN_COMBAT = 'IN_COMBAT', RETURNING_DAMAGED = 'RETURNING_DAMAGED' }
export enum CellType { EMPTY = 'EMPTY', OBSTACLE = 'OBSTACLE', RESOURCE = 'RESOURCE', BASE = 'BASE' }

export interface Vec2 { x: number; y: number }

export interface ResourceStorage { iron: number; crystal: number; gas: number }

export interface UpgradeCost { iron: number; crystal: number; gas: number }

export const UPGRADE_COSTS: UpgradeCost[] = [
  { iron: 0, crystal: 0, gas: 0 },
  { iron: 100, crystal: 50, gas: 30 },
  { iron: 300, crystal: 150, gas: 80 },
  { iron: 800, crystal: 400, gas: 200 },
  { iron: 2000, crystal: 1000, gas: 500 },
]

export const WAREHOUSE_CAPACITY = [0, 500, 1200, 2500, 5000, 10000]
export const BUILD_SPEED = [0, 1.0, 1.2, 1.5, 2.0, 3.0]
export const INFLUENCE_RANGE = [0, 1, 2, 3, 4, 5]

export const COLORS = {
  IRON: 0xff8c00,
  CRYSTAL: 0x4fc3f7,
  GAS: 0x66bb6a,
  NEON_BLUE: 0x00d4ff,
  BG_DARK_PURPLE: 0x1a0a2e,
  BG_DARK_BLUE: 0x0a1628,
  GRID_LINE: 0x1a2a4a,
  BASE: 0x00d4ff,
  ENEMY: 0xff3366,
  PATH: 0x00ff88,
}

export const GRID_SIZE = 100
export const CELL_SIZE = 64

export interface GameStats {
  totalCollected: ResourceStorage;
  activeFleets: number;
  totalBases: number;
  piratesDefeated: number;
  runTime: number;
}
