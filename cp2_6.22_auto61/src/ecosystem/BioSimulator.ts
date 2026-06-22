import { Creature, Genotype, TrailPoint } from './Creature';

export { Creature };

export interface Resource {
  id: string;
  x: number;
  y: number;
  type: 'plant' | 'mineral' | 'water';
  value: number;
}

export interface BattleEffect {
  x: number;
  y: number;
  duration: number;
  maxDuration: number;
}

export class SpatialHash {
  public cellSize: number;
  public grid: Map<string, Creature[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear(): void {
    this.grid.clear();
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  insert(creature: Creature): void {
    const key = this.getKey(creature.x, creature.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(creature);
  }

  query(x: number, y: number, radius: number): Creature[] {
    const result: Creature[] = [];
    const minCellX = Math.floor((x - radius) / this.cellSize);
    const maxCellX = Math.floor((x + radius) / this.cellSize);
    const minCellY = Math.floor((y - radius) / this.cellSize);
    const maxCellY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const creature of cell) {
            const dx = creature.x - x;
            const dy = creature.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius) {
              result.push(creature);
            }
          }
        }
      }
    }

    return result;
  }
}

export class BioSimulator {
  public creatures: Creature[];
  public resources: Resource[];
  public worldWidth: number;
  public worldHeight: number;
  public spatialHash: SpatialHash;
  public battleEffects: BattleEffect[];
  public maxCreatures: number = 200;
  public maxResources: number = 300;

  constructor(worldWidth: number, worldHeight: number) {
    this.creatures = [];
    this.resources = [];
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.spatialHash = new SpatialHash(50);
    this.battleEffects = [];
  }

  addCreature(creature: Creature): void {
    if (this.creatures.length < this.maxCreatures) {
      this.creatures.push(creature);
    }
  }

  addResource(resource: Resource): void {
    if (this.resources.length < this.maxResources) {
      this.resources.push(resource);
    }
  }

  update(deltaTime: number): void {
    this.spatialHash.clear();
    for (const creature of this.creatures) {
      if (creature.isAlive) {
        this.spatialHash.insert(creature);
      }
    }

    for (const creature of this.creatures) {
      if (!creature.isAlive) continue;
      this.applyLSystemBehavior(creature);
    }

    for (const creature of this.creatures) {
      if (!creature.isAlive) continue;
      creature.move(deltaTime);
      this.handleBoundary(creature);
    }

    this.checkResourceAbsorption();
    this.checkPredation();
    this.checkBreeding();
    this.cleanupDead();
    this.updateBattleEffects(deltaTime);
  }

  private applyLSystemBehavior(creature: Creature): void {
    const perception = creature.genotype.perception;
    const nearbyCreatures = this.spatialHash.query(creature.x, creature.y, perception).filter(c => c.id !== creature.id && c.isAlive);
    const nearbyResources = this.resources.filter(r => {
      const dx = r.x - creature.x;
      const dy = r.y - creature.y;
      return Math.sqrt(dx * dx + dy * dy) <= perception;
    });

    let dirX = 0;
    let dirY = 0;

    if (nearbyResources.length > 0) {
      let nearestResource: Resource | null = null;
      let nearestDist = Infinity;
      for (const resource of nearbyResources) {
        const dx = resource.x - creature.x;
        const dy = resource.y - creature.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestResource = resource;
        }
      }
      if (nearestResource) {
        const dx = nearestResource.x - creature.x;
        const dy = nearestResource.y - creature.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        dirX += dx / dist;
        dirY += dy / dist;
      }
    }

    for (const other of nearbyCreatures) {
      const dx = other.x - creature.x;
      const dy = other.y - creature.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const normX = dx / dist;
      const normY = dy / dist;

      const myAttack = creature.genotype.attack;
      const otherAttack = other.genotype.attack;

      if (otherAttack < myAttack * 0.8) {
        dirX += normX;
        dirY += normY;
      } else if (otherAttack > myAttack * 1.2) {
        dirX -= normX;
        dirY -= normY;
      }
    }

    const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
    if (magnitude > 0) {
      const speed = creature.genotype.speed;
      creature.vx = (dirX / magnitude) * speed;
      creature.vy = (dirY / magnitude) * speed;
    }
  }

  private handleBoundary(creature: Creature): void {
    if (creature.x < 0) {
      creature.x = 0;
      creature.vx = Math.abs(creature.vx);
    } else if (creature.x > this.worldWidth) {
      creature.x = this.worldWidth;
      creature.vx = -Math.abs(creature.vx);
    }

    if (creature.y < 0) {
      creature.y = 0;
      creature.vy = Math.abs(creature.vy);
    } else if (creature.y > this.worldHeight) {
      creature.y = this.worldHeight;
      creature.vy = -Math.abs(creature.vy);
    }
  }

  private checkResourceAbsorption(): void {
    for (const creature of this.creatures) {
      if (!creature.isAlive) continue;

      for (let i = this.resources.length - 1; i >= 0; i--) {
        const resource = this.resources[i];
        const dx = resource.x - creature.x;
        const dy = resource.y - creature.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
          let energyGain = 0;
          switch (resource.type) {
            case 'plant':
              energyGain = 5;
              break;
            case 'mineral':
              energyGain = 10;
              break;
            case 'water':
              energyGain = 3;
              break;
          }
          creature.energy += energyGain;
          this.resources.splice(i, 1);
        }
      }
    }
  }

  private checkPredation(): void {
    const battlePairs: Set<string> = new Set();

    for (let i = 0; i < this.creatures.length; i++) {
      const a = this.creatures[i];
      if (!a.isAlive) continue;

      const nearby = this.spatialHash.query(a.x, a.y, 5).filter(c => c.id !== a.id && c.isAlive);

      for (const b of nearby) {
        const pairKey = [a.id, b.id].sort().join('-');
        if (battlePairs.has(pairKey)) continue;
        battlePairs.add(pairKey);

        const attackDiff = a.genotype.attack - b.genotype.attack;

        if (attackDiff > 0) {
          const winChance = Math.min(0.9, 0.5 + attackDiff / 200);
          if (Math.random() < winChance) {
            const energyTransfer = Math.max(0, attackDiff / 10);
            a.energy += energyTransfer;
            b.energy *= 0.8;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            b.vx = (dx / dist) * b.genotype.speed * 2;
            b.vy = (dy / dist) * b.genotype.speed * 2;

            this.battleEffects.push({
              x: (a.x + b.x) / 2,
              y: (a.y + b.y) / 2,
              duration: 30,
              maxDuration: 30,
            });
          }
        } else if (attackDiff < 0) {
          const winChance = Math.min(0.9, 0.5 + Math.abs(attackDiff) / 200);
          if (Math.random() < winChance) {
            const energyTransfer = Math.max(0, Math.abs(attackDiff) / 10);
            b.energy += energyTransfer;
            a.energy *= 0.8;

            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            a.vx = (dx / dist) * a.genotype.speed * 2;
            a.vy = (dy / dist) * a.genotype.speed * 2;

            this.battleEffects.push({
              x: (a.x + b.x) / 2,
              y: (a.y + b.y) / 2,
              duration: 30,
              maxDuration: 30,
            });
          }
        }
      }
    }
  }

  private checkBreeding(): void {
    const newCreatures: Creature[] = [];

    for (const creature of this.creatures) {
      if (!creature.isAlive) continue;

      if (creature.energy >= creature.genotype.breedThreshold &&
          this.creatures.length + newCreatures.length < this.maxCreatures) {
        const offspring = creature.breed();
        newCreatures.push(offspring);
      }
    }

    for (const offspring of newCreatures) {
      this.addCreature(offspring);
    }
  }

  private cleanupDead(): void {
    this.creatures = this.creatures.filter(c => c.isAlive);
  }

  private updateBattleEffects(deltaTime: number): void {
    for (let i = this.battleEffects.length - 1; i >= 0; i--) {
      this.battleEffects[i].duration -= deltaTime * 60;
      if (this.battleEffects[i].duration <= 0) {
        this.battleEffects.splice(i, 1);
      }
    }
  }
}
