import { Bee, Flower, Enemy, Position, Particle, Hive, BeeType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { findPath } from '../utils/pathfinding';

export class BeeManager {
  private bees: Bee[] = [];
  private flowers: Flower[] = [];
  private enemies: Enemy[] = [];
  private hive: Hive | null = null;
  private particles: Particle[] = [];
  private mapSize: { width: number; height: number } = { width: 1200, height: 600 };

  setBees(bees: Bee[]): void {
    this.bees = bees;
  }

  getBees(): Bee[] {
    return this.bees;
  }

  setFlowers(flowers: Flower[]): void {
    this.flowers = flowers;
  }

  getFlowers(): Flower[] {
    return this.flowers;
  }

  setEnemies(enemies: Enemy[]): void {
    this.enemies = enemies;
  }

  setHive(hive: Hive): void {
    this.hive = hive;
  }

  setMapSize(width: number, height: number): void {
    this.mapSize = { width, height };
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  addParticle(particle: Particle): void {
    this.particles.push(particle);
  }

  clearParticles(): void {
    this.particles = [];
  }

  update(dt: number): {
    bees: Bee[];
    flowers: Flower[];
    particles: Particle[];
    honeyGained: number;
    damageToEnemies: { enemyId: string; damage: number }[];
    discoveredAreas: string[];
  } {
    const newParticles: Particle[] = [...this.particles.filter((p) => p.life > 0)];
    let honeyGained = 0;
    const damageToEnemies: { enemyId: string; damage: number }[] = [];
    const discoveredAreas: string[] = [];

    const updatedBees = this.bees.map((bee) => {
      let updatedBee = { ...bee };

      if (updatedBee.attackCooldown > 0) {
        updatedBee.attackCooldown = Math.max(0, updatedBee.attackCooldown - dt);
      }

      switch (updatedBee.state) {
        case 'moving':
          updatedBee = this.updateMoving(updatedBee, dt);
          break;
        case 'collecting':
          const collectResult = this.updateCollecting(updatedBee, dt);
          updatedBee = collectResult.bee;
          honeyGained += collectResult.honeyGained;
          newParticles.push(...collectResult.particles);
          break;
        case 'returning':
          updatedBee = this.updateReturning(updatedBee, dt);
          if (updatedBee.state === 'idle' && updatedBee.carryHoney > 0) {
            honeyGained += updatedBee.carryHoney;
            updatedBee.carryHoney = 0;
          }
          break;
        case 'scouting':
          const scoutResult = this.updateScouting(updatedBee, dt);
          updatedBee = scoutResult.bee;
          discoveredAreas.push(...scoutResult.discovered);
          break;
        case 'patrolling':
          updatedBee = this.updatePatrolling(updatedBee, dt);
          break;
        case 'attacking':
          const attackResult = this.updateAttacking(updatedBee, dt);
          updatedBee = attackResult.bee;
          if (attackResult.damage > 0 && updatedBee.targetEnemyId) {
            damageToEnemies.push({ enemyId: updatedBee.targetEnemyId, damage: attackResult.damage });
          }
          newParticles.push(...attackResult.particles);
          break;
        case 'idle':
          updatedBee = this.updateIdle(updatedBee, dt);
          break;
      }

      return updatedBee;
    });

    const remainingParticles = newParticles
      .map((p) => ({
        ...p,
        position: {
          x: p.position.x + p.velocity.x * dt,
          y: p.position.y + p.velocity.y * dt,
        },
        life: p.life - dt,
      }))
      .filter((p) => p.life > 0);

    this.particles = remainingParticles;
    this.bees = updatedBees;

    return {
      bees: updatedBees,
      flowers: this.flowers,
      particles: remainingParticles,
      honeyGained,
      damageToEnemies,
      discoveredAreas,
    };
  }

  private updateMoving(bee: Bee, dt: number): Bee {
    if (!bee.targetPosition) return { ...bee, state: 'idle' };

    if (bee.path.length === 0 || bee.pathIndex >= bee.path.length) {
      const path = findPath(bee.position, bee.targetPosition, this.mapSize.width, this.mapSize.height);
      return { ...bee, path, pathIndex: 0 };
    }

    const currentTarget = bee.path[bee.pathIndex];
    const dx = currentTarget.x - bee.position.x;
    const dy = currentTarget.y - bee.position.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 2) {
      const newPathIndex = bee.pathIndex + 1;
      if (newPathIndex >= bee.path.length) {
        return this.onReachTarget(bee);
      }
      return { ...bee, pathIndex: newPathIndex };
    }

    const moveDist = bee.speed * dt;
    const ratio = Math.min(1, moveDist / dist);

    return {
      ...bee,
      position: {
        x: bee.position.x + dx * ratio,
        y: bee.position.y + dy * ratio,
      },
    };
  }

  private onReachTarget(bee: Bee): Bee {
    switch (bee.type) {
      case 'collector':
        if (bee.targetFlowerId) {
          const flower = this.flowers.find((f) => f.id === bee.targetFlowerId);
          if (flower && flower.honeyAmount > 0) {
            return { ...bee, state: 'collecting' };
          }
        }
        if (bee.carryHoney > 0) {
          return { ...bee, state: 'idle', targetPosition: null, path: [], pathIndex: 0 };
        }
        return { ...bee, state: 'idle', targetPosition: null, path: [], pathIndex: 0 };

      case 'scout':
        return { ...bee, state: 'scouting' };

      case 'guardian':
        if (bee.targetEnemyId) {
          return { ...bee, state: 'attacking' };
        }
        return { ...bee, state: 'patrolling', targetPosition: null, path: [], pathIndex: 0 };

      default:
        return { ...bee, state: 'idle', targetPosition: null, path: [], pathIndex: 0 };
    }
  }

  private updateCollecting(bee: Bee, dt: number): { bee: Bee; honeyGained: number; particles: Particle[] } {
    const particles: Particle[] = [];
    const collectRate = 3;
    const collected = collectRate * dt;

    const flowerIndex = this.flowers.findIndex((f) => f.id === bee.targetFlowerId);
    if (flowerIndex === -1) {
      return { bee: { ...bee, state: 'returning', targetPosition: this.hive?.position || null }, honeyGained: 0, particles };
    }

    const flower = this.flowers[flowerIndex];
    const actualCollected = Math.min(collected, flower.honeyAmount, bee.maxCarry - bee.carryHoney);

    this.flowers[flowerIndex] = {
      ...flower,
      honeyAmount: flower.honeyAmount - actualCollected,
    };

    const newCarryHoney = bee.carryHoney + actualCollected;

    if (Math.random() < 0.3) {
      particles.push({
        id: uuidv4(),
        position: {
          x: flower.position.x + (Math.random() - 0.5) * 20,
          y: flower.position.y + (Math.random() - 0.5) * 20,
        },
        velocity: {
          x: (bee.position.x - flower.position.x) * 0.5 + (Math.random() - 0.5) * 20,
          y: (bee.position.y - flower.position.y) * 0.5 + (Math.random() - 0.5) * 20,
        },
        life: 0.5,
        maxLife: 0.5,
        color: '#FFD700',
        size: 3 + Math.random() * 2,
      });
    }

    if (newCarryHoney >= bee.maxCarry || flower.honeyAmount <= 0) {
      return {
        bee: {
          ...bee,
          carryHoney: newCarryHoney,
          state: 'returning',
          targetPosition: this.hive ? { ...this.hive.position } : null,
          targetFlowerId: null,
          path: [],
          pathIndex: 0,
        },
        honeyGained: 0,
        particles,
      };
    }

    return {
      bee: { ...bee, carryHoney: newCarryHoney },
      honeyGained: 0,
      particles,
    };
  }

  private updateReturning(bee: Bee, dt: number): Bee {
    if (!this.hive) return { ...bee, state: 'idle' };

    if (!bee.targetPosition) {
      return { ...bee, targetPosition: { ...this.hive.position }, state: 'moving' };
    }

    const dx = this.hive.position.x - bee.position.x;
    const dy = this.hive.position.y - bee.position.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 15) {
      return {
        ...bee,
        state: 'idle',
        targetPosition: null,
        path: [],
        pathIndex: 0,
      };
    }

    const moveDist = bee.speed * 1.2 * dt;
    const ratio = Math.min(1, moveDist / dist);

    return {
      ...bee,
      position: {
        x: bee.position.x + dx * ratio,
        y: bee.position.y + dy * ratio,
      },
    };
  }

  private updateScouting(bee: Bee, dt: number): { bee: Bee; discovered: string[] } {
    const discovered: string[] = [];
    const gridSize = 40;
    const scoutRange = 3;

    const centerX = Math.floor(bee.position.x / gridSize);
    const centerY = Math.floor(bee.position.y / gridSize);

    for (let dx = -scoutRange; dx <= scoutRange; dx++) {
      for (let dy = -scoutRange; dy <= scoutRange; dy++) {
        if (dx * dx + dy * dy <= scoutRange * scoutRange) {
          discovered.push(`${centerX + dx},${centerY + dy}`);
        }
      }
    }

    const nearbyFlowers = this.flowers.filter((f) => {
      const dist = Math.hypot(f.position.x - bee.position.x, f.position.y - bee.position.y);
      return dist < 80 && !f.discovered;
    });

    nearbyFlowers.forEach((flower) => {
      const idx = this.flowers.findIndex((f) => f.id === flower.id);
      if (idx !== -1) {
        this.flowers[idx] = { ...this.flowers[idx], discovered: true };
      }
    });

    let newX = bee.position.x + (Math.random() - 0.5) * 50 * dt;
    let newY = bee.position.y + (Math.random() - 0.5) * 50 * dt;

    newX = Math.max(50, Math.min(this.mapSize.width - 50, newX));
    newY = Math.max(50, Math.min(this.mapSize.height - 50, newY));

    return {
      bee: { ...bee, position: { x: newX, y: newY } },
      discovered: Array.from(discovered),
    };
  }

  private updatePatrolling(bee: Bee, dt: number): Bee {
    if (!this.hive) return bee;

    const patrolRadius = 80 + Math.random() * 40;
    bee.patrolAngle += dt * 0.8;

    const targetX = this.hive.position.x + Math.cos(bee.patrolAngle) * patrolRadius;
    const targetY = this.hive.position.y + Math.sin(bee.patrolAngle) * patrolRadius;

    const dx = targetX - bee.position.x;
    const dy = targetY - bee.position.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 2) {
      const moveDist = bee.speed * 0.5 * dt;
      const ratio = Math.min(1, moveDist / dist);
      return {
        ...bee,
        position: {
          x: bee.position.x + dx * ratio,
          y: bee.position.y + dy * ratio,
        },
      };
    }

    const nearestEnemy = this.enemies.reduce<Enemy | null>((nearest, enemy) => {
      const dist = Math.hypot(enemy.position.x - bee.position.x, enemy.position.y - bee.position.y);
      if (dist < 150) {
        if (!nearest) return enemy;
        const nearestDist = Math.hypot(nearest.position.x - bee.position.x, nearest.position.y - bee.position.y);
        return dist < nearestDist ? enemy : nearest;
      }
      return nearest;
    }, null);

    if (nearestEnemy) {
      return {
        ...bee,
        state: 'attacking',
        targetEnemyId: nearestEnemy.id,
        targetPosition: { ...nearestEnemy.position },
        path: [],
        pathIndex: 0,
      };
    }

    return bee;
  }

  private updateAttacking(bee: Bee, dt: number): { bee: Bee; damage: number; particles: Particle[] } {
    const particles: Particle[] = [];
    let damage = 0;

    const targetEnemy = this.enemies.find((e) => e.id === bee.targetEnemyId);
    
    if (!targetEnemy) {
      return {
        bee: { ...bee, state: 'patrolling', targetEnemyId: null, targetPosition: null },
        damage: 0,
        particles,
      };
    }

    const dist = Math.hypot(targetEnemy.position.x - bee.position.x, targetEnemy.position.y - bee.position.y);

    if (dist > 50) {
      const dx = targetEnemy.position.x - bee.position.x;
      const dy = targetEnemy.position.y - bee.position.y;
      const moveDist = bee.speed * dt;
      const ratio = Math.min(1, moveDist / dist);

      return {
        bee: {
          ...bee,
          position: {
            x: bee.position.x + dx * ratio,
            y: bee.position.y + dy * ratio,
          },
          targetPosition: { ...targetEnemy.position },
        },
        damage: 0,
        particles,
      };
    }

    if (bee.attackCooldown <= 0) {
      damage = 15;
      particles.push({
        id: uuidv4(),
        position: { ...bee.position },
        velocity: { x: 0, y: 0 },
        life: 0.3,
        maxLife: 0.3,
        color: 'rgba(255, 200, 0, 0.6)',
        size: 10,
      });

      return {
        bee: { ...bee, attackCooldown: 0.8 },
        damage,
        particles,
      };
    }

    return { bee, damage: 0, particles };
  }

  private updateIdle(bee: Bee, dt: number): Bee {
    if (bee.type === 'guardian') {
      return { ...bee, state: 'patrolling' };
    }

    if (bee.type === 'collector' && bee.carryHoney > 0 && this.hive) {
      return {
        ...bee,
        state: 'returning',
        targetPosition: { ...this.hive.position },
        path: [],
        pathIndex: 0,
      };
    }

    if (bee.type === 'collector' && this.flowers.length > 0 && this.hive) {
      const availableFlowers = this.flowers.filter((f) => f.honeyAmount > 0);
      if (availableFlowers.length > 0) {
        const randomFlower = availableFlowers[Math.floor(Math.random() * availableFlowers.length)];
        return {
          ...bee,
          state: 'moving',
          targetPosition: { ...randomFlower.position },
          targetFlowerId: randomFlower.id,
          path: [],
          pathIndex: 0,
        };
      }
    }

    return bee;
  }

  dispatchBee(type: BeeType, target: Position, hive: Hive, beeSlots: number): { success: boolean; bee: Bee | null; cost: number } {
    const cost = { collector: 10, scout: 15, guardian: 25 }[type];
    if (hive.honey < cost || this.bees.length >= beeSlots) {
      return { success: false, bee: null, cost: 0 };
    }

    const beeConfig = {
      collector: { health: 30, speed: 80, maxCarry: 20 },
      scout: { health: 20, speed: 120, maxCarry: 5 },
      guardian: { health: 80, speed: 60, maxCarry: 0 },
    }[type];

    const idleBee = this.bees.find((b) => b.type === type && (b.state === 'idle' || b.state === 'patrolling'));

    if (idleBee) {
      let targetFlowerId: string | null = null;
      let targetEnemyId: string | null = null;
      let targetPos = { ...target };

      if (type === 'collector') {
        const nearestFlower = this.findNearestFlower(target, 60);
        if (nearestFlower) {
          targetFlowerId = nearestFlower.id;
          targetPos = { ...nearestFlower.position };
        }
      }

      if (type === 'guardian') {
        const nearestEnemy = this.findNearestEnemy(target, 100);
        if (nearestEnemy) {
          targetEnemyId = nearestEnemy.id;
          targetPos = { ...nearestEnemy.position };
        }
      }

      const updatedBee = {
        ...idleBee,
        targetPosition: targetPos,
        state: 'moving' as const,
        path: [],
        pathIndex: 0,
        targetFlowerId,
        targetEnemyId,
      };

      this.bees = this.bees.map((b) => (b.id === idleBee.id ? updatedBee : b));
      return { success: true, bee: updatedBee, cost: 0 };
    }

    const newBee: Bee = {
      id: uuidv4(),
      type,
      position: { ...hive.position },
      targetPosition: { ...target },
      state: 'moving',
      health: beeConfig.health,
      maxHealth: beeConfig.health,
      path: [],
      pathIndex: 0,
      speed: beeConfig.speed,
      carryHoney: 0,
      maxCarry: beeConfig.maxCarry,
      targetFlowerId: null,
      targetEnemyId: null,
      attackCooldown: 0,
      patrolAngle: Math.random() * Math.PI * 2,
    };

    if (type === 'collector') {
      const nearestFlower = this.findNearestFlower(target, 60);
      if (nearestFlower) {
        newBee.targetFlowerId = nearestFlower.id;
        newBee.targetPosition = { ...nearestFlower.position };
      }
    }

    if (type === 'guardian') {
      const nearestEnemy = this.findNearestEnemy(target, 100);
      if (nearestEnemy) {
        newBee.targetEnemyId = nearestEnemy.id;
        newBee.targetPosition = { ...nearestEnemy.position };
      }
    }

    this.bees.push(newBee);
    return { success: true, bee: newBee, cost };
  }

  private findNearestFlower(pos: Position, maxDist: number): Flower | null {
    let nearest: Flower | null = null;
    let nearestDist = maxDist;

    for (const flower of this.flowers) {
      const dist = Math.hypot(flower.position.x - pos.x, flower.position.y - pos.y);
      if (dist < nearestDist && flower.honeyAmount > 0) {
        nearest = flower;
        nearestDist = dist;
      }
    }

    return nearest;
  }

  private findNearestEnemy(pos: Position, maxDist: number): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDist = maxDist;

    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.position.x - pos.x, enemy.position.y - pos.y);
      if (dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    }

    return nearest;
  }
}
