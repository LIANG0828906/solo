import { World, WorldSnapshot } from './World';
import { TrashType } from './types';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  collect: boolean;
  deposit: boolean;
  depositType: TrashType | null;
  mouseX: number;
  mouseY: number;
}

export class GameEngine {
  world: World;
  input: InputState;
  private running = false;
  private rafId: number | null = null;
  private lastTime = 0;
  private onStateUpdate: ((snapshot: WorldSnapshot) => void) | null = null;
  private spatialGrid: Map<string, number[]> = new Map();
  private readonly GRID_SIZE = 64;

  constructor() {
    this.world = new World();
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      collect: false,
      deposit: false,
      depositType: null,
      mouseX: 0,
      mouseY: 0,
    };
  }

  setOnStateUpdate(cb: (snapshot: WorldSnapshot) => void) {
    this.onStateUpdate = cb;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.update(dt);
    if (this.onStateUpdate) {
      this.onStateUpdate(this.world.getSnapshot());
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  private buildSpatialGrid() {
    this.spatialGrid.clear();
    const items = this.world.trashItems;
    for (let i = 0; i < items.length; i++) {
      if (items[i].collected || items[i].collecting) continue;
      const gx = Math.floor(items[i].x / this.GRID_SIZE);
      const gy = Math.floor(items[i].y / this.GRID_SIZE);
      const key = `${gx},${gy}`;
      let cell = this.spatialGrid.get(key);
      if (!cell) {
        cell = [];
        this.spatialGrid.set(key, cell);
      }
      cell.push(i);
    }
  }

  private update(dt: number) {
    const inp = this.input;
    let dx = 0;
    let dy = 0;
    if (inp.up) dy -= 1;
    if (inp.down) dy += 1;
    if (inp.left) dx -= 1;
    if (inp.right) dx += 1;
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    this.world.player.move(dx, dy, 640, 480);

    if (inp.collect) {
      this.world.tryCollect();
    }

    if (inp.deposit && inp.depositType) {
      this.world.tryDeposit(inp.depositType);
      inp.deposit = false;
      inp.depositType = null;
    }

    this.buildSpatialGrid();
    this.world.checkObstacleDamage();
    this.world.update(dt);
  }

  getWorld(): World {
    return this.world;
  }
}
