import {
  Creature,
  CreatureType,
  Resources,
  Particle,
  TankConfig,
  EcoState,
  CREATURE_BASE_CONFIG,
  FOOD_CHAIN,
  CREATURE_COLORS,
} from './types';
import { io, Socket } from 'socket.io-client';

export class Ecosystem {
  private config: TankConfig;
  private creatures: Creature[] = [];
  private resources: Resources;
  private particles: Particle[] = [];
  private particlePool: Particle[] = [];
  private frameCount: number = 0;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private subscribers: Set<(state: EcoState) => void> = new Set();
  private socket: Socket | null = null;
  private lastBroadcastTime: number = 0;
  private tankId: string;
  private gridSize: number = 50;

  constructor(config: TankConfig) {
    this.config = config;
    this.resources = {
      sunlight: 70,
      water: 80,
      nutrients: 60,
    };
    this.tankId = `tank-${Math.random().toString(36).substr(2, 9)}`;
    this.initParticlePool(200);
    this.initWebSocket();
  }

  private initParticlePool(size: number): void {
    for (let i = 0; i < size; i++) {
      this.particlePool.push({
        x: 0, y: 0, vx: 0, vy: 0,
        color: '#fff', life: 0, maxLife: 1,
        size: 2, active: false,
      });
    }
  }

  private initWebSocket(): void {
    try {
      this.socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
      });
      this.socket.on('connect', () => {
        this.socket?.emit('subscribe', { tankId: this.tankId });
      });
    } catch (e) {
      console.warn('WebSocket connection failed:', e);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 11);
  }

  private getResourceFactor(): number {
    return (this.resources.sunlight + this.resources.water + this.resources.nutrients) / 300;
  }

  private spawnParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const particle = this.particlePool.find(p => !p.active) || this.particlePool[0];
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.color = color;
      particle.life = 24;
      particle.maxLife = 24;
      particle.size = 2 + Math.random() * 3;
      particle.active = true;
    }
  }

  private updateParticles(): void {
    for (const particle of this.particles) {
      if (!particle.active) continue;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      particle.life--;
      if (particle.life <= 0) {
        particle.active = false;
      }
    }
    this.particles = this.particlePool.filter(p => p.active);
  }

  private updateCreatures(): void {
    const toRemove: Set<string> = new Set();
    const toAdd: Creature[] = [];
    const resourceFactor = this.getResourceFactor();

    for (const creature of this.creatures) {
      if (toRemove.has(creature.id)) continue;

      creature.prevX = creature.x;
      creature.prevY = creature.y;

      if (creature.spawnTimer > 0) {
        creature.spawnTimer--;
        creature.spawnScale = 1 - (creature.spawnTimer / 18);
      } else {
        creature.spawnScale = 1;
      }

      const angle = Math.random() * Math.PI * 2;
      creature.vx += Math.cos(angle) * 0.1 * creature.speed;
      creature.vy += Math.sin(angle) * 0.1 * creature.speed;
      creature.vx *= 0.9;
      creature.vy *= 0.9;

      const maxV = creature.speed;
      const vMag = Math.sqrt(creature.vx * creature.vx + creature.vy * creature.vy);
      if (vMag > maxV) {
        creature.vx = (creature.vx / vMag) * maxV;
        creature.vy = (creature.vy / vMag) * maxV;
      }

      creature.x += creature.vx;
      creature.y += creature.vy;

      if (creature.x < 10) { creature.x = 10; creature.vx *= -0.8; }
      if (creature.x > this.config.width - 10) { creature.x = this.config.width - 10; creature.vx *= -0.8; }
      if (creature.y < 10) { creature.y = 10; creature.vy *= -0.8; }
      if (creature.y > this.config.height - 10) { creature.y = this.config.height - 10; creature.vy *= -0.8; }

      creature.age++;
      creature.health -= 0.1;

      if (creature.age > creature.lifespan || creature.health <= 0) {
        toRemove.add(creature.id);
        this.spawnParticles(creature.x, creature.y, CREATURE_COLORS[creature.type], 8);
        continue;
      }

      const preyType = FOOD_CHAIN[creature.type];
      if (preyType && creature.predationRange > 0) {
        const gridX = Math.floor(creature.x / this.gridSize);
        const gridY = Math.floor(creature.y / this.gridSize);
        
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const checkGridX = gridX + dx;
            const checkGridY = gridY + dy;
            
            for (const prey of this.creatures) {
              if (prey.type !== preyType || toRemove.has(prey.id) || toRemove.has(creature.id)) continue;
              
              const preyGridX = Math.floor(prey.x / this.gridSize);
              const preyGridY = Math.floor(prey.y / this.gridSize);
              
              if (preyGridX !== checkGridX || preyGridY !== checkGridY) continue;
              
              const dist = Math.sqrt(
                Math.pow(creature.x - prey.x, 2) + Math.pow(creature.y - prey.y, 2)
              );
              
              if (dist < creature.predationRange) {
                creature.health = Math.min(creature.maxHealth, creature.health + 25);
                toRemove.add(prey.id);
                this.spawnParticles(prey.x, prey.y, CREATURE_COLORS[prey.type], 12 + Math.floor(Math.random() * 4));
                break;
              }
            }
          }
        }
      }

      if (
        creature.health > creature.maxHealth * 0.8 &&
        Math.random() < creature.reproductionRate * resourceFactor
      ) {
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;
        const newX = Math.max(10, Math.min(this.config.width - 10, creature.x + offsetX));
        const newY = Math.max(10, Math.min(this.config.height - 10, creature.y + offsetY));
        
        const newCreature = this.createCreature(creature.type, newX, newY);
        newCreature.health = creature.maxHealth * 0.5;
        creature.health = creature.maxHealth * 0.5;
        toAdd.push(newCreature);
      }
    }

    this.creatures = this.creatures.filter(c => !toRemove.has(c.id));
    this.creatures.push(...toAdd);
  }

  private createCreature(type: CreatureType, x: number, y: number): Creature {
    const baseConfig = CREATURE_BASE_CONFIG[type];
    return {
      ...baseConfig,
      id: this.generateId(),
      x,
      y,
      prevX: x,
      prevY: y,
      vx: (Math.random() - 0.5) * baseConfig.speed,
      vy: (Math.random() - 0.5) * baseConfig.speed,
      age: 0,
      spawnScale: 0,
      spawnTimer: 18,
    };
  }

  private updateResources(): void {
    this.resources.sunlight = 50 + Math.sin(this.frameCount * 0.05) * 30;
    this.resources.water = Math.max(10, 90 - this.creatures.length * 0.1);
    this.resources.nutrients = Math.min(100, 40 + this.creatures.filter(c => c.type === CreatureType.DECOMPOSER).length * 2);
  }

  private calculateStats(): {
    population: Record<CreatureType, number>;
    avgLifespan: Record<CreatureType, number>;
  } {
    const population: Record<CreatureType, number> = {
      [CreatureType.PRODUCER]: 0,
      [CreatureType.PRIMARY_CONSUMER]: 0,
      [CreatureType.SECONDARY_CONSUMER]: 0,
      [CreatureType.DECOMPOSER]: 0,
    };
    const totalAge: Record<CreatureType, number> = {
      [CreatureType.PRODUCER]: 0,
      [CreatureType.PRIMARY_CONSUMER]: 0,
      [CreatureType.SECONDARY_CONSUMER]: 0,
      [CreatureType.DECOMPOSER]: 0,
    };
    const count: Record<CreatureType, number> = {
      [CreatureType.PRODUCER]: 0,
      [CreatureType.PRIMARY_CONSUMER]: 0,
      [CreatureType.SECONDARY_CONSUMER]: 0,
      [CreatureType.DECOMPOSER]: 0,
    };

    for (const creature of this.creatures) {
      population[creature.type]++;
      totalAge[creature.type] += creature.age;
      count[creature.type]++;
    }

    const avgLifespan: Record<CreatureType, number> = {
      [CreatureType.PRODUCER]: count[CreatureType.PRODUCER] > 0 ? totalAge[CreatureType.PRODUCER] / count[CreatureType.PRODUCER] : 0,
      [CreatureType.PRIMARY_CONSUMER]: count[CreatureType.PRIMARY_CONSUMER] > 0 ? totalAge[CreatureType.PRIMARY_CONSUMER] / count[CreatureType.PRIMARY_CONSUMER] : 0,
      [CreatureType.SECONDARY_CONSUMER]: count[CreatureType.SECONDARY_CONSUMER] > 0 ? totalAge[CreatureType.SECONDARY_CONSUMER] / count[CreatureType.SECONDARY_CONSUMER] : 0,
      [CreatureType.DECOMPOSER]: count[CreatureType.DECOMPOSER] > 0 ? totalAge[CreatureType.DECOMPOSER] / count[CreatureType.DECOMPOSER] : 0,
    };

    return { population, avgLifespan };
  }

  private broadcastState(state: EcoState): void {
    const now = Date.now();
    if (this.socket && this.socket.connected && now - this.lastBroadcastTime > 500) {
      this.socket.emit('state-update', { tankId: this.tankId, state });
      this.lastBroadcastTime = now;
    }
  }

  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;

    const effectiveInterval = this.config.frameInterval / this.config.speedMultiplier;
    
    if (timestamp - this.lastFrameTime >= effectiveInterval) {
      this.lastFrameTime = timestamp;
      this.frameCount++;

      this.updateCreatures();
      this.updateParticles();

      if (this.frameCount % this.config.resourceUpdateInterval === 0) {
        this.updateResources();
      }

      const state = this.getState();
      this.notifySubscribers(state);
      this.broadcastState(state);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private notifySubscribers(state: EcoState): void {
    this.subscribers.forEach(callback => callback(state));
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
    this.notifySubscribers(this.getState());
  }

  pause(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.notifySubscribers(this.getState());
  }

  reset(): void {
    this.pause();
    this.creatures = [];
    this.particles = [];
    this.particlePool.forEach(p => p.active = false);
    this.frameCount = 0;
    this.resources = { sunlight: 70, water: 80, nutrients: 60 };
    this.notifySubscribers(this.getState());
  }

  step(frames: number = 1): void {
    const wasRunning = this.isRunning;
    if (wasRunning) this.pause();
    
    for (let i = 0; i < frames; i++) {
      this.frameCount++;
      this.updateCreatures();
      this.updateParticles();
      if (this.frameCount % this.config.resourceUpdateInterval === 0) {
        this.updateResources();
      }
    }
    
    this.notifySubscribers(this.getState());
  }

  addCreature(type: CreatureType, x: number, y: number): Creature {
    const creature = this.createCreature(type, x, y);
    this.creatures.push(creature);
    this.notifySubscribers(this.getState());
    return creature;
  }

  setSpeed(multiplier: number): void {
    this.config.speedMultiplier = Math.max(0.5, Math.min(4, multiplier));
  }

  subscribe(callback: (state: EcoState) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  getState(): EcoState {
    const { population, avgLifespan } = this.calculateStats();
    return {
      creatures: [...this.creatures],
      resources: { ...this.resources },
      frameCount: this.frameCount,
      isRunning: this.isRunning,
      population,
      avgLifespan,
      particles: [...this.particles],
    };
  }

  getTankId(): string {
    return this.tankId;
  }

  destroy(): void {
    this.pause();
    this.subscribers.clear();
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
