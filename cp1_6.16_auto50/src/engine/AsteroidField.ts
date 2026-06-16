import { v4 as uuidv4 } from 'uuid';
import type { Vector2, Asteroid, EnergyOrb } from '../types';

const ASTEROID_COUNT = 50;
const ENERGY_ORB_COUNT = 10;
const MIN_ASTEROID_RADIUS = 5;
const MAX_ASTEROID_RADIUS = 20;
const ENERGY_ORB_RADIUS = 12;

export class AsteroidField {
  private canvasWidth: number;
  private canvasHeight: number;
  private asteroids: Asteroid[] = [];
  private energyOrbs: EnergyOrb[] = [];
  private safeZonePosition: Vector2 = { x: 0, y: 0 };
  private safeZoneRadius: number = 100;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.safeZonePosition = { x: width * 0.3, y: height * 0.6 };
    this.generateAsteroids();
    this.generateEnergyOrbs();
  }

  setSafeZone(position: Vector2, radius: number): void {
    this.safeZonePosition = { ...position };
    this.safeZoneRadius = radius;
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  getAsteroids(): Asteroid[] {
    return this.asteroids;
  }

  getEnergyOrbs(): EnergyOrb[] {
    return this.energyOrbs;
  }

  private generateAsteroids(): void {
    this.asteroids = [];
    for (let i = 0; i < ASTEROID_COUNT; i++) {
      this.asteroids.push(this.createAsteroid());
    }
  }

  private createAsteroid(): Asteroid {
    const radius = MIN_ASTEROID_RADIUS + Math.random() * (MAX_ASTEROID_RADIUS - MIN_ASTEROID_RADIUS);
    const position = this.getRandomPosition(radius * 2);
    const speed = 0.2 + Math.random() * 0.5;
    const angle = Math.random() * Math.PI * 2;

    const colorVariant = Math.random();
    let color: string;
    if (colorVariant < 0.4) {
      const g = Math.floor(60 + Math.random() * 40);
      color = `rgb(${Math.floor(g * 0.9)}, ${g}, ${Math.floor(g * 0.7)})`;
    } else if (colorVariant < 0.7) {
      const r = Math.floor(80 + Math.random() * 50);
      const g = Math.floor(50 + Math.random() * 30);
      const b = Math.floor(40 + Math.random() * 20);
      color = `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = Math.floor(100 + Math.random() * 50);
      const g = Math.floor(40 + Math.random() * 30);
      const b = Math.floor(30 + Math.random() * 20);
      color = `rgb(${r}, ${g}, ${b})`;
    }

    const vertices = this.generateAsteroidVertices(radius);

    return {
      id: uuidv4(),
      position,
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      radius,
      color,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      vertices,
    };
  }

  private generateAsteroidVertices(radius: number): Vector2[] {
    const vertices: Vector2[] = [];
    const vertexCount = 10 + Math.floor(Math.random() * 6);

    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const noise = 0.7 + Math.random() * 0.6;
      const r = radius * noise;
      vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }

    return vertices;
  }

  private generateEnergyOrbs(): void {
    this.energyOrbs = [];
    for (let i = 0; i < ENERGY_ORB_COUNT; i++) {
      this.energyOrbs.push(this.createEnergyOrb());
    }
  }

  private createEnergyOrb(): EnergyOrb {
    const position = this.getRandomPosition(ENERGY_ORB_RADIUS * 3);

    return {
      id: uuidv4(),
      position,
      radius: ENERGY_ORB_RADIUS,
      pulsePhase: Math.random() * Math.PI * 2,
      collected: false,
    };
  }

  private getRandomPosition(margin: number): Vector2 {
    let x: number, y: number;
    let attempts = 0;

    do {
      x = margin + Math.random() * (this.canvasWidth - margin * 2);
      y = margin + Math.random() * (this.canvasHeight - margin * 2);
      attempts++;
    } while ((this.isTooCloseToCenter(x, y) || this.isInSafeZone(x, y)) && attempts < 50);

    return { x, y };
  }

  private isTooCloseToCenter(x: number, y: number): boolean {
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 100;
  }

  private isInSafeZone(x: number, y: number): boolean {
    const dx = x - this.safeZonePosition.x;
    const dy = y - this.safeZonePosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.safeZoneRadius;
  }

  update(deltaTime: number): void {
    const dt = deltaTime / 1000;

    for (const asteroid of this.asteroids) {
      asteroid.position.x += asteroid.velocity.x;
      asteroid.position.y += asteroid.velocity.y;
      asteroid.rotation += asteroid.rotationSpeed;
      this.wrapPosition(asteroid.position, asteroid.radius);
    }

    for (const orb of this.energyOrbs) {
      if (!orb.collected) {
        orb.pulsePhase += dt * Math.PI * 2;
      }
    }
  }

  private wrapPosition(position: Vector2, radius: number): void {
    const margin = radius;
    if (position.x < -margin) position.x = this.canvasWidth + margin;
    if (position.x > this.canvasWidth + margin) position.x = -margin;
    if (position.y < -margin) position.y = this.canvasHeight + margin;
    if (position.y > this.canvasHeight + margin) position.y = -margin;
  }

  collectOrb(orbId: string): void {
    const orb = this.energyOrbs.find(o => o.id === orbId);
    if (orb) {
      orb.collected = true;
    }
  }

  respawnOrb(orbId: string): void {
    const orbIndex = this.energyOrbs.findIndex(o => o.id === orbId);
    if (orbIndex !== -1) {
      this.energyOrbs[orbIndex] = this.createEnergyOrb();
    }
  }

  getActiveOrbsCount(): number {
    return this.energyOrbs.filter(o => !o.collected).length;
  }
}
