import { v4 as uuidv4 } from 'uuid';

export interface Meteor {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  health: number;
  maxHealth: number;
  opacity: number;
  scale: number;
  exploding: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetId: string;
  speed: number;
  damage: number;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  age: number;
  duration: number;
  particles: { x: number; y: number; vx: number; vy: number; size: number }[];
}

export interface Turret {
  x: number;
  y: number;
  damage: number;
  range: number;
  fireCooldown: number;
  fireRate: number;
}

export interface ShipInterface {
  id: string;
  x: number;
  y: number;
}

export interface MeteorEventConfig {
  width: number;
  height: number;
  minInterval: number;
  maxInterval: number;
  meteorCount: number;
}

export class MeteorEvent {
  private config: MeteorEventConfig;
  private meteors: Meteor[] = [];
  private projectiles: Projectile[] = [];
  private explosions: Explosion[] = [];
  private turrets: Turret[] = [];
  private nextEventTimer: number = 0;
  private isActive: boolean = false;
  private onShipHit: ((shipId: string, damage: number) => void) | null = null;
  private onMeteorDestroyed: (() => void) | null = null;

  constructor(width: number = 800, height: number = 800) {
    this.config = {
      width,
      height,
      minInterval: 30,
      maxInterval: 60,
      meteorCount: 3
    };
    this.scheduleNextEvent();
  }

  private scheduleNextEvent(): void {
    const { minInterval, maxInterval } = this.config;
    this.nextEventTimer = minInterval + Math.random() * (maxInterval - minInterval);
  }

  setTurrets(turretData: { x: number; y: number; damage: number; range: number }[]): void {
    this.turrets = turretData.map(t => ({
      ...t,
      fireCooldown: 0,
      fireRate: 1
    }));
  }

  setOnShipHit(callback: (shipId: string, damage: number) => void): void {
    this.onShipHit = callback;
  }

  setOnMeteorDestroyed(callback: () => void): void {
    this.onMeteorDestroyed = callback;
  }

  getMeteors(): Meteor[] {
    return this.meteors;
  }

  getProjectiles(): Projectile[] {
    return this.projectiles;
  }

  getExplosions(): Explosion[] {
    return this.explosions;
  }

  spawnMeteorEvent(): void {
    const { width, meteorCount } = this.config;
    for (let i = 0; i < meteorCount; i++) {
      const size = 10 + Math.random() * 5;
      this.meteors.push({
        id: uuidv4(),
        x: Math.random() * width,
        y: -size - Math.random() * 100,
        size,
        speed: 40,
        health: 20,
        maxHealth: 20,
        opacity: 1,
        scale: 1,
        exploding: false
      });
    }
    this.isActive = true;
  }

  update(timeDelta: number, ships: ShipInterface[]): void {
    this.nextEventTimer -= timeDelta;
    if (this.nextEventTimer <= 0) {
      this.spawnMeteorEvent();
      this.scheduleNextEvent();
    }

    this.updateMeteors(timeDelta, ships);
    this.updateTurrets(timeDelta);
    this.updateProjectiles(timeDelta);
    this.updateExplosions(timeDelta);
  }

  private updateMeteors(timeDelta: number, ships: ShipInterface[]): void {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const meteor = this.meteors[i];
      
      if (meteor.exploding) {
        meteor.scale -= timeDelta * 3;
        meteor.opacity -= timeDelta * 3;
        if (meteor.scale <= 0 || meteor.opacity <= 0) {
          this.meteors.splice(i, 1);
        }
        continue;
      }

      meteor.y += meteor.speed * timeDelta;

      if (meteor.y > this.config.height + meteor.size) {
        this.meteors.splice(i, 1);
        continue;
      }

      for (const ship of ships) {
        const dx = meteor.x - ship.x;
        const dy = meteor.y - ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < meteor.size + 12) {
          if (this.onShipHit) {
            this.onShipHit(ship.id, 20);
          }
          this.createExplosion(meteor.x, meteor.y, meteor.size);
          meteor.exploding = true;
          break;
        }
      }
    }

    if (this.meteors.length === 0 && this.isActive) {
      this.isActive = false;
    }
  }

  private updateTurrets(timeDelta: number): void {
    for (const turret of this.turrets) {
      turret.fireCooldown -= timeDelta;
      
      if (turret.fireCooldown > 0) continue;

      let nearestMeteor: Meteor | null = null;
      let nearestDistance = turret.range;

      for (const meteor of this.meteors) {
        if (meteor.exploding) continue;
        const dx = meteor.x - turret.x;
        const dy = meteor.y - turret.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestMeteor = meteor;
        }
      }

      if (nearestMeteor) {
        this.projectiles.push({
          id: uuidv4(),
          x: turret.x,
          y: turret.y,
          targetId: nearestMeteor.id,
          speed: 100,
          damage: turret.damage
        });
        turret.fireCooldown = turret.fireRate;
      }
    }
  }

  private updateProjectiles(timeDelta: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      const target = this.meteors.find(m => m.id === projectile.targetId);
      
      if (!target || target.exploding) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < target.size) {
        target.health -= projectile.damage;
        this.projectiles.splice(i, 1);
        
        if (target.health <= 0 && !target.exploding) {
          target.exploding = true;
          this.createExplosion(target.x, target.y, target.size);
          if (this.onMeteorDestroyed) {
            this.onMeteorDestroyed();
          }
        }
        continue;
      }

      const moveDistance = projectile.speed * timeDelta;
      const ratio = moveDistance / distance;
      projectile.x += dx * ratio;
      projectile.y += dy * ratio;

      if (projectile.x < 0 || projectile.x > this.config.width ||
          projectile.y < 0 || projectile.y > this.config.height) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private createExplosion(x: number, y: number, size: number): void {
    const particles = [];
    const particleCount = Math.floor(size * 2);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 20 + Math.random() * 30;
      particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3
      });
    }
    this.explosions.push({
      id: uuidv4(),
      x,
      y,
      age: 0,
      duration: 0.3,
      particles
    });
  }

  private updateExplosions(timeDelta: number): void {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      explosion.age += timeDelta;
      
      for (const particle of explosion.particles) {
        particle.x += particle.vx * timeDelta;
        particle.y += particle.vy * timeDelta;
      }

      if (explosion.age >= explosion.duration) {
        this.explosions.splice(i, 1);
      }
    }
  }

  getNextEventTime(): number {
    return this.nextEventTimer;
  }
}
