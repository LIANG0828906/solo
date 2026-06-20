import { v4 as uuidv4 } from 'uuid';
import {
  ShipType,
  AIStrategy,
  Faction,
  FleetConfig,
  ShipConfig,
  ShipState,
  Projectile,
  ResourcePoint,
  Particle,
  FloatingText,
  GameStateFrame,
  SimulationResult,
  SimulationStatus,
  SHIP_STATS,
  MAP_SIZE,
  TICK_RATE,
  TICK_INTERVAL,
  FACTION_COLORS,
} from '../shared/types';

const HEATMAP_GRID_SIZE = 20;
const MAX_SIMULATION_FRAMES = TICK_RATE * 60 * 10;
const FIRE_RATES: Record<ShipType, number> = {
  scout: 30,
  capital: 60,
  carrier: 45,
};

export class BattleEngine {
  private ships: ShipState[] = [];
  private projectiles: Projectile[] = [];
  private resourcePoints: ResourcePoint[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  private blueResources = 0;
  private redResources = 0;
  private frameNumber = 0;
  private startTime = 0;
  private isRunning = false;
  private isPaused = false;

  private blueTotalDamage = 0;
  private redTotalDamage = 0;
  private blueInitialCount = 0;
  private redInitialCount = 0;

  private resourceHistory: { time: number; blue: number; red: number }[] = [];
  private aiHeatmap: number[][] = [];
  private aiStrategy: AIStrategy = 'balanced';

  private simulationId: string;
  private tickInterval: NodeJS.Timeout | null = null;

  private particleIdCounter = 0;
  private projectileIdCounter = 0;
  private textIdCounter = 0;

  constructor(private config: { blueFleet: FleetConfig; redFleet: FleetConfig }) {
    this.simulationId = uuidv4();
    this.aiStrategy = config.redFleet.aiStrategy || 'balanced';

    this.aiHeatmap = Array.from({ length: HEATMAP_GRID_SIZE }, () =>
      Array.from({ length: HEATMAP_GRID_SIZE }, () => 0)
    );

    this.generateResourcePoints();
    this.initializeShips(config.blueFleet.ships, 200);
    this.initializeShips(config.redFleet.ships, MAP_SIZE - 200);

    this.blueInitialCount = config.blueFleet.ships.length;
    this.redInitialCount = config.redFleet.ships.length;
  }

  private generateResourcePoints(): void {
    const edgeMargin = MAP_SIZE * 0.1;
    for (let i = 0; i < 10; i++) {
      this.resourcePoints.push({
        id: uuidv4(),
        x: edgeMargin + Math.random() * (MAP_SIZE - edgeMargin * 2),
        y: edgeMargin + Math.random() * (MAP_SIZE - edgeMargin * 2),
        resourceAmount: 500 + Math.random() * 1000,
        maxResource: 500 + Math.random() * 1000,
        beingGatheredBy: [],
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private initializeShips(ships: ShipConfig[], startX: number): void {
    const spacing = MAP_SIZE / (ships.length + 1);
    ships.forEach((shipConfig, index) => {
      const stats = SHIP_STATS[shipConfig.type];
      this.ships.push({
        id: shipConfig.id,
        type: shipConfig.type,
        faction: shipConfig.faction,
        x: startX,
        y: spacing * (index + 1),
        angle: shipConfig.faction === 'blue' ? 0 : Math.PI,
        shield: stats.shield,
        maxShield: stats.shield,
        targetId: null,
        gatheringFrom: null,
        lastFireTime: 0,
        trail: [],
      });
    });
  }

  private distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  private findNearestEnemy(ship: ShipState): ShipState | null {
    let nearest: ShipState | null = null;
    let minDist = Infinity;
    const stats = SHIP_STATS[ship.type];

    for (const other of this.ships) {
      if (other.faction === ship.faction || other.shield <= 0) continue;
      const dist = this.distance(ship.x, ship.y, other.x, other.y);
      if (dist < minDist && dist <= stats.range * 1.5) {
        minDist = dist;
        nearest = other;
      }
    }
    return nearest;
  }

  private findNearestResource(ship: ShipState): ResourcePoint | null {
    let nearest: ResourcePoint | null = null;
    let minDist = Infinity;

    for (const rp of this.resourcePoints) {
      if (rp.resourceAmount <= 0) continue;
      const dist = this.distance(ship.x, ship.y, rp.x, rp.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = rp;
      }
    }
    return nearest;
  }

  private createExplosion(x: number, y: number, color: string): void {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        id: `p-${this.particleIdCounter++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  private createProjectile(ship: ShipState, target: ShipState): void {
    const stats = SHIP_STATS[ship.type];
    const angle = Math.atan2(target.y - ship.y, target.x - ship.x);
    const speed = 400;

    this.projectiles.push({
      id: `proj-${this.projectileIdCounter++}`,
      x: ship.x,
      y: ship.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: stats.damage,
      faction: ship.faction,
      targetId: target.id,
      life: 2,
    });
  }

  private aiDecision(ship: ShipState): void {
    const enemy = this.findNearestEnemy(ship);
    const resource = this.findNearestResource(ship);
    const stats = SHIP_STATS[ship.type];

    let targetX: number;
    let targetY: number;

    if (this.aiStrategy === 'aggressive') {
      if (enemy) {
        const dist = this.distance(ship.x, ship.y, enemy.x, enemy.y);
        if (dist > stats.range * 0.8) {
          targetX = enemy.x;
          targetY = enemy.y;
        } else {
          targetX = ship.x + Math.cos(ship.angle) * 50;
          targetY = ship.y + Math.sin(ship.angle) * 50;
        }
        ship.targetId = enemy.id;
        ship.gatheringFrom = null;
      } else if (resource) {
        targetX = resource.x;
        targetY = resource.y;
        ship.gatheringFrom = resource.id;
        ship.targetId = null;
      } else {
        targetX = MAP_SIZE / 2;
        targetY = ship.y;
        ship.targetId = null;
        ship.gatheringFrom = null;
      }
    } else if (this.aiStrategy === 'defensive') {
      const baseX = ship.faction === 'blue' ? 200 : MAP_SIZE - 200;
      const distToBase = Math.abs(ship.x - baseX);

      if (enemy && this.distance(ship.x, ship.y, enemy.x, enemy.y) < stats.range) {
        targetX = enemy.x;
        targetY = enemy.y;
        ship.targetId = enemy.id;
        ship.gatheringFrom = null;
      } else if (resource && distToBase < MAP_SIZE * 0.4) {
        targetX = resource.x;
        targetY = resource.y;
        ship.gatheringFrom = resource.id;
        ship.targetId = null;
      } else {
        targetX = baseX;
        targetY = ship.y;
        ship.targetId = null;
        ship.gatheringFrom = null;
      }
    } else {
      if (Math.random() < 0.5 && enemy) {
        const dist = this.distance(ship.x, ship.y, enemy.x, enemy.y);
        if (dist > stats.range * 0.8) {
          targetX = enemy.x;
          targetY = enemy.y;
        } else {
          targetX = ship.x;
          targetY = ship.y;
        }
        ship.targetId = enemy.id;
        ship.gatheringFrom = null;
      } else if (resource) {
        targetX = resource.x;
        targetY = resource.y;
        ship.gatheringFrom = resource.id;
        ship.targetId = null;
      } else if (enemy) {
        targetX = enemy.x;
        targetY = enemy.y;
        ship.targetId = enemy.id;
        ship.gatheringFrom = null;
      } else {
        targetX = MAP_SIZE / 2;
        targetY = ship.y;
        ship.targetId = null;
        ship.gatheringFrom = null;
      }
    }

    const desiredAngle = Math.atan2(targetY - ship.y, targetX - ship.x);
    const angleDiff = this.normalizeAngle(desiredAngle - ship.angle);
    const angleStep = 0.1;
    if (Math.abs(angleDiff) > angleStep) {
      ship.angle += Math.sign(angleDiff) * angleStep;
    } else {
      ship.angle = desiredAngle;
    }

    const moveSpeed = stats.speed * TICK_INTERVAL / 1000;
    ship.x += Math.cos(ship.angle) * moveSpeed;
    ship.y += Math.sin(ship.angle) * moveSpeed;

    ship.x = Math.max(10, Math.min(MAP_SIZE - 10, ship.x));
    ship.y = Math.max(10, Math.min(MAP_SIZE - 10, ship.y));

    ship.trail.unshift({ x: ship.x, y: ship.y, age: 0 });
    if (ship.trail.length > 20) {
      ship.trail.pop();
    }
    ship.trail.forEach((t) => t.age++);

    this.updateHeatmap(ship.x, ship.y);
  }

  private updateHeatmap(x: number, y: number): void {
    const gridX = Math.floor((x / MAP_SIZE) * HEATMAP_GRID_SIZE);
    const gridY = Math.floor((y / MAP_SIZE) * HEATMAP_GRID_SIZE);
    const clampedX = Math.max(0, Math.min(HEATMAP_GRID_SIZE - 1, gridX));
    const clampedY = Math.max(0, Math.min(HEATMAP_GRID_SIZE - 1, gridY));
    this.aiHeatmap[clampedY][clampedX]++;
  }

  public tick(): void {
    const aliveShips = this.ships.filter((s) => s.shield > 0);

    for (const ship of aliveShips) {
      this.aiDecision(ship);
    }

    for (const ship of aliveShips) {
      if (ship.targetId) {
        const target = this.ships.find((s) => s.id === ship.targetId && s.shield > 0);
        if (target) {
          const dist = this.distance(ship.x, ship.y, target.x, target.y);
          const stats = SHIP_STATS[ship.type];
          const fireRate = FIRE_RATES[ship.type];

          if (dist <= stats.range && this.frameNumber - ship.lastFireTime >= fireRate) {
            this.createProjectile(ship, target);
            ship.lastFireTime = this.frameNumber;
          }
        } else {
          ship.targetId = null;
        }
      }
    }

    const projectilesToRemove: number[] = [];
    for (let i = 0; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];
      proj.x += proj.vx * TICK_INTERVAL / 1000;
      proj.y += proj.vy * TICK_INTERVAL / 1000;
      proj.life -= TICK_INTERVAL / 1000;

      if (proj.life <= 0 || proj.x < 0 || proj.x > MAP_SIZE || proj.y < 0 || proj.y > MAP_SIZE) {
        projectilesToRemove.push(i);
        continue;
      }

      const target = this.ships.find((s) => s.id === proj.targetId && s.shield > 0);
      if (target) {
        const dist = this.distance(proj.x, proj.y, target.x, target.y);
        if (dist < 20) {
          target.shield -= proj.damage;
          if (proj.faction === 'blue') {
            this.blueTotalDamage += proj.damage;
          } else {
            this.redTotalDamage += proj.damage;
          }
          this.createExplosion(proj.x, proj.y, FACTION_COLORS[proj.faction]);
          projectilesToRemove.push(i);

          if (target.shield <= 0) {
            this.createExplosion(target.x, target.y, FACTION_COLORS[target.faction]);
          }
        }
      } else {
        projectilesToRemove.push(i);
      }
    }

    for (let i = projectilesToRemove.length - 1; i >= 0; i--) {
      this.projectiles.splice(projectilesToRemove[i], 1);
    }

    for (const ship of aliveShips) {
      if (ship.gatheringFrom) {
        const resource = this.resourcePoints.find((r) => r.id === ship.gatheringFrom);
        if (resource && resource.resourceAmount > 0) {
          const dist = this.distance(ship.x, ship.y, resource.x, resource.y);
          if (dist < 50) {
            const gatherAmount = SHIP_STATS[ship.type].gatherRate * TICK_INTERVAL / 1000;
            const actualGather = Math.min(gatherAmount, resource.resourceAmount);
            resource.resourceAmount -= actualGather;

            if (ship.faction === 'blue') {
              this.blueResources += actualGather;
            } else {
              this.redResources += actualGather;
            }

            if (Math.random() < 0.05) {
              this.floatingTexts.push({
                id: `t-${this.textIdCounter++}`,
                x: resource.x + (Math.random() - 0.5) * 30,
                y: resource.y,
                text: `+${actualGather.toFixed(1)}`,
                color: FACTION_COLORS[ship.faction],
                life: 1,
                maxLife: 1,
              });
            }
          }
        } else {
          ship.gatheringFrom = null;
        }
      }
    }

    const particlesToRemove: number[] = [];
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * TICK_INTERVAL / 1000;
      p.y += p.vy * TICK_INTERVAL / 1000;
      p.life -= TICK_INTERVAL / 1000;
      if (p.life <= 0) {
        particlesToRemove.push(i);
      }
    }
    for (let i = particlesToRemove.length - 1; i >= 0; i--) {
      this.particles.splice(particlesToRemove[i], 1);
    }

    const textsToRemove: number[] = [];
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const t = this.floatingTexts[i];
      t.y -= 30 * TICK_INTERVAL / 1000;
      t.life -= TICK_INTERVAL / 1000;
      if (t.life <= 0) {
        textsToRemove.push(i);
      }
    }
    for (let i = textsToRemove.length - 1; i >= 0; i--) {
      this.floatingTexts.splice(textsToRemove[i], 1);
    }

    for (const rp of this.resourcePoints) {
      rp.pulsePhase += TICK_INTERVAL / 1000 * 2;
    }

    if (this.frameNumber % 60 === 0) {
      this.resourceHistory.push({
        time: this.frameNumber / TICK_RATE,
        blue: this.blueResources,
        red: this.redResources,
      });
    }

    const blueAlive = this.ships.filter((s) => s.faction === 'blue' && s.shield > 0).length;
    const redAlive = this.ships.filter((s) => s.faction === 'red' && s.shield > 0).length;

    if (blueAlive === 0 || redAlive === 0 || this.frameNumber >= MAX_SIMULATION_FRAMES) {
      this.stop();
      return;
    }

    this.frameNumber++;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.tickInterval = setInterval(() => this.tick(), TICK_INTERVAL);
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public stop(): SimulationResult {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.isRunning = false;
    return this.getResult();
  }

  public getCurrentFrame(): GameStateFrame {
    const status: SimulationStatus = !this.isRunning
      ? this.frameNumber === 0
        ? 'idle'
        : 'finished'
      : this.isPaused
      ? 'paused'
      : 'running';

    return {
      frameNumber: this.frameNumber,
      timestamp: Date.now(),
      ships: this.ships.filter((s) => s.shield > 0),
      projectiles: [...this.projectiles],
      resourcePoints: [...this.resourcePoints],
      particles: [...this.particles],
      floatingTexts: [...this.floatingTexts],
      blueResources: this.blueResources,
      redResources: this.redResources,
      status,
    };
  }

  public getResult(): SimulationResult {
    const endTime = Date.now();
    const blueSurvived = this.ships.filter((s) => s.faction === 'blue' && s.shield > 0).length;
    const redSurvived = this.ships.filter((s) => s.faction === 'red' && s.shield > 0).length;

    const blueScore = blueSurvived * 1000 + this.blueResources;
    const redScore = redSurvived * 1000 + this.redResources;

    let winner: Faction | 'draw';
    if (blueScore > redScore) {
      winner = 'blue';
    } else if (redScore > blueScore) {
      winner = 'red';
    } else {
      winner = 'draw';
    }

    const heatmapArray: { x: number; y: number; intensity: number }[] = [];
    const cellSize = MAP_SIZE / HEATMAP_GRID_SIZE;
    for (let y = 0; y < HEATMAP_GRID_SIZE; y++) {
      for (let x = 0; x < HEATMAP_GRID_SIZE; x++) {
        if (this.aiHeatmap[y][x] > 0) {
          heatmapArray.push({
            x: x * cellSize + cellSize / 2,
            y: y * cellSize + cellSize / 2,
            intensity: this.aiHeatmap[y][x],
          });
        }
      }
    }

    return {
      simulationId: this.simulationId,
      startTime: this.startTime,
      endTime,
      duration: (endTime - this.startTime) / 1000,
      winner,
      blueStats: {
        survived: blueSurvived,
        totalShips: this.blueInitialCount,
        totalDamage: this.blueTotalDamage,
        resourcesGathered: this.blueResources,
      },
      redStats: {
        survived: redSurvived,
        totalShips: this.redInitialCount,
        totalDamage: this.redTotalDamage,
        resourcesGathered: this.redResources,
      },
      resourceHistory: [...this.resourceHistory],
      aiHeatmap: heatmapArray,
    };
  }
}
