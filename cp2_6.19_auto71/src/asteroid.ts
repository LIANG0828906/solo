export interface Asteroid {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  vertices: number[];
}

export interface Ore {
  id: number;
  x: number;
  y: number;
  type: 'gold' | 'blue' | 'green';
  color: string;
  pulsePhase: number;
  value: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

export interface Laser {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number; alpha: number }[];
  life: number;
}

const ORE_COLORS: Record<string, string> = {
  gold: '#ffd700',
  blue: '#00bfff',
  green: '#32cd32',
};

const ORE_VALUES: Record<string, number> = {
  gold: 30,
  blue: 10,
  green: 10,
};

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function getAsteroidColor(): string {
  const gray = Math.floor(randomRange(80, 140));
  const brown = Math.floor(randomRange(40, 90));
  return `rgb(${gray + brown * 0.3}, ${gray + brown * 0.2}, ${gray - brown * 0.1})`;
}

function generateVertices(size: number): number[] {
  const vertices: number[] = [];
  const sides = Math.floor(randomRange(6, 10));
  for (let i = 0; i < sides; i++) {
    vertices.push(randomRange(size * 0.7, size * 1.2));
  }
  return vertices;
}

export class AsteroidManager {
  private asteroids: Asteroid[] = [];
  private ores: Ore[] = [];
  private particles: Particle[] = [];
  private lasers: Laser[] = [];
  private nextId: number = 0;
  private lastFireTime: number = 0;
  private readonly fireRate: number = 300;
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  public generateAsteroids(count: number): void {
    this.asteroids = [];
    for (let i = 0; i < count; i++) {
      this.asteroids.push(this.createAsteroid());
    }
  }

  private createAsteroid(): Asteroid {
    const margin = 50;
    return {
      id: this.nextId++,
      x: randomRange(margin, this.canvasWidth - margin),
      y: randomRange(margin, this.canvasHeight - margin),
      size: randomRange(5, 15),
      rotation: randomRange(0, Math.PI * 2),
      rotationSpeed: randomRange(-0.01, 0.01),
      color: getAsteroidColor(),
      vertices: generateVertices(randomRange(5, 15)),
    };
  }

  public updateLasers(): void {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.trail.unshift({ x: laser.x, y: laser.y, alpha: 1 });
      if (laser.trail.length > 8) {
        laser.trail.pop();
      }
      laser.trail.forEach((t, idx) => {
        t.alpha = 1 - idx / laser.trail.length;
      });

      laser.x += laser.vx;
      laser.y += laser.vy;
      laser.life--;

      if (
        laser.life <= 0 ||
        laser.x < 0 ||
        laser.x > this.canvasWidth ||
        laser.y < 0 ||
        laser.y > this.canvasHeight
      ) {
        this.lasers.splice(i, 1);
      }
    }
  }

  public fireLaser(x: number, y: number, rotation: number, currentTime: number): boolean {
    if (currentTime - this.lastFireTime < this.fireRate) {
      return false;
    }
    this.lastFireTime = currentTime;

    const speed = 8;
    this.lasers.push({
      x: x + Math.cos(rotation) * 16,
      y: y + Math.sin(rotation) * 16,
      vx: Math.cos(rotation) * speed,
      vy: Math.sin(rotation) * speed,
      trail: [],
      life: 120,
    });
    return true;
  }

  public updateAsteroids(): void {
    for (const asteroid of this.asteroids) {
      asteroid.rotation += asteroid.rotationSpeed;
    }
  }

  public updateOres(): void {
    for (const ore of this.ores) {
      ore.pulsePhase += 0.05;
    }
  }

  public updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      p.alpha = p.life / p.maxLife;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public checkLaserAsteroidCollisions(): { destroyed: Asteroid[]; oreCreated: Ore[] } {
    const destroyed: Asteroid[] = [];
    const oreCreated: Ore[] = [];

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j];
        const dx = laser.x - asteroid.x;
        const dy = laser.y - asteroid.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < asteroid.size + 2) {
          this.lasers.splice(i, 1);
          this.asteroids.splice(j, 1);
          destroyed.push(asteroid);

          this.createParticles(asteroid.x, asteroid.y, asteroid.color);

          const ore = this.createOre(asteroid.x, asteroid.y);
          this.ores.push(ore);
          oreCreated.push(ore);

          break;
        }
      }
    }

    return { destroyed, oreCreated };
  }

  private createParticles(x: number, y: number, color: string): void {
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 + randomRange(-0.3, 0.3);
      const speed = randomRange(1, 3);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        size: randomRange(2, 5),
        life: 300,
        maxLife: 300,
      });
    }
  }

  private createOre(x: number, y: number): Ore {
    const rand = Math.random();
    let type: 'gold' | 'blue' | 'green';
    if (rand < 0.15) {
      type = 'gold';
    } else if (rand < 0.55) {
      type = 'blue';
    } else {
      type = 'green';
    }

    return {
      id: this.nextId++,
      x,
      y,
      type,
      color: ORE_COLORS[type],
      pulsePhase: randomRange(0, Math.PI * 2),
      value: ORE_VALUES[type],
    };
  }

  public checkShipOreCollision(shipX: number, shipY: number): Ore[] {
    const picked: Ore[] = [];
    const pickupRadius = 20;

    for (let i = this.ores.length - 1; i >= 0; i--) {
      const ore = this.ores[i];
      const dx = ore.x - shipX;
      const dy = ore.y - shipY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < pickupRadius) {
        picked.push(ore);
        this.ores.splice(i, 1);
      }
    }

    return picked;
  }

  public isNearAsteroid(shipX: number, shipY: number): boolean {
    const nearRadius = 50;
    for (const asteroid of this.asteroids) {
      const dx = asteroid.x - shipX;
      const dy = asteroid.y - shipY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearRadius + asteroid.size) {
        return true;
      }
    }
    return false;
  }

  public getAsteroids(): Asteroid[] {
    return this.asteroids;
  }

  public getOres(): Ore[] {
    return this.ores;
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public getLasers(): Laser[] {
    return this.lasers;
  }

  public clear(): void {
    this.asteroids = [];
    this.ores = [];
    this.particles = [];
    this.lasers = [];
  }
}
