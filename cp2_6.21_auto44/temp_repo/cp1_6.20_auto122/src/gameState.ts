export type TileType = 'wall' | 'floor';

export type EnemyType = 'slime' | 'skeleton' | 'bat';

export type ItemType = 'weapon' | 'armor' | 'accessory' | 'potion';

export type ItemQuality = 'common' | 'rare' | 'legendary';

export interface Position {
  x: number;
  y: number;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  quality: ItemQuality;
  attackBonus: number;
  defenseBonus: number;
  healthBonus?: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  name: string;
  position: Position;
  maxHealth: number;
  health: number;
  attack: number;
  defense: number;
  expReward: number;
}

export interface Chest {
  id: string;
  position: Position;
  item: Item;
}

export interface Player {
  position: Position;
  maxHealth: number;
  health: number;
  baseAttack: number;
  baseDefense: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  gold: number;
  kills: number;
  inventory: Item[];
  inventoryCapacity: number;
  equipped: {
    weapon: Item | null;
    armor: Item | null;
    accessory: Item | null;
  };
}

export interface GameStateData {
  map: TileType[][];
  player: Player;
  enemies: Enemy[];
  chests: Chest[];
  combatLog: string[];
  isGameOver: boolean;
  showInventory: boolean;
  score: number;
  mapWidth: number;
  mapHeight: number;
}

export class GameState {
  public data: GameStateData;

  constructor(mapWidth: number = 20, mapHeight: number = 20) {
    this.data = {
      map: [],
      player: this.createInitialPlayer(),
      enemies: [],
      chests: [],
      combatLog: [],
      isGameOver: false,
      showInventory: false,
      score: 0,
      mapWidth,
      mapHeight
    };
  }

  private createInitialPlayer(): Player {
    return {
      position: { x: 1, y: 1 },
      maxHealth: 20,
      health: 20,
      baseAttack: 5,
      baseDefense: 0,
      level: 1,
      exp: 0,
      expToNextLevel: 20,
      gold: 0,
      kills: 0,
      inventory: [],
      inventoryCapacity: 10,
      equipped: {
        weapon: null,
        armor: null,
        accessory: null
      }
    };
  }

  public getTotalAttack(): number {
    const { weapon, armor, accessory } = this.data.player.equipped;
    return (
      this.data.player.baseAttack +
      (weapon?.attackBonus || 0) +
      (armor?.attackBonus || 0) +
      (accessory?.attackBonus || 0)
    );
  }

  public getTotalDefense(): number {
    const { weapon, armor, accessory } = this.data.player.equipped;
    return (
      this.data.player.baseDefense +
      (weapon?.defenseBonus || 0) +
      (armor?.defenseBonus || 0) +
      (accessory?.defenseBonus || 0)
    );
  }

  public addCombatLog(message: string, type: 'player' | 'enemy' | 'system' | 'loot' | 'levelup' = 'system'): void {
    const formattedMessage = `<span class="log-entry log-${type}">${message}</span>`;
    this.data.combatLog.push(formattedMessage);
    if (this.data.combatLog.length > 10) {
      this.data.combatLog.shift();
    }
  }

  public calculateScore(): number {
    return (
      this.data.player.kills * 10 +
      this.data.player.gold * 2 +
      this.data.player.level * 50
    );
  }

  public reset(): void {
    this.data.map = [];
    this.data.player = this.createInitialPlayer();
    this.data.enemies = [];
    this.data.chests = [];
    this.data.combatLog = [];
    this.data.isGameOver = false;
    this.data.showInventory = false;
    this.data.score = 0;
  }
}
