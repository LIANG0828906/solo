import { Creature } from './creature';

interface Food {
  x: number;
  y: number;
  pulsePhase: number;
  eaten: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  size: number;
}

interface Stats {
  count: number;
  avgAggression: number;
  hungryCount: number;
}

const CANVAS_SIZE = 600;
const INITIAL_CREATURE_COUNT = 20;
const FOOD_SPAWN_INTERVAL = 5;
const FOOD_SPAWN_COUNT = 3;
const FOOD_PICKUP_RANGE = 20;
const FOOD_ENERGY = 5;
const COLLISION_WIN_ENERGY = 10;
const COLLISION_LOSE_ENERGY = 10;
const REPRODUCTION_THRESHOLD = 150;
const MUTATION_RATE = 0.001;
const DEATH_PARTICLE_DURATION = 0.8;
const DEATH_PARTICLE_COUNT = 16;

export class Simulator {
  creatures: Creature[];
  foods: Food[];
  particles: Particle[];
  foodTimer: number;
  canvasWidth: number;
  canvasHeight: number;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.creatures = [];
    this.foods = [];
    this.particles = [];
    this.foodTimer = 0;
    this.generateInitialCreatures();
    this.refreshFood();
  }

  generateInitialCreatures(): void {
    for (let i = 0; i < INITIAL_CREATURE_COUNT; i++) {
      this.spawnRandomCreature();
    }
  }

  spawnRandomCreature(): void {
    const margin = 30;
    const x = Math.random() * (this.canvasWidth - margin * 2) + margin;
    const y = Math.random() * (this.canvasHeight - margin * 2) + margin;
    const creature = new Creature(x, y);
    this.creatures.push(creature);
  }

  addCreature(creature: Creature): void {
    this.creatures.push(creature);
  }

  reset(): void {
    this.creatures = [];
    this.foods = [];
    this.particles = [];
    this.foodTimer = 0;
    this.generateInitialCreatures();
    this.refreshFood();
  }

  runGeneration(dt: number, speedMultiplier: number): void {
    const sDt = dt * speedMultiplier;

    for (const c of this.creatures) {
      c.update(dt, speedMultiplier);
    }

    this.handleCollisions();
    this.handleEating(sDt);
    this.handleReproduction();
    this.handleDeath();

    this.foodTimer += sDt;
    if (this.foodTimer >= FOOD_SPAWN_INTERVAL) {
      this.foodTimer = 0;
      this.refreshFood();
    }

    this.updateParticles(sDt);
    this.updateFood(sDt);
  }

  private handleCollisions(): void {
    const len = this.creatures.length;
    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const a = this.creatures[i];
        const b = this.creatures[j];
        if (!a.alive || !b.alive) continue;
        if (!a.collidesWith(b)) continue;

        const sizeScoreA = a.genes.size / 15;
        const sizeScoreB = b.genes.size / 15;
        const speedEvadeA = a.genes.speed / 3;
        const speedEvadeB = b.genes.speed / 3;

        const powerA = a.genes.aggression * 0.6 + sizeScoreA * 0.35 + (Math.random() - 0.5) * 0.15;
        const powerB = b.genes.aggression * 0.6 + sizeScoreB * 0.35 + (Math.random() - 0.5) * 0.15;

        const evadeA = speedEvadeA * 0.4;
        const evadeB = speedEvadeB * 0.4;

        const effectiveA = powerA - evadeB;
        const effectiveB = powerB - evadeA;

        const diff = Math.abs(effectiveA - effectiveB);
        const baseEnergy = 5 + diff * 15;
        const energyGain = Math.max(3, Math.min(25, baseEnergy));
        const energyLoss = Math.max(3, Math.min(20, baseEnergy * 0.8));

        if (effectiveA > effectiveB) {
          a.energy += energyGain;
          b.energy -= energyLoss;
        } else if (effectiveB > effectiveA) {
          b.energy += energyGain;
          a.energy -= energyLoss;
        }

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;
        a.vx = -nx * a.effectiveSpeed;
        a.vy = -ny * a.effectiveSpeed;
        b.vx = nx * b.effectiveSpeed;
        b.vy = ny * b.effectiveSpeed;

        const overlap = (a.genes.size + b.genes.size) - dist;
        if (overlap > 0) {
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;
        }
      }
    }
  }

  private handleEating(dt: number): void {
    for (const creature of this.creatures) {
      if (!creature.alive) continue;
      for (const food of this.foods) {
        if (food.eaten) continue;
        const dx = creature.x - food.x;
        const dy = creature.y - food.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < FOOD_PICKUP_RANGE) {
          food.eaten = true;
          creature.energy += FOOD_ENERGY;
        }
      }
    }
    this.foods = this.foods.filter(f => !f.eaten);
  }

  private handleReproduction(): void {
    const newborns: Creature[] = [];
    for (const c of this.creatures) {
      if (!c.alive) continue;
      if (c.energy > REPRODUCTION_THRESHOLD) {
        c.energy = Math.floor(c.energy / 2);
        const childGenes = {
          size: this.mutate(c.genes.size, 0.5, 6, 20),
          speed: this.mutate(c.genes.speed, 0.1, 0.3, 3),
          colorHue: this.mutate(c.genes.colorHue, 3, 0, 360),
          aggression: this.mutate(c.genes.aggression, 0.01, 0, 1),
          reproductionTendency: this.mutate(c.genes.reproductionTendency, 0.01, 0, 1),
        };
        const offset = 20;
        const nx = Math.max(10, Math.min(this.canvasWidth - 10, c.x + (Math.random() - 0.5) * offset));
        const ny = Math.max(10, Math.min(this.canvasHeight - 10, c.y + (Math.random() - 0.5) * offset));
        newborns.push(new Creature(nx, ny, childGenes));
      }
    }
    this.creatures.push(...newborns);
  }

  private mutate(value: number, range: number, min: number, max: number): number {
    let newVal = value;
    if (Math.random() < MUTATION_RATE * 100) {
      newVal += (Math.random() - 0.5) * range * 2;
    }
    return Math.max(min, Math.min(max, newVal));
  }

  private handleDeath(): void {
    const dying: Creature[] = [];
    for (const c of this.creatures) {
      if (c.energy <= 0 && c.alive) {
        c.alive = false;
        dying.push(c);
        this.spawnDeathParticles(c);
      }
    }
    this.creatures = this.creatures.filter(c => c.alive);
  }

  private spawnDeathParticles(creature: Creature): void {
    const count = DEATH_PARTICLE_COUNT;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.6;
      const speed = 50 + Math.random() * 80;
      this.particles.push({
        x: creature.x,
        y: creature.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: DEATH_PARTICLE_DURATION,
        maxLife: DEATH_PARTICLE_DURATION,
        hue: creature.genes.colorHue,
        size: 3 + Math.random() * 4,
      });
    }
    for (let i = 0; i < count / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      this.particles.push({
        x: creature.x,
        y: creature.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: DEATH_PARTICLE_DURATION * 0.6,
        maxLife: DEATH_PARTICLE_DURATION * 0.6,
        hue: creature.genes.colorHue,
        size: 1.5 + Math.random() * 2,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  private updateFood(dt: number): void {
    for (const f of this.foods) {
      f.pulsePhase += dt;
    }
  }

  refreshFood(): void {
    this.foods = [];
    for (let i = 0; i < FOOD_SPAWN_COUNT; i++) {
      const margin = 15;
      this.foods.push({
        x: Math.random() * (this.canvasWidth - margin * 2) + margin,
        y: Math.random() * (this.canvasHeight - margin * 2) + margin,
        pulsePhase: Math.random() * Math.PI * 2,
        eaten: false,
      });
    }
  }

  spawnFood(): void {
    for (let i = 0; i < FOOD_SPAWN_COUNT; i++) {
      const margin = 15;
      this.foods.push({
        x: Math.random() * (this.canvasWidth - margin * 2) + margin,
        y: Math.random() * (this.canvasHeight - margin * 2) + margin,
        pulsePhase: Math.random() * Math.PI * 2,
        eaten: false,
      });
    }
  }

  drawFoods(ctx: CanvasRenderingContext2D): void {
    for (const f of this.foods) {
      const pulseScale = Math.sin(f.pulsePhase * Math.PI * 2 / 0.5) * 0.4 + 0.6;
      const blinkAlpha = Math.sin(f.pulsePhase * Math.PI * 4 / 0.5) * 0.3 + 0.7;
      const radius = 5 * pulseScale;
      const alpha = Math.max(0.4, Math.min(1, blinkAlpha));

      ctx.save();

      const outerGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius + 6);
      outerGrad.addColorStop(0, `rgba(0, 255, 120, ${alpha * 0.8})`);
      outerGrad.addColorStop(0.5, `rgba(0, 220, 100, ${alpha * 0.3})`);
      outerGrad.addColorStop(1, 'rgba(0, 180, 80, 0)');
      ctx.beginPath();
      ctx.arc(f.x, f.y, radius + 6, 0, Math.PI * 2);
      ctx.fillStyle = outerGrad;
      ctx.fill();

      ctx.shadowColor = 'rgba(0, 255, 100, 0.9)';
      ctx.shadowBlur = 15 * alpha;

      const innerGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius);
      innerGrad.addColorStop(0, `rgba(180, 255, 200, ${alpha})`);
      innerGrad.addColorStop(0.5, `rgba(80, 255, 140, ${alpha})`);
      innerGrad.addColorStop(1, `rgba(20, 200, 80, ${alpha * 0.8})`);
      ctx.beginPath();
      ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = innerGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(f.x - radius * 0.3, f.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.fill();

      ctx.restore();
    }
  }

  drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const lifeRatio = p.life / p.maxLife;
      const alpha = lifeRatio;
      const size = p.size * (0.5 + lifeRatio * 0.5);
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
      gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${alpha})`);
      gradient.addColorStop(0.5, `hsla(${p.hue}, 100%, 55%, ${alpha * 0.6})`);
      gradient.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${alpha})`;
      ctx.shadowBlur = 10 * lifeRatio;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  drawCreatures(ctx: CanvasRenderingContext2D): void {
    for (const c of this.creatures) {
      c.draw(ctx);
    }
  }

  getStats(): Stats {
    const alive = this.creatures.filter(c => c.alive);
    const count = alive.length;
    const avgAggression = count > 0
      ? alive.reduce((sum, c) => sum + c.genes.aggression, 0) / count
      : 0;
    const hungryCount = alive.filter(c => c.checkHunger()).length;
    return { count, avgAggression, hungryCount };
  }
}
