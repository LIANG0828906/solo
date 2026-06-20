export enum BlockType {
  Empty = 0,
  Dirt = 1,
  Stone = 2,
  Wood = 3,
  Metal = 4,
  Glow = 5,
}

export const BLOCK_COLORS: Record<BlockType, number> = {
  [BlockType.Empty]: 0x000000,
  [BlockType.Dirt]: 0x8b5e3c,
  [BlockType.Stone]: 0x808080,
  [BlockType.Wood]: 0xdeb887,
  [BlockType.Metal]: 0xa9a9a9,
  [BlockType.Glow]: 0xffd700,
};

export const GRID_SIZE = 32;
export const GRID_HEIGHT = 32;
export const MAX_BLOCKS = 2000;

export class BlockGrid {
  private data: Uint8Array;
  private blockCount: number = 0;

  constructor() {
    this.data = new Uint8Array(GRID_SIZE * GRID_HEIGHT * GRID_SIZE);
  }

  private getIndex(x: number, y: number, z: number): number {
    return x + z * GRID_SIZE + y * GRID_SIZE * GRID_SIZE;
  }

  get(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_HEIGHT || z < 0 || z >= GRID_SIZE) {
      return BlockType.Empty;
    }
    return this.data[this.getIndex(x, y, z)] as BlockType;
  }

  set(x: number, y: number, z: number, type: BlockType): boolean {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_HEIGHT || z < 0 || z >= GRID_SIZE) {
      return false;
    }
    const idx = this.getIndex(x, y, z);
    const current = this.data[idx];
    if (current === BlockType.Empty && type !== BlockType.Empty) {
      if (this.blockCount >= MAX_BLOCKS) return false;
      this.blockCount++;
    } else if (current !== BlockType.Empty && type === BlockType.Empty) {
      this.blockCount--;
    }
    this.data[idx] = type;
    return true;
  }

  remove(x: number, y: number, z: number): BlockType {
    const type = this.get(x, y, z);
    if (type !== BlockType.Empty) {
      this.set(x, y, z, BlockType.Empty);
    }
    return type;
  }

  getCount(): number {
    return this.blockCount;
  }

  hasBlock(x: number, y: number, z: number): boolean {
    return this.get(x, y, z) !== BlockType.Empty;
  }

  isSupported(x: number, y: number, z: number): boolean {
    if (y <= 0) return true;
    return this.hasBlock(x, y - 1, z);
  }

  getAllBlocks(): Array<{ x: number; y: number; z: number; type: BlockType }> {
    const blocks: Array<{ x: number; y: number; z: number; type: BlockType }> = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const type = this.get(x, y, z);
          if (type !== BlockType.Empty) {
            blocks.push({ x, y, z, type });
          }
        }
      }
    }
    return blocks;
  }

  clear(): void {
    this.data.fill(0);
    this.blockCount = 0;
  }
}
