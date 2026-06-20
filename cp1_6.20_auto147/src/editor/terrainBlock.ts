export type TerrainType = 'movingPlatform' | 'conveyor' | 'brickWall';

export interface TerrainBlockData {
  id: string;
  type: TerrainType;
  x: number;
  y: number;
  width: number;
  height: number;
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  movePhase?: number;
  conveyorDirection?: 1 | -1;
  conveyorSpeed?: number;
  health?: number;
  destroyed?: boolean;
}

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  movingPlatform: '#e94560',
  conveyor: '#0f3460',
  brickWall: '#533483',
};

const GRID_SIZE = 40;

function snapToGrid(v: number): number {
  return Math.round(v / GRID_SIZE) * GRID_SIZE;
}

let _idCounter = 0;
function genId(): string {
  _idCounter += 1;
  return `b_${Date.now().toString(36)}_${_idCounter}`;
}

export class TerrainBlock {
  public id: string;
  public type: TerrainType;
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  public prevX: number;
  public prevY: number;

  public baseX: number;
  public baseY: number;

  public moveAxis: 'x' | 'y';
  public moveRange: number;
  public moveSpeed: number;
  public movePhase: number;

  public conveyorDirection: 1 | -1;
  public conveyorSpeed: number;

  public health: number;
  public destroyed: boolean;

  public constructor(data: Partial<TerrainBlockData> = {}) {
    this.id = data.id ?? genId();
    this.type = data.type ?? 'movingPlatform';
    this.x = snapToGrid(data.x ?? 200);
    this.y = snapToGrid(data.y ?? 240);
    this.width = data.width ?? (this.type === 'brickWall' ? 80 : 160);
    this.height = data.height ?? (this.type === 'brickWall' ? 80 : 20);
    this.prevX = this.x;
    this.prevY = this.y;

    this.moveAxis = data.moveAxis ?? 'x';
    this.moveRange = data.moveRange ?? 160;
    this.moveSpeed = data.moveSpeed ?? 120;
    this.movePhase = data.movePhase ?? 0;
    this.baseX = this.x - Math.sin(this.movePhase) * (this.moveRange / 2);
    this.baseY = this.y - Math.sin(this.movePhase) * (this.moveRange / 2);

    this.conveyorDirection = data.conveyorDirection ?? 1;
    this.conveyorSpeed = data.conveyorSpeed ?? 150;

    this.health = data.health ?? 3;
    this.destroyed = data.destroyed ?? false;
  }

  public get dx(): number { return this.x - this.prevX; }
  public get dy(): number { return this.y - this.prevY; }

  public refreshBase(): void {
    this.baseX = this.x - Math.sin(this.movePhase) * (this.moveRange / 2);
    this.baseY = this.y - Math.sin(this.movePhase) * (this.moveRange / 2);
  }

  public update(deltaTime: number, running: boolean): void {
    this.prevX = this.x;
    this.prevY = this.y;

    if (!running) return;
    if (this.destroyed) return;

    if (this.type === 'movingPlatform') {
      this.movePhase += deltaTime * (this.moveSpeed / Math.max(40, this.moveRange));
      const offset = Math.sin(this.movePhase) * (this.moveRange / 2);
      if (this.moveAxis === 'x') {
        this.x = this.baseX + offset;
      } else {
        this.y = this.baseY + offset;
      }
    }
  }

  public takeHit(impact: number): boolean {
    if (this.type !== 'brickWall' || this.destroyed) return false;
    if (impact > 260) {
      this.health -= 1;
      if (this.health <= 0) {
        this.destroyed = true;
        return true;
      }
    }
    return false;
  }

  public contains(px: number, py: number): boolean {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  public serialize(): TerrainBlockData {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      moveAxis: this.moveAxis,
      moveRange: this.moveRange,
      moveSpeed: this.moveSpeed,
      movePhase: this.movePhase,
      conveyorDirection: this.conveyorDirection,
      conveyorSpeed: this.conveyorSpeed,
      health: this.health,
      destroyed: this.destroyed,
    };
  }

  public static deserialize(data: TerrainBlockData): TerrainBlock {
    return new TerrainBlock(data);
  }
}
