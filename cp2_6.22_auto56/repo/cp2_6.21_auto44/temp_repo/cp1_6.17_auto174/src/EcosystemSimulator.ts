import { eventBus } from './EventBus';
import { creatureEngine } from './CreatureEngine';
import type { Creature, Environment } from './types';

const MAX_CREATURES = 100;
const CONTAINER_WIDTH = 300;
const CONTAINER_HEIGHT = 400;
const TICK_INTERVAL_MS = 1000 / 60;

export interface FoodParticle {
  id: string;
  x: number;
  y: number;
  type: string;
}

class EcosystemSimulator {
  private environment: Environment = {
    temperature: 50,
    humidity: 50,
    food: 50,
    tick: 0,
  };
  private creatures: Map<string, Creature> = new Map();
  private foodParticles: FoodParticle[] = [];
  private animationId: number | null = null;
  private lastTick = 0;
  private foodSpawnTimer = 0;

  constructor() {
    eventBus.on('creature_spawned', ({ creature }) => {
      if (this.creatures.size < MAX_CREATURES) {
        this.creatures.set(creature.id, { ...creature });
      }
    });

    eventBus.on('creature_evolved', ({ creature }) => {
      const existing = this.creatures.get(creature.id);
      if (existing) {
        this.creatures.set(creature.id, { ...creature });
      }
    });
  }

  getEnvironment(): Environment {
    return { ...this.environment };
  }

  getCreatures(): Creature[] {
    return Array.from(this.creatures.values());
  }

  getFoodParticles(): FoodParticle[] {
    return [...this.foodParticles];
  }

  start(): void {
    if (this.animationId !== null) return;
    this.lastTick = performance.now();
    this.loop();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private loop = (): void => {
    const now = performance.now();
    const delta = now - this.lastTick;

    if (delta >= TICK_INTERVAL_MS) {
      this.lastTick = now;
      this.tick();
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  private tick(): void {
    this.environment.tick++;

    this.environment.temperature = 50 + Math.sin(this.environment.tick * 0.005) * 25 + (Math.random() - 0.5) * 2;
    this.environment.humidity = 50 + Math.cos(this.environment.tick * 0.007) * 30 + (Math.random() - 0.5) * 2;
    this.environment.temperature = Math.max(0, Math.min(100, this.environment.temperature));
    this.environment.humidity = Math.max(0, Math.min(100, this.environment.humidity));

    this.foodSpawnTimer++;
    if (this.foodSpawnTimer > 90 && this.foodParticles.length < 15) {
      this.foodSpawnTimer = 0;
      this.spawnFood();
    }
    this.environment.food = (this.foodParticles.length / 15) * 100;

    eventBus.emit('environment_update', { ...this.environment });

    const toRemove: string[] = [];
    for (const creature of this.creatures.values()) {
      this.updateCreature(creature, toRemove);
    }

    for (const id of toRemove) {
      this.creatures.delete(id);
      creatureEngine.removeCreature(id);
    }
  }

  private spawnFood(): void {
    const types = ['fire', 'water', 'earth', 'air', 'plant', 'energy'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.foodParticles.push({
      id: `food_${Date.now()}_${Math.random()}`,
      x: 20 + Math.random() * (CONTAINER_WIDTH - 40),
      y: 20 + Math.random() * (CONTAINER_HEIGHT - 40),
      type,
    });
  }

  private updateCreature(creature: Creature, toRemove: string[]): void {
    if (creature.status !== 'alive') return;

    creature.age++;
    creature.hunger += 0.08;

    if (creature.hunger > 100) {
      creature.hp -= 0.4;
    }

    if (this.environment.temperature > 80 || this.environment.temperature < 20) {
      creature.hp -= 0.15;
    }
    if (this.environment.humidity > 85 || this.environment.humidity < 15) {
      creature.hp -= 0.1;
    }

    if (creature.hp <= 0) {
      creature.status = 'dead';
      creature.hp = 0;
      toRemove.push(creature.id);
      eventBus.emit('creature_status', {
        creatureId: creature.id,
        status: 'dead',
        hp: 0,
      });
      return;
    }

    let nearestFood: FoodParticle | null = null;
    let nearestDist = Infinity;
    for (const food of this.foodParticles) {
      if (food.type === creature.foodPreference) {
        const dx = food.x - creature.x;
        const dy = food.y - creature.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestFood = food;
        }
      }
    }

    if (nearestFood && nearestDist < 120) {
      const dx = nearestFood.x - creature.x;
      const dy = nearestFood.y - creature.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      creature.vx += (dx / dist) * 0.08;
      creature.vy += (dy / dist) * 0.08;

      if (nearestDist < 12) {
        this.foodParticles = this.foodParticles.filter((f) => f.id !== nearestFood!.id);
        creature.hp = Math.min(creature.maxHp, creature.hp + 12);
        creature.hunger = Math.max(0, creature.hunger - 40);
        creatureEngine.feedCreature(creature.id, nearestFood.type);
      }
    }

    creature.vx += (Math.random() - 0.5) * 0.15;
    creature.vy += (Math.random() - 0.5) * 0.15;

    const speed = Math.sqrt(creature.vx * creature.vx + creature.vy * creature.vy);
    const maxSpeed = 0.9 + creature.level * 0.15;
    if (speed > maxSpeed) {
      creature.vx = (creature.vx / speed) * maxSpeed;
      creature.vy = (creature.vy / speed) * maxSpeed;
    }

    creature.vx *= 0.96;
    creature.vy *= 0.96;

    creature.x += creature.vx;
    creature.y += creature.vy;

    const radius = 6 + creature.level * 3;
    if (creature.x < radius) { creature.x = radius; creature.vx = Math.abs(creature.vx) * 0.6; }
    if (creature.x > CONTAINER_WIDTH - radius) { creature.x = CONTAINER_WIDTH - radius; creature.vx = -Math.abs(creature.vx) * 0.6; }
    if (creature.y < radius) { creature.y = radius; creature.vy = Math.abs(creature.vy) * 0.6; }
    if (creature.y > CONTAINER_HEIGHT - radius) { creature.y = CONTAINER_HEIGHT - radius; creature.vy = -Math.abs(creature.vy) * 0.6; }

    if (creature.hunger < 25 && creature.age > 500 && this.creatures.size < MAX_CREATURES && Math.random() < 0.0015) {
      this.reproduce(creature);
    }

    creatureEngine.updateCreatureStatus(creature.id, {
      x: creature.x,
      y: creature.y,
      hp: creature.hp,
      hunger: creature.hunger,
    });
  }

  private reproduce(parent: Creature): void {
    if (this.creatures.size >= MAX_CREATURES) return;

    const childCreature = creatureEngine.createCreature(
      Object.assign({}, { id: parent.elementId, name: parent.name, symbol: '', colorStart: parent.color, colorEnd: parent.color, category: 'creature' })
    );

    const child = this.creatures.get(childCreature.id);
    if (child) {
      child.x = parent.x + (Math.random() - 0.5) * 30;
      child.y = parent.y + (Math.random() - 0.5) * 30;
      child.level = 1;
      child.maxHp = Math.floor(parent.maxHp * 0.5);
      child.hp = child.maxHp;
    }
  }
}

export const ecosystemSimulator = new EcosystemSimulator();
export default ecosystemSimulator;
