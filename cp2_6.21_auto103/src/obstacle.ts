export interface Poolable {
  active: boolean;
  x: number;
  y: number;
  type: string;
}

export interface Obstacle extends Poolable {
  width: number;
  height: number;
  type: 'vent' | 'crate' | 'plant';
}

export interface Collectible extends Poolable {
  type: 'energy' | 'boost';
  size: number;
  pulsePhase: number;
  collected: boolean;
}

export class ObstaclePool {
  private obstacles: Obstacle[] = [];
  private collectibles: Collectible[] = [];
  private lastBuildingEndX: number = 0;
  private nextSpawnX: number = 0;
  private buildings: { x: number; width: number; height: number }[] = [];
  private difficulty: number = 0;

  reset(canvasWidth: number, canvasHeight: number): void {
    this.obstacles.forEach(o => o.active = false);
    this.collectibles.forEach(c => c.active = false);
    this.buildings = [];
    this.difficulty = 0;
    this.lastBuildingEndX = 0;
    this.nextSpawnX = canvasWidth + 200;

    let x = 0;
    while (x < canvasWidth + 400) {
      const h = 80 + Math.random() * 120;
      const w = 120;
      const gap = 60 + Math.random() * 90;
      this.buildings.push({ x, width: w, height: h });

      if (Math.random() < 0.4) {
        this.spawnObstacle(x, canvasHeight - h, w);
      }
      if (Math.random() < 0.6) {
        this.spawnCollectible(x, canvasHeight - h, w);
      }

      x += w + gap;
    }
    this.lastBuildingEndX = x;
  }

  update(scrollSpeed: number, canvasWidth: number, canvasHeight: number, playerX: number): void {
    this.difficulty = Math.min(playerX / 5000, 1);

    for (const b of this.buildings) {
      b.x -= scrollSpeed;
    }

    this.buildings = this.buildings.filter(b => b.x + b.width > -50);

    while (this.lastBuildingEndX < playerX + canvasWidth + 600) {
      const h = 80 + Math.random() * 120;
      const w = 120;
      const gap = 60 + Math.random() * 90 * (1 + this.difficulty * 0.5);
      const bx = this.lastBuildingEndX + gap;
      this.buildings.push({ x: bx, width: w, height: h });

      const spawnChance = 0.35 + this.difficulty * 0.35;
      if (Math.random() < spawnChance) {
        this.spawnObstacle(bx, canvasHeight - h, w);
      }
      if (Math.random() < 0.55) {
        this.spawnCollectible(bx, canvasHeight - h, w);
      }

      this.lastBuildingEndX = bx + w;
    }

    for (const obs of this.obstacles) {
      if (obs.active) {
        obs.x -= scrollSpeed;
        if (obs.x + obs.width < -50) obs.active = false;
      }
    }

    for (const col of this.collectibles) {
      if (col.active && !col.collected) {
        col.x -= scrollSpeed;
        col.pulsePhase += 0.08;
        if (col.x + col.size < -50) col.active = false;
      }
    }
  }

  getBuildings(): { x: number; width: number; height: number }[] {
    return this.buildings;
  }

  getActiveObstacles(): Obstacle[] {
    return this.obstacles.filter(o => o.active);
  }

  getActiveCollectibles(): Collectible[] {
    return this.collectibles.filter(c => c.active && !c.collected);
  }

  private spawnObstacle(bx: number, roofY: number, bw: number): void {
    let obs = this.obstacles.find(o => !o.active);
    if (!obs) {
      obs = { active: true, x: 0, y: 0, type: 'vent', width: 0, height: 0 };
      this.obstacles.push(obs);
    }

    const types: Array<'vent' | 'crate' | 'plant'> = ['vent', 'crate', 'plant'];
    const t = types[Math.floor(Math.random() * types.length)];
    obs.active = true;
    obs.x = bx + 20 + Math.random() * (bw - 60);
    obs.type = t;

    switch (t) {
      case 'vent':
        obs.width = 40;
        obs.height = 20;
        obs.y = roofY - 20;
        break;
      case 'crate':
        obs.width = 30;
        obs.height = 30;
        obs.y = roofY - 30;
        break;
      case 'plant':
        obs.width = 20;
        obs.height = 24;
        obs.y = roofY - 24;
        break;
    }
  }

  private spawnCollectible(bx: number, roofY: number, bw: number): void {
    let col = this.collectibles.find(c => !c.active);
    if (!col) {
      col = { active: true, x: 0, y: 0, type: 'energy', size: 0, pulsePhase: 0, collected: false };
      this.collectibles.push(col);
    }

    const t = Math.random() < 0.7 ? 'energy' : 'boost';
    col.active = true;
    col.collected = false;
    col.x = bx + 20 + Math.random() * (bw - 40);
    col.type = t;
    col.pulsePhase = Math.random() * Math.PI * 2;

    if (t === 'energy') {
      col.size = 8;
      col.y = roofY - 50 - Math.random() * 30;
    } else {
      col.size = 12;
      col.y = roofY - 55 - Math.random() * 25;
    }
  }

  getGroundYAt(worldX: number, canvasHeight: number): number | null {
    for (const b of this.buildings) {
      if (worldX >= b.x && worldX <= b.x + b.width) {
        return canvasHeight - b.height;
      }
    }
    return null;
  }
}
