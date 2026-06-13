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
      this.spawnFood();
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

        const effectiveAggrA = a.genes.aggression + (Math.random() - 0.5) * 0.2;
        const effectiveAggrB = b.genes.aggression + (Math.random() - 0.5) * 0.2;

        if (effectiveAggrA > effectiveAggrB) {
          a.energy += COLLISION_WIN_ENERGY;
          b.energy -= COLLISION_LOSE_ENERGY;
        } else if (effectiveAggrB > effectiveAggrA) {
          b.energy += COLLISION_WIN_ENERGY;
          a.energy -= COLLISION_LOSE_ENERGY;
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
    for (let i = 0; i < DEATH_PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 / DEATH_PARTICLE_COUNT) * i + (Math.random() - 0.5) * 0.5;
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        x: creature.x,
        y: creature.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: DEATH_PARTICLE_DURATION,
        maxLife: DEATH_PARTICLE_DURATION,
        hue: creature.genes.colorHue,
        size: 2 + Math.random() * 3,
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
      const pulse = Math.sin(f.pulsePhase * Math.PI * 2 / 0.5) * 0.3 + 0.7;
      const radius = 4 * pulse;
      const alpha = 0.6 + pulse * 0.4;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 255, 100, 0.8)';
      ctx.shadowBlur = 10;

      const gradient = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius + 2);
      gradient.addColorStop(0, `rgba(100, 255, 150, ${alpha})`);
      gradient.addColorStop(1, `rgba(0, 200, 80, 0)`);
      ctx.beginPath();
      ctx.arc(f.x, f.y, radius + 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(80, 255, 120, ${alpha})`;
      ctx.fill();

      ctx.restore();
    }
  }

  drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const lifeRatio = p.life / p.maxLife;
      const alpha = lifeRatio;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha})`;
      ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${alpha * 0.5})`;
      ctx.shadowBlur = 6;
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
    return { count, avgAggression };
  }
}
