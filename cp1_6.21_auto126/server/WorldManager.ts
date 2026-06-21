export enum BlockType {
  GRASS = 'grass',
  DIRT = 'dirt',
  WOOD = 'wood',
  STONE = 'stone',
  GLASS = 'glass',
  BRICK = 'brick',
  TREE_TRUNK = 'tree_trunk',
  TREE_LEAVES = 'tree_leaves',
  FLOWER = 'flower'
}

export interface BlockData {
  x: number;
  y: number;
  z: number;
  type: BlockType;
  color?: string;
}

interface PlayerData {
  id: string;
  nickname: string;
  avatarColor: string;
  position: { x: number; y: number; z: number };
}

const WORLD_SIZE = 50;
const WORLD_HEIGHT = 50;
const FLOWER_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6FD8', '#9B59B6'];

export class WorldManager {
  private blocks: Map<string, BlockData> = new Map();
  private players: Map<string, PlayerData> = new Map();

  constructor() {
    this.generateWorld();
  }

  private getKey(x: number, y: number, z: number): string {
    return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  }

  private isInBounds(x: number, y: number, z: number): boolean {
    return x >= -WORLD_SIZE && x <= WORLD_SIZE &&
           z >= -WORLD_SIZE && z <= WORLD_SIZE &&
           y >= 0 && y <= WORLD_HEIGHT;
  }

  private generateWorld(): void {
    for (let x = -WORLD_SIZE; x <= WORLD_SIZE; x++) {
      for (let z = -WORLD_SIZE; z <= WORLD_SIZE; z++) {
        this.setBlock(x, 0, z, BlockType.GRASS);
      }
    }

    const treeCount = Math.floor((WORLD_SIZE * 2) * (WORLD_SIZE * 2) / 400);
    for (let i = 0; i < treeCount; i++) {
      const x = Math.floor(Math.random() * (WORLD_SIZE * 2 - 10)) - WORLD_SIZE + 5;
      const z = Math.floor(Math.random() * (WORLD_SIZE * 2 - 10)) - WORLD_SIZE + 5;
      
      if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
      
      this.generateTree(x, z);
    }

    const flowerCount = Math.floor((WORLD_SIZE * 2) * (WORLD_SIZE * 2) / 200);
    for (let i = 0; i < flowerCount; i++) {
      const x = Math.floor(Math.random() * (WORLD_SIZE * 2 - 4)) - WORLD_SIZE + 2;
      const z = Math.floor(Math.random() * (WORLD_SIZE * 2 - 4)) - WORLD_SIZE + 2;
      
      if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;
      if (this.getBlock(x, 1, z)) continue;
      
      const color = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
      this.setBlock(x, 1, z, BlockType.FLOWER, color);
    }
  }

  private generateTree(x: number, z: number): void {
    const trunkHeight = 4 + Math.floor(Math.random() * 2);
    
    for (let y = 1; y <= trunkHeight; y++) {
      this.setBlock(x, y, z, BlockType.TREE_TRUNK);
    }

    const leafRadius = 2;
    for (let dx = -leafRadius; dx <= leafRadius; dx++) {
      for (let dz = -leafRadius; dz <= leafRadius; dz++) {
        for (let dy = 0; dy <= leafRadius; dy++) {
          const dist = Math.sqrt(dx * dx + dz * dz + dy * dy);
          if (dist <= leafRadius + 0.5) {
            const lx = x + dx;
            const ly = trunkHeight + dy;
            const lz = z + dz;
            if (!this.getBlock(lx, ly, lz)) {
              this.setBlock(lx, ly, lz, BlockType.TREE_LEAVES);
            }
          }
        }
      }
    }
  }

  getBlock(x: number, y: number, z: number): BlockData | undefined {
    return this.blocks.get(this.getKey(x, y, z));
  }

  setBlock(x: number, y: number, z: number, type: BlockType, color?: string): boolean {
    if (!this.isInBounds(x, y, z)) return false;
    
    const key = this.getKey(x, y, z);
    const block: BlockData = { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z), type };
    if (color) block.color = color;
    this.blocks.set(key, block);
    return true;
  }

  removeBlock(x: number, y: number, z: number): boolean {
    const key = this.getKey(x, y, z);
    return this.blocks.delete(key);
  }

  getAllBlocks(): BlockData[] {
    return Array.from(this.blocks.values());
  }

  addPlayer(player: PlayerData): void {
    this.players.set(player.id, player);
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  getPlayer(playerId: string): PlayerData | undefined {
    return this.players.get(playerId);
  }

  getAllPlayers(): PlayerData[] {
    return Array.from(this.players.values());
  }

  updatePlayerPosition(playerId: string, position: { x: number; y: number; z: number }): void {
    const player = this.players.get(playerId);
    if (player) {
      player.position = position;
    }
  }
}
