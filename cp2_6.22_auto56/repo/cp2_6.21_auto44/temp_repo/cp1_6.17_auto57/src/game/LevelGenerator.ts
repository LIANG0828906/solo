import { v4 as uuidv4 } from 'uuid';
import {
  Floor,
  Enemy,
  EnemyType,
  Chest,
  ChestType,
  Trap,
  TrapType,
  Item,
  ItemType,
  ItemRarity,
} from '../types';
import { COLORS, DIMENSIONS, GAME, ITEM_NAMES } from '../utils/constants';

export class LevelGenerator {
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  generateFloor(level: number, totalFloors: number): Floor {
    const startTime = performance.now();

    const isBossFloor = level === totalFloors;
    const floorHeight = DIMENSIONS.FLOOR_HEIGHT;
    const floorY = this.canvasHeight - (level + 1) * floorHeight;

    const t = (level - 1) / Math.max(1, totalFloors - 1);
    const floorColor = this.lerpColor(COLORS.FLOOR_BOTTOM, COLORS.FLOOR_TOP, t);

    const enemyCount = GAME.BASE_ENEMY_COUNT + Math.floor(level * 1.5);
    const chestCount = GAME.BASE_CHEST_COUNT + Math.floor(level * 0.5);
    const trapCount = GAME.BASE_TRAP_COUNT + Math.floor(level * 0.8);

    const enemies: Enemy[] = [];
    for (let i = 0; i < enemyCount; i++) {
      const types: EnemyType[] = ['slime', 'skeleton', 'bat'];
      const type = types[Math.floor(Math.random() * types.length)];
      enemies.push(this.generateEnemy(type, floorY, floorHeight));
    }

    const chests: Chest[] = [];
    for (let i = 0; i < chestCount; i++) {
      const types: ChestType[] = ['wooden', 'silver'];
      const type = types[Math.floor(Math.random() * types.length)];
      chests.push(this.generateChest(type, floorY, floorHeight));
    }

    const traps: Trap[] = [];
    for (let i = 0; i < trapCount; i++) {
      const types: TrapType[] = ['falling_rock', 'spike'];
      const type = types[Math.floor(Math.random() * types.length)];
      traps.push(this.generateTrap(type, floorY, floorHeight));
    }

    const stairsX = this.canvasWidth - 60;
    const stairsY = floorY + floorHeight - 32;

    const generationTime = performance.now() - startTime;
    if (generationTime > 100) {
      console.warn(`Floor generation took ${generationTime}ms, exceeds 100ms limit`);
    }

    return {
      level,
      width: this.canvasWidth,
      height: floorHeight,
      floorColor,
      enemies,
      chests,
      traps,
      stairsX,
      stairsY,
      isBossFloor,
    };
  }

  private generateEnemy(type: EnemyType, floorY: number, floorHeight: number): Enemy {
    const baseStats = {
      slime: { health: 30, attack: 5, speed: 1, width: 20, height: 16 },
      skeleton: { health: 40, attack: 8, speed: 0.8, width: 18, height: 24 },
      bat: { health: 20, attack: 6, speed: 1.5, width: 22, height: 14 },
    };

    const stats = baseStats[type];
    const x = 100 + Math.random() * (this.canvasWidth - 200);
    const y = floorY + floorHeight - stats.height - 4;

    return {
      id: uuidv4(),
      type,
      x,
      y,
      width: stats.width,
      height: stats.height,
      health: stats.health,
      maxHealth: stats.health,
      attack: stats.attack,
      speed: stats.speed,
      direction: 'left',
      aiState: {},
      alive: true,
      deathTimer: 0,
    };
  }

  private generateChest(type: ChestType, floorY: number, floorHeight: number): Chest {
    const x = 100 + Math.random() * (this.canvasWidth - 200);
    const y = floorY + floorHeight - 24;
    const isSilver = type === 'silver';

    const contents: { gold?: number; item?: Item } = {};
    if (Math.random() < 0.7) {
      const min = GAME.WOODEN_CHEST_GOLD_MIN;
      const max = GAME.WOODEN_CHEST_GOLD_MAX;
      const multiplier = isSilver ? 2 : 1;
      contents.gold = Math.floor((min + Math.random() * (max - min)) * multiplier);
    }
    if (Math.random() < (isSilver ? 0.8 : 0.3)) {
      contents.item = this.generateRandomItem();
    }

    return {
      id: uuidv4(),
      type,
      x,
      y,
      width: 24,
      height: 20,
      opened: false,
      openAnimation: 0,
      glowAnimation: 0,
      contents,
    };
  }

  private generateTrap(type: TrapType, floorY: number, floorHeight: number): Trap {
    const x = 100 + Math.random() * (this.canvasWidth - 200);
    const y = type === 'spike' ? floorY + floorHeight - 12 : floorY + floorHeight - 20;

    return {
      id: uuidv4(),
      type,
      x,
      y,
      width: type === 'spike' ? 24 : 20,
      height: type === 'spike' ? 12 : 20,
      active: true,
      animationTimer: 0,
      triggered: false,
    };
  }

  private generateRandomItem(): Item {
    const types: ItemType[] = ['weapon', 'armor', 'accessory'];
    const type = types[Math.floor(Math.random() * types.length)];

    const rarityRoll = Math.random();
    let rarity: ItemRarity;
    if (rarityRoll < 0.6) {
      rarity = 'common';
    } else if (rarityRoll < 0.9) {
      rarity = 'rare';
    } else {
      rarity = 'epic';
    }

    const rarityMultiplier = { common: 1, rare: 1.5, epic: 2 };
    const multiplier = rarityMultiplier[rarity];

    const names = ITEM_NAMES[type];
    const name = names[Math.floor(Math.random() * names.length)];

    const descriptions = {
      weapon: '一把锋利的武器',
      armor: '一件坚固的护甲',
      accessory: '一件神秘的饰品',
    };

    const baseStats = {
      weapon: { attack: 5 },
      armor: { defense: 3 },
      accessory: { health: 20 },
    };

    const stats: Item['stats'] = {};
    Object.entries(baseStats[type]).forEach(([key, value]) => {
      stats[key as keyof typeof stats] = Math.floor(value * multiplier);
    });

    const icons = {
      weapon: '⚔️',
      armor: '🛡️',
      accessory: '💍',
    };

    return {
      id: uuidv4(),
      name,
      type,
      rarity,
      description: descriptions[type],
      stats,
      icon: icons[type],
    };
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}
