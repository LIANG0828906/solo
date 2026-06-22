import { Ant, AntType, AntState, Vec2, HexCoord, PheromoneCell, ResourceNode } from '../types';
import { pixelToHex, hexToPixel, getHexNeighbors, hexKey, HEX_SIZE } from './hex_grid';

let antIdCounter = 0;

function createId(): string {
  return `ant_${++antIdCounter}`;
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 0.0001) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export interface PheromoneMap {
  getCell(hex: HexCoord): PheromoneCell;
  depositToFood(hex: HexCoord, amount: number): void;
  depositToHome(hex: HexCoord, amount: number): void;
  depositDanger(hex: HexCoord, amount: number): void;
  evaporate(deltaTime: number): void;
}

export interface AntWorldContext {
  pheromoneMap: PheromoneMap;
  getNestPosition: (nestId: string) => Vec2 | null;
  getNestFoodLevel: (nestId: string) => number;
  findNearestResource: (pos: Vec2, type: 'food' | 'material') => ResourceNode | null;
  findNearestEnemy: (pos: Vec2, radius: number) => { pos: Vec2; id: string } | null;
  alertZones: Array<{ position: Vec2; radius: number }>;
  getExploreRadius: () => number;
}

export class AntAgent implements Ant {
  id: string;
  type: AntType;
  state: AntState;
  position: Vec2;
  velocity: Vec2;
  carrying: boolean;
  carryingAmount: number;
  target: Vec2 | null;
  homeNestId: string;
  health: number;
  maxHealth: number;
  speed: number;
  baseSpeed: number;
  attackPower: number;
  baseAttackPower: number;
  selected: boolean;
  path: Vec2[];
  pathIndex: number;
  lastDecisionTime: number;
  decisionInterval: number;
  wanderAngle: number;

  constructor(type: AntType, position: Vec2, homeNestId: string, levelBonus: number = 1) {
    this.id = createId();
    this.type = type;
    this.state = type === 'soldier' ? 'patrolling' : 'foraging';
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.carrying = false;
    this.carryingAmount = 0;
    this.target = null;
    this.homeNestId = homeNestId;
    this.maxHealth = type === 'soldier' ? 50 : 30;
    this.health = this.maxHealth;
    this.baseSpeed = type === 'soldier' ? 55 : 45;
    this.speed = this.baseSpeed * levelBonus;
    this.baseAttackPower = type === 'soldier' ? 10 : 2;
    this.attackPower = this.baseAttackPower * (1 + 0.15 * (levelBonus - 1));
    this.selected = false;
    this.path = [];
    this.pathIndex = 0;
    this.lastDecisionTime = 0;
    this.decisionInterval = 0.3 + Math.random() * 0.2;
    this.wanderAngle = Math.random() * Math.PI * 2;
  }

  applyLevelBonus(levelBonus: number): void {
    this.speed = this.baseSpeed * levelBonus;
    this.attackPower = this.baseAttackPower * (1 + 0.15 * (levelBonus - 1));
  }

  update(deltaTime: number, world: AntWorldContext, currentTime: number): void {
    if (currentTime - this.lastDecisionTime > this.decisionInterval) {
      this.makeDecision(world, currentTime);
      this.lastDecisionTime = currentTime;
    }

    this.move(deltaTime, world);
    world.pheromoneMap.evaporate(0);
  }

  private makeDecision(world: AntWorldContext, currentTime: number): void {
    const currentHex = pixelToHex(this.position);

    if (this.type === 'soldier') {
      this.soldierDecision(world, currentHex);
    } else {
      this.workerDecision(world, currentHex);
    }

    this.depositPheromone(world, currentHex);
  }

  private soldierDecision(world: AntWorldContext, currentHex: HexCoord): void {
    const enemy = world.findNearestEnemy(this.position, 150);
    if (enemy) {
      this.state = 'attacking';
      this.target = enemy.pos;
      return;
    }

    let nearestAlert: { position: Vec2; radius: number } | null = null;
    let nearestDist = Infinity;
    for (const zone of world.alertZones) {
      const d = dist(this.position, zone.position);
      if (d < nearestDist && d < 400) {
        nearestDist = d;
        nearestAlert = zone;
      }
    }

    if (nearestAlert) {
      this.state = 'patrolling';
      if (!this.target || dist(this.position, nearestAlert.position) > nearestAlert.radius * 0.8) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * nearestAlert.radius * 0.7;
        this.target = {
          x: nearestAlert.position.x + Math.cos(angle) * r,
          y: nearestAlert.position.y + Math.sin(angle) * r,
        };
      }
      return;
    }

    if (!this.target || dist(this.position, this.target) < 20) {
      const homePos = world.getNestPosition(this.homeNestId);
      const basePos = homePos || this.position;
      const angle = Math.random() * Math.PI * 2;
      const r = 80 + Math.random() * 120;
      this.target = {
        x: basePos.x + Math.cos(angle) * r,
        y: basePos.y + Math.sin(angle) * r,
      };
    }
    this.state = 'patrolling';
  }

  private workerDecision(world: AntWorldContext, currentHex: HexCoord): void {
    if (this.carrying) {
      this.state = 'returning';
      const homePos = world.getNestPosition(this.homeNestId);
      if (homePos) {
        this.target = homePos;
        if (dist(this.position, homePos) < 25) {
          this.carrying = false;
          this.carryingAmount = 0;
          this.state = 'foraging';
        }
      }
      return;
    }

    const resource = world.findNearestResource(this.position, 'food');
    if (resource) {
      this.state = 'foraging';
      this.target = resource.position;
      if (dist(this.position, resource.position) < 20) {
        this.carrying = true;
        this.carryingAmount = 1;
        this.state = 'carrying';
        resource.amount = Math.max(0, resource.amount - 1);
      }
      return;
    }

    if (!this.target || dist(this.position, this.target) < 30) {
      this.target = this.choosePheromoneDirection(world, currentHex, 'toFood');
    }
    this.state = 'foraging';
  }

  private choosePheromoneDirection(
    world: AntWorldContext,
    currentHex: HexCoord,
    pheromoneType: 'toFood' | 'toHome'
  ): Vec2 {
    const neighbors = getHexNeighbors(currentHex);
    const weights: number[] = [];
    const positions: Vec2[] = [];
    let totalWeight = 0;

    for (const n of neighbors) {
      const cell = world.pheromoneMap.getCell(n);
      const pheroValue = pheromoneType === 'toFood' ? cell.toFood : cell.toHome;
      const exploreBonus = Math.random() * 0.3;
      const weight = Math.max(0.05, pheroValue + exploreBonus);
      weights.push(weight);
      totalWeight += weight;
      positions.push(hexToPixel(n));
    }

    if (totalWeight < 0.01) {
      this.wanderAngle += (Math.random() - 0.5) * 0.8;
      const step = 60;
      return {
        x: this.position.x + Math.cos(this.wanderAngle) * step,
        y: this.position.y + Math.sin(this.wanderAngle) * step,
      };
    }

    let r = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        return positions[i];
      }
    }
    return positions[0];
  }

  private depositPheromone(world: AntWorldContext, hex: HexCoord): void {
    if (this.type === 'worker') {
      if (this.carrying) {
        world.pheromoneMap.depositToFood(hex, 0.8);
      } else {
        world.pheromoneMap.depositToHome(hex, 0.5);
      }
    }
  }

  private move(deltaTime: number, world: AntWorldContext): void {
    if (!this.target) {
      this.wanderAngle += (Math.random() - 0.5) * 0.3;
      this.velocity.x = Math.cos(this.wanderAngle) * this.speed * 0.3;
      this.velocity.y = Math.sin(this.wanderAngle) * this.speed * 0.3;
    } else {
      const dx = this.target.x - this.position.x;
      const dy = this.target.y - this.position.y;
      const dir = normalize({ x: dx, y: dy });
      this.velocity.x = dir.x * this.speed;
      this.velocity.y = dir.y * this.speed;
    }

    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;
    return this.health <= 0;
  }
}
