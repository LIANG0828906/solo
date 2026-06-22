export type ResourceType = 'iron' | 'copper' | 'titanium';

export interface Asteroid {
  id: number;
  x: number;
  y: number;
  radius: number;
  resourceType: ResourceType;
  collected: boolean;
}

export interface ParticleEffect {
  x: number;
  y: number;
  color: string;
  startTime: number;
  duration: number;
}

export interface ResourceInventory {
  iron: number;
  copper: number;
  titanium: number;
  totalCollections: number;
}

export const RESOURCE_COLORS: Record<ResourceType, string> = {
  iron: '#A0522D',
  copper: '#B87333',
  titanium: '#C0C0C0',
};

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  iron: '铁',
  copper: '铜',
  titanium: '钛',
};

const MAX_ACTIVE_PARTICLES = 5;

export class ResourceManager {
  private asteroids: Asteroid[] = [];
  private inventory: ResourceInventory = {
    iron: 0,
    copper: 0,
    titanium: 0,
    totalCollections: 0,
  };
  private activeParticles: ParticleEffect[] = [];

  generateAsteroids(width: number, height: number, count: number) {
    this.asteroids = [];
    const types: ResourceType[] = ['iron', 'copper', 'titanium'];
    for (let i = 0; i < count; i++) {
      this.asteroids.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 2 + Math.random() * 2,
        resourceType: types[Math.floor(Math.random() * types.length)],
        collected: false,
      });
    }
  }

  getAsteroids(): Asteroid[] {
    return this.asteroids;
  }

  getInventory(): ResourceInventory {
    return { ...this.inventory };
  }

  getActiveParticles(): ParticleEffect[] {
    return this.activeParticles;
  }

  checkCollection(
    shipX: number,
    shipY: number,
    now: number
  ): { collected: boolean; type?: ResourceType; x?: number; y?: number } {
    for (const asteroid of this.asteroids) {
      if (asteroid.collected) continue;
      const dx = shipX - asteroid.x;
      const dy = shipY - asteroid.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 10) {
        asteroid.collected = true;
        this.inventory[asteroid.resourceType]++;
        this.inventory.totalCollections++;

        if (this.activeParticles.length < MAX_ACTIVE_PARTICLES) {
          this.activeParticles.push({
            x: asteroid.x,
            y: asteroid.y,
            color: RESOURCE_COLORS[asteroid.resourceType],
            startTime: now,
            duration: 300,
          });
        }

        return {
          collected: true,
          type: asteroid.resourceType,
          x: asteroid.x,
          y: asteroid.y,
        };
      }
    }
    return { collected: false };
  }

  updateParticles(now: number) {
    this.activeParticles = this.activeParticles.filter(
      (p) => now - p.startTime < p.duration
    );
  }

  reset() {
    this.asteroids = [];
    this.inventory = { iron: 0, copper: 0, titanium: 0, totalCollections: 0 };
    this.activeParticles = [];
  }
}
