import { MazeEngine, CELL_SIZE, GRID_SIZE, Frequency, ReflectionData } from './MazeEngine';

export interface Pulse {
  id: number;
  originX: number;
  originY: number;
  radius: number;
  maxRadius: number;
  speed: number;
  frequency: Frequency;
  alive: boolean;
  angle: number;
  directional: boolean;
  hitWalls: Set<string>;
  hitChests: Set<string>;
}

const MAX_PULSES = 20;

export class SonarEngine {
  pulses: Pulse[];
  nextId: number;
  maze: MazeEngine;

  constructor(maze: MazeEngine) {
    this.pulses = [];
    this.nextId = 0;
    this.maze = maze;
  }

  emitPulse(originX: number, originY: number, angle: number, frequency: Frequency): Pulse {
    if (this.pulses.length >= MAX_PULSES) {
      this.pulses.shift();
    }
    const pulse: Pulse = {
      id: this.nextId++,
      originX,
      originY,
      radius: 0,
      maxRadius: GRID_SIZE * CELL_SIZE * 1.5,
      speed: 400,
      frequency,
      alive: true,
      angle,
      directional: true,
      hitWalls: new Set(),
      hitChests: new Set()
    };
    this.pulses.push(pulse);
    return pulse;
  }

  update(dt: number): void {
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      if (!p.alive) {
        this.pulses.splice(i, 1);
        continue;
      }
      p.radius += p.speed * dt;
      if (p.radius >= p.maxRadius) {
        p.alive = false;
        continue;
      }
      this.checkPulseHits(p);
    }
  }

  checkPulseHits(pulse: Pulse): void {
    const checkPoints = 36;
    for (let i = 0; i < checkPoints; i++) {
      const a = pulse.angle - Math.PI / 4 + (Math.PI / 2) * (i / (checkPoints - 1));
      const px = pulse.originX + Math.cos(a) * pulse.radius;
      const py = pulse.originY + Math.sin(a) * pulse.radius;
      const mx = px - this.maze.offsetX;
      const my = py - this.maze.offsetY;
      if (mx < 0 || mx >= GRID_SIZE * CELL_SIZE || my < 0 || my >= GRID_SIZE * CELL_SIZE) continue;
      const gx = Math.floor(mx / CELL_SIZE);
      const gy = Math.floor(my / CELL_SIZE);
      if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) continue;
      const cell = this.maze.grid[gy][gx];
      const key = `${gx},${gy}`;
      const cellCenterX = gx * CELL_SIZE + CELL_SIZE / 2;
      const cellCenterY = gy * CELL_SIZE + CELL_SIZE / 2;
      const relX = mx - cellCenterX;
      const relY = my - cellCenterY;
      let wallHit = false;
      const threshold = CELL_SIZE / 2 - 2;
      if (relX > threshold && cell.walls.right) wallHit = true;
      if (relX < -threshold && cell.walls.left) wallHit = true;
      if (relY > threshold && cell.walls.bottom) wallHit = true;
      if (relY < -threshold && cell.walls.top) wallHit = true;
      if (wallHit && !pulse.hitWalls.has(key)) {
        pulse.hitWalls.add(key);
        this.maze.addReflection(px, py, pulse.angle, cell.wallMaterial);
      }
      if (cell.content && cell.content.type === 'chest' && !cell.content.collected) {
        if (!pulse.hitChests.has(key)) {
          pulse.hitChests.add(key);
          this.maze.addChestReveal(gx, gy);
        }
      }
    }
  }

  getActivePulses(): Pulse[] {
    return this.pulses.filter(p => p.alive);
  }
}
