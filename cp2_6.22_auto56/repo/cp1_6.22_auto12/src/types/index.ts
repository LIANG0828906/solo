export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Hero {
  id: string;
  name: string;
  position: Position;
  targetPosition: Position | null;
  moveProgress: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  equipment: {
    weapon: Item | null;
    shield: Item | null;
    potion: Item | null;
  };
  inventory: Item[];
  isAttacking: boolean;
  attackFrame: number;
}

export interface Monster {
  id: string;
  name: string;
  position: Position;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  sprite: string;
  isHit: boolean;
  hitFrame: number;
}

export type ItemType = 'weapon' | 'shield' | 'potion';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  attackBonus: number;
  defenseBonus: number;
  healAmount: number;
  description: string;
}

export type TileType = 'wall' | 'floor' | 'door' | 'stairs';

export interface Tile {
  type: TileType;
  explored: boolean;
  visible: boolean;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  center: Position;
}

export interface MapData {
  tiles: Tile[][];
  rooms: Room[];
  width: number;
  height: number;
  tileSize: number;
}

export interface Chest {
  id: string;
  position: Position;
  opened: boolean;
  items: Item[];
}

export type GameScene = 'exploration' | 'combat' | 'gameOver' | 'victory';

export interface CombatState {
  monster: Monster | null;
  turn: 'hero' | 'monster';
  logs: CombatLog[];
  logIndex: number;
  charIndex: number;
  isAnimating: boolean;
  drops: Item[];
  showLoot: boolean;
}

export interface CombatLog {
  text: string;
  type: 'damage' | 'heal' | 'info' | 'victory';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface GameState {
  scene: GameScene;
  hero: Hero;
  map: MapData;
  monsters: Monster[];
  chests: Chest[];
  stairs: Position | null;
  floor: number;
  combat: CombatState;
  nearbyInteractable: { type: 'chest' | 'stairs' | 'monster'; id?: string } | null;
  particles: Particle[];
  selectedItem: string | null;
  draggedItem: Item | null;
}

export interface SaveData {
  id: string;
  hero: Hero;
  floor: number;
  timestamp: number;
}
