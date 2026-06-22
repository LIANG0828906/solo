import * as THREE from 'three';

export type Faction = 'wu' | 'wei' | 'shu';
export type BattlePhase = 'march' | 'engage' | 'retreat';
export type UnitState = 'idle' | 'march' | 'engage' | 'retreat' | 'dead';

export interface Unit {
  id: string;
  name: string;
  type: 'ship' | 'infantry' | 'cavalry';
  faction: Faction;
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
  attack: number;
  speed: number;
  state: UnitState;
  mesh: THREE.Group;
  target: THREE.Vector3 | null;
  enemy: Unit | null;
  damageTimer: number;
  opacity: number;
}

export interface UnitManager {
  getAllUnits(): Unit[];
  getAliveUnits(): Unit[];
  getInitialCount(faction: Faction): number;
}

export interface BattleStats {
  wu: FactionStats;
  wei: FactionStats;
  shu: FactionStats;
}

export interface FactionStats {
  initial: number;
  remaining: number;
  loss: number;
  winRate: number;
}

export interface TreeCollider {
  position: THREE.Vector3;
  radius: number;
}

export class BattleManager {
  currentPhase: BattlePhase = 'march';
  timeSpeed: number = 1.0;
  battleStartTime: number;
  isBattleOver: boolean = false;
  winner: Faction | null = null;
  onBattleOverCallback: ((stats: BattleStats) => void) | null = null;
  onDamageCallback: ((unit: Unit, damage: number) => void) | null = null;

  private unitManager: UnitManager;
  private battleElapsedTime: number = 0;
  private retreatingFaction: Faction | null = null;

  constructor(unitManager: UnitManager) {
    this.unitManager = unitManager;
    this.battleStartTime = performance.now();
  }

  setPhase(phase: BattlePhase): void {
    this.currentPhase = phase;
    if (phase === 'retreat') {
      const aliveUnits = this.unitManager.getAliveUnits();
      const factionCounts: Record<Faction, number> = { wu: 0, wei: 0, shu: 0 };
      aliveUnits.forEach((u) => {
        factionCounts[u.faction]++;
      });
      const factions: Faction[] = ['wu', 'wei', 'shu'];
      let minCount = Infinity;
      factions.forEach((f) => {
        if (factionCounts[f] > 0 && factionCounts[f] < minCount) {
          minCount = factionCounts[f];
          this.retreatingFaction = f;
        }
      });
      aliveUnits.forEach((u) => {
        if (u.faction === this.retreatingFaction) {
          u.state = 'retreat';
          u.target = this.getFactionBoundary(u.faction);
        } else {
          u.state = 'idle';
        }
      });
    }
  }

  setTimeSpeed(speed: number): void {
    this.timeSpeed = Math.max(0.1, Math.min(5.0, speed));
  }

  setBattleOverCallback(cb: (stats: BattleStats) => void): void {
    this.onBattleOverCallback = cb;
  }

  setDamageCallback(cb: (unit: Unit, damage: number) => void): void {
    this.onDamageCallback = cb;
  }

  update(
    delta: number,
    terrainHeightFn: (x: number, z: number) => number,
    treeColliders: TreeCollider[]
  ): void {
    if (this.isBattleOver) return;

    const adjustedDelta = delta * this.timeSpeed;
    this.battleElapsedTime += adjustedDelta;

    const allUnits = this.unitManager.getAllUnits();
    const aliveUnits = allUnits.filter((u) => u.state !== 'dead');

    switch (this.currentPhase) {
      case 'march':
        this.updateMarchPhase(aliveUnits, adjustedDelta, terrainHeightFn, treeColliders);
        break;
      case 'engage':
        this.updateEngagePhase(aliveUnits, adjustedDelta, terrainHeightFn, treeColliders);
        break;
      case 'retreat':
        this.updateRetreatPhase(aliveUnits, adjustedDelta, terrainHeightFn);
        break;
    }

    this.checkBattleOver();
  }

  private updateMarchPhase(
    units: Unit[],
    delta: number,
    terrainHeightFn: (x: number, z: number) => number,
    treeColliders: TreeCollider[]
  ): void {
    units.forEach((unit) => {
      if (unit.state === 'dead') return;
      unit.state = 'march';

      const enemyDir = this.getEnemyDirection(unit.faction);
      let moveDir = enemyDir.clone();

      const nextPos = unit.position.clone().add(moveDir.clone().multiplyScalar(unit.speed * delta));
      if (this.checkCollision(nextPos, treeColliders)) {
        const sideOffset = new THREE.Vector3(-moveDir.z, 0, moveDir.x).normalize();
        const testPos1 = unit.position
          .clone()
          .add(sideOffset.clone().multiplyScalar(unit.speed * delta));
        const testPos2 = unit.position
          .clone()
          .add(sideOffset.multiplyScalar(-1).multiplyScalar(unit.speed * delta));
        if (!this.checkCollision(testPos1, treeColliders)) {
          moveDir = new THREE.Vector3(-moveDir.z, 0, moveDir.x).normalize();
        } else if (!this.checkCollision(testPos2, treeColliders)) {
          moveDir = new THREE.Vector3(moveDir.z, 0, -moveDir.x).normalize();
        } else {
          moveDir = new THREE.Vector3(-moveDir.z, 0, moveDir.x).normalize();
        }
      }

      unit.position.add(moveDir.multiplyScalar(unit.speed * delta));
      unit.position.y = terrainHeightFn(unit.position.x, unit.position.z);

      if (moveDir.lengthSq() > 0.0001) {
        unit.mesh.rotation.y = Math.atan2(moveDir.x, moveDir.z);
      }
      unit.mesh.position.copy(unit.position);
    });
  }

  private updateEngagePhase(
    units: Unit[],
    delta: number,
    terrainHeightFn: (x: number, z: number) => number,
    treeColliders: TreeCollider[]
  ): void {
    units.forEach((unit) => {
      if (unit.state === 'dead') return;

      if (!unit.enemy || unit.enemy.state === 'dead') {
        unit.enemy = this.findNearestEnemy(unit, units);
      }

      if (unit.enemy) {
        const dist = unit.position.distanceTo(unit.enemy.position);
        if (dist < 5) {
          unit.state = 'engage';
          unit.damageTimer = (unit.damageTimer || 0) + delta;
          if (unit.damageTimer >= 1.0) {
            unit.damageTimer = 0;
            const baseDamage = unit.attack;
            const variance = baseDamage * 0.15;
            const damage = baseDamage + (Math.random() * 2 - 1) * variance;
            unit.enemy.health -= damage;
            if (this.onDamageCallback) {
              this.onDamageCallback(unit.enemy, damage);
            }
            if (unit.enemy.health <= 0) {
              unit.enemy.health = 0;
              unit.enemy.state = 'dead';
              unit.enemy.mesh.visible = false;
              unit.enemy = null;
            }
          }
          const toEnemy = unit.enemy.position.clone().sub(unit.position).normalize();
          if (toEnemy.lengthSq() > 0.0001) {
            unit.mesh.rotation.y = Math.atan2(toEnemy.x, toEnemy.z);
          }
        } else {
          unit.state = 'march';
          const toEnemy = unit.enemy.position.clone().sub(unit.position).normalize();
          let moveDir = toEnemy;
          const nextPos = unit.position.clone().add(moveDir.clone().multiplyScalar(unit.speed * delta));
          if (this.checkCollision(nextPos, treeColliders)) {
            moveDir = new THREE.Vector3(-moveDir.z, 0, moveDir.x).normalize();
          }
          unit.position.add(moveDir.multiplyScalar(unit.speed * delta));
          unit.position.y = terrainHeightFn(unit.position.x, unit.position.z);
          if (toEnemy.lengthSq() > 0.0001) {
            unit.mesh.rotation.y = Math.atan2(toEnemy.x, toEnemy.z);
          }
          unit.mesh.position.copy(unit.position);
        }
      } else {
        unit.state = 'idle';
      }
    });
  }

  private updateRetreatPhase(
    units: Unit[],
    delta: number,
    terrainHeightFn: (x: number, z: number) => number
  ): void {
    units.forEach((unit) => {
      if (unit.state === 'dead') return;

      if (unit.state === 'retreat') {
        unit.opacity = Math.max(0, (unit.opacity ?? 1) - delta / 3);
        unit.mesh.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => {
                (mat as THREE.Material & { transparent: boolean; opacity: number }).transparent = true;
                (mat as THREE.Material & { transparent: boolean; opacity: number }).opacity = unit.opacity;
              });
            } else if (mesh.material) {
              const mat = mesh.material as THREE.Material & { transparent: boolean; opacity: number };
              mat.transparent = true;
              mat.opacity = unit.opacity;
            }
          }
        });

        if (unit.target) {
          const toTarget = unit.target.clone().sub(unit.position).normalize();
          unit.position.add(toTarget.multiplyScalar(unit.speed * 1.5 * delta));
          unit.position.y = terrainHeightFn(unit.position.x, unit.position.z);
          if (toTarget.lengthSq() > 0.0001) {
            unit.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);
          }
          unit.mesh.position.copy(unit.position);
        }

        if (unit.opacity <= 0) {
          unit.state = 'dead';
          unit.mesh.visible = false;
        }
      }
    });
  }

  private getEnemyDirection(faction: Faction): THREE.Vector3 {
    switch (faction) {
      case 'wu':
        return new THREE.Vector3(1, 0, 0);
      case 'wei':
        return new THREE.Vector3(0, 0, -1);
      case 'shu':
        return new THREE.Vector3(-1, 0, 0);
      default:
        return new THREE.Vector3(0, 0, 0);
    }
  }

  checkBattleOver(): void {
    if (this.isBattleOver) return;

    const aliveUnits = this.unitManager.getAliveUnits();
    const factionCounts: Record<Faction, number> = { wu: 0, wei: 0, shu: 0 };
    aliveUnits.forEach((u) => {
      if (u.state !== 'dead') {
        factionCounts[u.faction]++;
      }
    });

    const aliveFactions: Faction[] = [];
    const factions: Faction[] = ['wu', 'wei', 'shu'];
    factions.forEach((f) => {
      if (factionCounts[f] > 0) {
        aliveFactions.push(f);
      }
    });

    if (aliveFactions.length <= 1) {
      this.isBattleOver = true;
      this.winner = aliveFactions.length === 1 ? aliveFactions[0] : null;
      if (this.onBattleOverCallback) {
        this.onBattleOverCallback(this.calculateStats());
      }
    }
  }

  getBattleDuration(): number {
    return this.battleElapsedTime;
  }

  calculateStats(): BattleStats {
    const aliveUnits = this.unitManager.getAliveUnits();
    const factionCounts: Record<Faction, number> = { wu: 0, wei: 0, shu: 0 };
    aliveUnits.forEach((u) => {
      if (u.state !== 'dead') {
        factionCounts[u.faction]++;
      }
    });

    const factions: Faction[] = ['wu', 'wei', 'shu'];
    const result: BattleStats = { wu: {} as FactionStats, wei: {} as FactionStats, shu: {} as FactionStats };

    factions.forEach((f) => {
      const initial = this.unitManager.getInitialCount(f);
      const remaining = factionCounts[f];
      const loss = initial - remaining;
      const totalAlive = factions.reduce((sum, fact) => sum + factionCounts[fact], 0);
      const winRate = totalAlive > 0 && this.winner === f ? 1 : totalAlive > 0 ? 0 : 0;
      result[f] = { initial, remaining, loss, winRate };
    });

    return result;
  }

  getFactionBoundary(faction: Faction): THREE.Vector3 {
    switch (faction) {
      case 'wu':
        return new THREE.Vector3(-90, 0, 0);
      case 'wei':
        return new THREE.Vector3(0, 0, 90);
      case 'shu':
        return new THREE.Vector3(90, 0, 0);
      default:
        return new THREE.Vector3(0, 0, 0);
    }
  }

  findNearestEnemy(unit: Unit, allUnits: Unit[]): Unit | null {
    let nearest: Unit | null = null;
    let minDist = Infinity;
    allUnits.forEach((u) => {
      if (u.faction !== unit.faction && u.state !== 'dead') {
        const dist = unit.position.distanceTo(u.position);
        if (dist < minDist) {
          minDist = dist;
          nearest = u;
        }
      }
    });
    return nearest;
  }

  checkCollision(position: THREE.Vector3, colliders: TreeCollider[]): boolean {
    for (const collider of colliders) {
      const dx = position.x - collider.position.x;
      const dz = position.z - collider.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < collider.radius * collider.radius) {
        return true;
      }
    }
    return false;
  }

  isBattleFinished(): boolean {
    return this.isBattleOver;
  }
}
