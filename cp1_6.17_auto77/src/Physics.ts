import { BlockGrid, BlockType, GRID_SIZE, GRID_HEIGHT } from './BlockGrid';

export interface FallingBlock {
  id: string;
  x: number;
  y: number;
  z: number;
  type: BlockType;
  velocityY: number;
  fallDelay: number;
  isFalling: boolean;
  bounceCount: number;
  originalGridY: number;
}

export interface NewFallingBlock {
  id: string;
  x: number;
  y: number;
  z: number;
  type: BlockType;
}

export interface MovedBlock {
  id: string;
  x: number;
  y: number;
  z: number;
  prevY: number;
  type: BlockType;
}

export interface LandedBlock {
  id: string;
  x: number;
  y: number;
  z: number;
  velocity: number;
  type: BlockType;
}

const GRAVITY = 9.8;
const FALL_DELAY = 0.5;
const BOUNCE_DAMPING = 0.3;
const MAX_BOUNCES = 2;
const MIN_BOUNCE_VELOCITY = 0.8;

export class Physics {
  private grid: BlockGrid;
  private fallingBlocks: Map<string, FallingBlock> = new Map();
  private idCounter: number = 0;

  constructor(grid: BlockGrid) {
    this.grid = grid;
  }

  update(deltaTime: number): {
    newFallingBlocks: NewFallingBlock[];
    movedBlocks: MovedBlock[];
    landedBlocks: LandedBlock[];
  } {
    const newFallingBlocks: NewFallingBlock[] = [];
    const movedBlocks: MovedBlock[] = [];
    const landedBlocks: LandedBlock[] = [];

    this.checkUnsupportedBlocks(newFallingBlocks);

    const toRemove: string[] = [];

    for (const block of this.fallingBlocks.values()) {
      const prevY = block.y;

      if (!block.isFalling) {
        block.fallDelay -= deltaTime;
        if (block.fallDelay <= 0) {
          block.isFalling = true;
        } else {
          continue;
        }
      }

      block.velocityY -= GRAVITY * deltaTime;
      block.y += block.velocityY * deltaTime;

      let landed = false;
      let landY = 0;

      if (block.y <= 0) {
        landed = true;
        landY = 0;
        block.y = 0;
      } else {
        const belowGridY = Math.floor(block.y - 0.5);
        if (belowGridY >= 0 && this.grid.hasBlock(block.x, belowGridY, block.z)) {
          landed = true;
          landY = belowGridY + 1;
          block.y = landY;
        }
      }

      if (landed) {
        block.bounceCount++;
        if (block.bounceCount >= MAX_BOUNCES || Math.abs(block.velocityY) < MIN_BOUNCE_VELOCITY) {
          const finalY = Math.max(0, Math.min(GRID_HEIGHT - 1, Math.round(block.y)));
          this.grid.set(block.x, finalY, block.z, block.type);
          landedBlocks.push({
            id: block.id,
            x: block.x,
            y: finalY,
            z: block.z,
            velocity: Math.abs(block.velocityY),
            type: block.type,
          });
          toRemove.push(block.id);
          continue;
        } else {
          block.velocityY = Math.abs(block.velocityY) * BOUNCE_DAMPING;
          block.y = landY;
        }
      }

      if (Math.abs(block.y - prevY) > 0.001) {
        movedBlocks.push({
          id: block.id,
          x: block.x,
          y: block.y,
          z: block.z,
          prevY,
          type: block.type,
        });
      }
    }

    for (const id of toRemove) {
      this.fallingBlocks.delete(id);
    }

    return { newFallingBlocks, movedBlocks, landedBlocks };
  }

  private checkUnsupportedBlocks(newFalling: NewFallingBlock[]): void {
    const blocks = this.grid.getAllBlocks();
    for (const block of blocks) {
      if (this.grid.isSupported(block.x, block.y, block.z)) continue;

      let alreadyFalling = false;
      for (const fb of this.fallingBlocks.values()) {
        if (fb.x === block.x && fb.z === block.z && Math.floor(fb.y) === block.y) {
          alreadyFalling = true;
          break;
        }
      }
      if (alreadyFalling) continue;

      const id = this.createFallingBlock(block.x, block.y, block.z, block.type);
      newFalling.push({ id, x: block.x, y: block.y, z: block.z, type: block.type });
    }
  }

  private createFallingBlock(x: number, y: number, z: number, type: BlockType): string {
    this.idCounter++;
    const id = `fall_${this.idCounter}`;

    const falling: FallingBlock = {
      id,
      x,
      y,
      z,
      type,
      velocityY: 0,
      fallDelay: FALL_DELAY,
      isFalling: false,
      bounceCount: 0,
      originalGridY: y,
    };

    this.fallingBlocks.set(id, falling);
    this.grid.set(x, y, z, BlockType.Empty);

    return id;
  }

  notifyBlockRemoved(x: number, y: number, z: number): string[] {
    const newIds: string[] = [];
    for (let checkY = y + 1; checkY < GRID_HEIGHT; checkY++) {
      if (this.grid.hasBlock(x, checkY, z)) {
        const type = this.grid.get(x, checkY, z);
        const id = this.createFallingBlock(x, checkY, z, type);
        newIds.push(id);
      } else {
        break;
      }
    }
    return newIds;
  }

  notifyBlockPlaced(_x: number, _y: number, _z: number): void {
    // 放置的方块会在下一帧 checkUnsupportedBlocks 中自动处理支撑检测
    // 但放在其他方块上方的方块会立即有支撑，所以不会触发下落
  }

  getFallingBlocks(): FallingBlock[] {
    return Array.from(this.fallingBlocks.values());
  }

  getFallingBlockById(id: string): FallingBlock | undefined {
    return this.fallingBlocks.get(id);
  }

  reset(): void {
    this.fallingBlocks.clear();
    this.idCounter = 0;
  }
}
