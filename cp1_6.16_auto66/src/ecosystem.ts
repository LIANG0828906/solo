import { v4 as uuidv4 } from 'uuid';
import {
  CreatureType,
  Creature,
  Particle,
  LogEvent,
  EcosystemStats,
  EcosystemSnapshot,
  EcosystemParams,
  DEFAULT_PARAMS,
  CREATURE_CONFIGS,
} from './creatures';

const CORPSE_DECAY_TIME = 5000;
const PRODUCER_ENERGY_GAIN_INTERVAL = 2000;
const PRODUCER_ENERGY_GAIN = 5;
const EAT_DISTANCE = 50;
const DECOMPOSE_DISTANCE = 30;
const MAX_TRAIL_LENGTH = 10;
const MAX_PARTICLES = 200;
const MAX_CREATURES = 500;

export class EcosystemEngine {
  private creatures: Creature[] = [];
  private corpses: Creature[] = [];
  private particles: Particle[] = [];
  private events: LogEvent[] = [];
  private params: EcosystemParams = { ...DEFAULT_PARAMS };
  private lastUpdateTime: number = 0;
  private lastStatsTime: number = 0;
  private statsHistory: {
    time: number;
    producers: number;
    consumers: number;
    decomposers: number;
  }[] = [];
  private creatureCounter: Record<CreatureType, number> = {
    producer: 0,
    consumer: 0,
    decomposer: 0,
  };
  private corpseCounter: number = 0;

  constructor() {
    this.lastUpdateTime = performance.now();
    this.lastStatsTime = performance.now();
  }

  setParams(params: Partial<EcosystemParams>): void {
    this.params = { ...this.params, ...params };
  }

  getParams(): EcosystemParams {
    return { ...this.params };
  }

  addCreature(type: CreatureType): void {
    if (this.creatures.length >= MAX_CREATURES) return;

    const config = CREATURE_CONFIGS[type];
    const x = Math.random() * (this.params.poolWidth - 40) + 20;
    const y = Math.random() * (this.params.poolHeight - 40) + 20;

    const creature: Creature = {
      id: uuidv4(),
      type,
      x,
      y,
      targetX: x,
      targetY: y,
      energy: config.initialEnergy,
      speed: config.baseSpeed,
      rotation: Math.random() * Math.PI * 2,
      isAlive: true,
      deathTime: null,
      trail: [],
      lastEnergyGain: 0,
    };

    this.creatures.push(creature);
    this.creatureCounter[type]++;
  }

  reset(): void {
    this.creatures = [];
    this.corpses = [];
    this.particles = [];
    this.events = [];
    this.statsHistory = [];
    this.creatureCounter = { producer: 0, consumer: 0, decomposer: 0 };
    this.corpseCounter = 0;
    this.lastUpdateTime = performance.now();
  }

  update(): EcosystemSnapshot {
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastUpdateTime) / 1000, 0.1);
    this.lastUpdateTime = now;

    this.updateCreatures(deltaTime, now);
    this.updateCorpses(now);
    this.updateParticles(deltaTime);
    this.cleanupOldEvents();

    if (now - this.lastStatsTime >= 1000) {
      this.recordStats(now);
      this.lastStatsTime = now;
    }

    return this.getSnapshot();
  }

  private updateCreatures(deltaTime: number, now: number): void {
    const totalCreatures = this.creatures.length;
    const highLoad = totalCreatures >= 400;
    const trailLength = highLoad ? MAX_TRAIL_LENGTH / 2 : MAX_TRAIL_LENGTH;

    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const creature = this.creatures[i];
      const config = CREATURE_CONFIGS[creature.type];

      const decayRate = config.energyDecayPerSecond * this.params.energyDecayRate;
      creature.energy -= decayRate * deltaTime;

      if (creature.energy < 0) {
        this.killCreature(creature, i, now);
        continue;
      }

      const threshold =
        config.reproductionThreshold * this.params.reproductionThresholdMultiplier;
      if (creature.energy >= threshold) {
        this.reproduce(creature, now, highLoad);
      }

      this.updateCreatureBehavior(creature, deltaTime, now);

      if (config.baseSpeed > 0) {
        creature.trail.unshift({ x: creature.x, y: creature.y, alpha: 1 });
        if (creature.trail.length > trailLength) {
          creature.trail.pop();
        }
        creature.trail.forEach((t, idx) => {
          t.alpha = 1 - idx / creature.trail.length;
        });
      }
    }
  }

  private updateCreatureBehavior(
    creature: Creature,
    deltaTime: number,
    now: number
  ): void {
    const config = CREATURE_CONFIGS[creature.type];

    if (creature.type === 'producer') {
      creature.rotation += deltaTime * 0.5;

      if (now - creature.lastEnergyGain >= PRODUCER_ENERGY_GAIN_INTERVAL) {
        creature.energy = Math.min(
          creature.energy + PRODUCER_ENERGY_GAIN,
          config.reproductionThreshold * this.params.reproductionThresholdMultiplier + 50
        );
        creature.lastEnergyGain = now;
      }
      return;
    }

    if (creature.type === 'consumer') {
      const nearestProducer = this.findNearestCreature(
        creature,
        'producer'
      );

      if (nearestProducer) {
        const dx = nearestProducer.x - creature.x;
        const dy = nearestProducer.y - creature.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < EAT_DISTANCE) {
          this.eatCreature(creature, nearestProducer);
        } else {
          this.moveToward(creature, nearestProducer.x, nearestProducer.y, deltaTime);
        }
      } else {
        this.wander(creature, deltaTime);
      }
      return;
    }

    if (creature.type === 'decomposer') {
      const nearestCorpse = this.findNearestCorpse(creature);

      if (nearestCorpse) {
        const dx = nearestCorpse.x - creature.x;
        const dy = nearestCorpse.y - creature.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < DECOMPOSE_DISTANCE) {
          this.decomposeCorpse(creature, nearestCorpse);
        } else {
          this.moveToward(creature, nearestCorpse.x, nearestCorpse.y, deltaTime);
        }
      } else {
        this.wander(creature, deltaTime);
      }
    }
  }

  private findNearestCreature(
    source: Creature,
    targetType: CreatureType
  ): Creature | null {
    let nearest: Creature | null = null;
    let minDistance = Infinity;

    for (const other of this.creatures) {
      if (other.type !== targetType || other.id === source.id) continue;

      const dx = other.x - source.x;
      const dy = other.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = other;
      }
    }

    return nearest;
  }

  private findNearestCorpse(source: Creature): Creature | null {
    let nearest: Creature | null = null;
    let minDistance = Infinity;

    for (const corpse of this.corpses) {
      const dx = corpse.x - source.x;
      const dy = corpse.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = corpse;
      }
    }

    return nearest;
  }

  private moveToward(
    creature: Creature,
    targetX: number,
    targetY: number,
    deltaTime: number
  ): void {
    const dx = targetX - creature.x;
    const dy = targetY - creature.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) {
      const speed =
        creature.speed * this.params.movementSpeedMultiplier * deltaTime;
      const moveX = (dx / distance) * speed;
      const moveY = (dy / distance) * speed;

      creature.x += moveX;
      creature.y += moveY;
      creature.rotation = Math.atan2(dy, dx);
    }

    const config = CREATURE_CONFIGS[creature.type];
    creature.x = Math.max(config.radius, Math.min(this.params.poolWidth - config.radius, creature.x));
    creature.y = Math.max(config.radius, Math.min(this.params.poolHeight - config.radius, creature.y));
  }

  private wander(creature: Creature, deltaTime: number): void {
    if (Math.random() < 0.02) {
      creature.targetX = Math.random() * (this.params.poolWidth - 40) + 20;
      creature.targetY = Math.random() * (this.params.poolHeight - 40) + 20;
    }

    const dx = creature.targetX - creature.x;
    const dy = creature.targetY - creature.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      this.moveToward(creature, creature.targetX, creature.targetY, deltaTime);
    } else {
      creature.targetX = Math.random() * (this.params.poolWidth - 40) + 20;
      creature.targetY = Math.random() * (this.params.poolHeight - 40) + 20;
    }
  }

  private eatCreature(consumer: Creature, producer: Creature): void {
    const producerIndex = this.creatures.findIndex((c) => c.id === producer.id);
    if (producerIndex === -1) return;

    const energyGained = producer.energy * 0.8;
    consumer.energy += energyGained;

    this.creatures.splice(producerIndex, 1);

    this.addEvent({
      id: uuidv4(),
      timestamp: performance.now(),
      message: `消费者#${this.getCreatureNumber(consumer)} 吞噬了 生产者#${this.getCreatureNumber(producer)}`,
      type: 'eat',
    });

    this.createEatParticles(producer.x, producer.y, CREATURE_CONFIGS.producer.color);
  }

  private decomposeCorpse(decomposer: Creature, corpse: Creature): void {
    const corpseIndex = this.corpses.findIndex((c) => c.id === corpse.id);
    if (corpseIndex === -1) return;

    const energyGained = 30;
    decomposer.energy += energyGained;

    this.corpses.splice(corpseIndex, 1);

    this.addEvent({
      id: uuidv4(),
      timestamp: performance.now(),
      message: `分解者#${this.getCreatureNumber(decomposer)} 分解了 尸体#${this.getCorpseNumber(corpse)}`,
      type: 'decompose',
    });

    this.createEatParticles(corpse.x, corpse.y, '#a0a0a0');
  }

  private killCreature(creature: Creature, index: number, now: number): void {
    const corpse: Creature = {
      ...creature,
      isAlive: false,
      deathTime: now,
      trail: [],
    };

    this.creatures.splice(index, 1);
    this.corpses.push(corpse);
    this.corpseCounter++;

    this.addEvent({
      id: uuidv4(),
      timestamp: now,
      message: `${this.getCreatureTypeName(creature.type)}#${this.getCreatureNumber(creature)} 死亡了`,
      type: 'death',
    });
  }

  private reproduce(creature: Creature, now: number, highLoad: boolean): void {
    const config = CREATURE_CONFIGS[creature.type];
    const childEnergy = creature.energy / 2;
    creature.energy = childEnergy;

    const angle = Math.random() * Math.PI * 2;
    const distance = config.radius * 2;
    const childX = creature.x + Math.cos(angle) * distance;
    const childY = creature.y + Math.sin(angle) * distance;

    const child: Creature = {
      id: uuidv4(),
      type: creature.type,
      x: Math.max(config.radius, Math.min(this.params.poolWidth - config.radius, childX)),
      y: Math.max(config.radius, Math.min(this.params.poolHeight - config.radius, childY)),
      targetX: childX,
      targetY: childY,
      energy: childEnergy,
      speed: creature.speed,
      rotation: Math.random() * Math.PI * 2,
      isAlive: true,
      deathTime: null,
      trail: [],
      lastEnergyGain: 0,
    };

    if (this.creatures.length < MAX_CREATURES) {
      this.creatures.push(child);
      this.creatureCounter[creature.type]++;

      this.addEvent({
        id: uuidv4(),
        timestamp: now,
        message: `${this.getCreatureTypeName(creature.type)}#${this.getCreatureNumber(creature)} 繁殖了 ${this.getCreatureTypeName(creature.type)}#${this.getCreatureNumber(child)}`,
        type: 'reproduce',
      });

      this.createReproductionParticles(creature.x, creature.y, config.color, highLoad);
    }
  }

  private updateCorpses(now: number): void {
    for (let i = this.corpses.length - 1; i >= 0; i--) {
      const corpse = this.corpses[i];
      if (corpse.deathTime && now - corpse.deathTime >= CORPSE_DECAY_TIME) {
        this.corpses.splice(i, 1);
      }
    }
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.life -= deltaTime * 1000;
      particle.alpha = Math.max(0, particle.life / particle.maxLife);

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private createEatParticles(x: number, y: number, color: string): void {
    const maxParticles = this.creatures.length >= 400 ? 6 : 12;
    const particleCount = Math.min(maxParticles, MAX_PARTICLES - this.particles.length);

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 50 + Math.random() * 50;

      this.particles.push({
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 3,
        color,
        alpha: 1,
        life: 500,
        maxLife: 500,
      });
    }
  }

  private createReproductionParticles(
    x: number,
    y: number,
    color: string,
    highLoad: boolean
  ): void {
    const maxParticles = highLoad ? 8 : 16;
    const particleCount = Math.min(maxParticles, MAX_PARTICLES - this.particles.length);

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 30 + Math.random() * 20;

      this.particles.push({
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 4,
        color,
        alpha: 1,
        life: 500,
        maxLife: 500,
      });
    }
  }

  private addEvent(event: LogEvent): void {
    this.events.unshift(event);
    if (this.events.length > 100) {
      this.events.pop();
    }
  }

  private cleanupOldEvents(): void {
    const now = performance.now();
    const maxAge = 60000;
    this.events = this.events.filter((e) => now - e.timestamp < maxAge);
  }

  private recordStats(now: number): void {
    const stats = this.calculateStats();
    this.statsHistory.push({
      time: now,
      producers: stats.producerCount,
      consumers: stats.consumerCount,
      decomposers: stats.decomposerCount,
    });

    const maxAge = 60000;
    this.statsHistory = this.statsHistory.filter((s) => now - s.time < maxAge);
  }

  private calculateStats(): EcosystemStats {
    let producerCount = 0;
    let consumerCount = 0;
    let decomposerCount = 0;
    let totalEnergy = 0;

    for (const creature of this.creatures) {
      totalEnergy += creature.energy;
      if (creature.type === 'producer') producerCount++;
      else if (creature.type === 'consumer') consumerCount++;
      else if (creature.type === 'decomposer') decomposerCount++;
    }

    for (const corpse of this.corpses) {
      totalEnergy += Math.max(0, corpse.energy);
    }

    return {
      producerCount,
      consumerCount,
      decomposerCount,
      corpseCount: this.corpses.length,
      totalEnergy: Math.round(totalEnergy),
    };
  }

  getStatsHistory(): {
    time: number;
    producers: number;
    consumers: number;
    decomposers: number;
  }[] {
    return [...this.statsHistory];
  }

  private getCreatureNumber(creature: Creature): number {
    return parseInt(creature.id.split('-')[0], 16) % 1000;
  }

  private getCorpseNumber(corpse: Creature): number {
    return parseInt(corpse.id.split('-')[0], 16) % 1000;
  }

  private getCreatureTypeName(type: CreatureType): string {
    const names: Record<CreatureType, string> = {
      producer: '生产者',
      consumer: '消费者',
      decomposer: '分解者',
    };
    return names[type];
  }

  getSnapshot(): EcosystemSnapshot {
    return {
      creatures: [...this.creatures],
      corpses: [...this.corpses],
      particles: [...this.particles],
      stats: this.calculateStats(),
      events: [...this.events],
    };
  }
}
