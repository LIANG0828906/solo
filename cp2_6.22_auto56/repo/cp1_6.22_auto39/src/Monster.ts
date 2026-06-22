import { TILE_SIZE, Position, TileType, MAP_WIDTH, MAP_HEIGHT } from './types';
import { GameMap } from './Map';
import { Player } from './Player';
import { audioManager } from './Audio';

enum MonsterState {
  PATROL,
  CHASE,
  ATTACK_COOLDOWN,
  STUNNED,
  DYING
}

export class Monster {
  private gridX: number;
  private gridY: number;
  private renderX: number;
  private renderY: number;
  private targetX: number;
  private targetY: number;
  private health: number = 3;
  private maxHealth: number = 3;
  private state: MonsterState = MonsterState.PATROL;
  private patrolPath: Position[] = [];
  private patrolIndex: number = 0;
  private patrolDirection: number = 1;
  private moveTimer: number = 0;
  private moveCooldown: number = 500;
  private attackCooldownTimer: number = 0;
  private stunTimer: number = 0;
  private dyingTimer: number = 0;
  private flashCount: number = 0;
  private moving: boolean = false;
  private moveProgress: number = 0;
  private rotation: number = 0;
  private shakeOffset: Position = { x: 0, y: 0 };
  private opacity: number = 1;

  constructor(spawn: Position) {
    this.gridX = spawn.x;
    this.gridY = spawn.y;
    this.renderX = spawn.x * TILE_SIZE;
    this.renderY = spawn.y * TILE_SIZE;
    this.targetX = this.renderX;
    this.targetY = this.renderY;
    this.generatePatrolPath();
  }

  private generatePatrolPath(): void {
    this.patrolPath = [{ x: this.gridX, y: this.gridY }];
    
    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ];
    
    const pathLength = Math.floor(Math.random() * 2) + 3;
    let current = { x: this.gridX, y: this.gridY };
    let lastDir = directions[Math.floor(Math.random() * directions.length)];
    
    for (let i = 0; i < pathLength; i++) {
      const validDirs = directions.filter(d => {
        const nx = current.x + d.x;
        const ny = current.y + d.y;
        return nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT;
      });
      
      if (validDirs.length === 0) break;
      
      let dir = validDirs[Math.floor(Math.random() * validDirs.length)];
      if (Math.random() > 0.3) {
        const preferred = validDirs.find(d => d.x === lastDir.x && d.y === lastDir.y);
        if (preferred) dir = preferred;
      }
      
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      
      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
        this.patrolPath.push({ x: nx, y: ny });
        current = { x: nx, y: ny };
        lastDir = dir;
      }
    }
  }

  update(deltaTime: number, map: GameMap, player: Player): { damagedPlayer: boolean; screenShake: boolean } {
    let result = { damagedPlayer: false, screenShake: false };

    switch (this.state) {
      case MonsterState.PATROL:
        this.updatePatrol(deltaTime, map);
        this.checkChaseTrigger(map, player);
        break;
      
      case MonsterState.CHASE:
        this.updateChase(deltaTime, map, player);
        if (this.checkPlayerCollision(player)) {
          result.damagedPlayer = true;
          result.screenShake = true;
          player.takeDamage(20);
          this.state = MonsterState.ATTACK_COOLDOWN;
          this.attackCooldownTimer = 1000;
        }
        break;
      
      case MonsterState.ATTACK_COOLDOWN:
        this.attackCooldownTimer -= deltaTime;
        if (this.attackCooldownTimer <= 0) {
          this.state = MonsterState.CHASE;
        }
        break;
      
      case MonsterState.STUNNED:
        this.stunTimer -= deltaTime;
        this.rotation += 0.3;
        if (this.stunTimer <= 0) {
          this.rotation = 0;
          if (this.health <= 0) {
            this.state = MonsterState.DYING;
            this.dyingTimer = 600;
            this.flashCount = 0;
            audioManager.playMonsterDefeat();
          } else {
            this.state = MonsterState.CHASE;
          }
        }
        break;
      
      case MonsterState.DYING:
        this.dyingTimer -= deltaTime;
        this.flashCount = Math.floor((600 - this.dyingTimer) / 100);
        this.opacity = Math.max(0, this.dyingTimer / 600);
        break;
    }

    if (this.moving) {
      this.moveProgress += deltaTime / 200;
      if (this.moveProgress >= 1) {
        this.moveProgress = 1;
        this.moving = false;
        this.renderX = this.targetX;
        this.renderY = this.targetY;
        this.gridX = Math.round(this.targetX / TILE_SIZE);
        this.gridY = Math.round(this.targetY / TILE_SIZE);
      } else {
        const easeProgress = this.easeOutQuad(this.moveProgress);
        this.renderX = this.lerp(this.targetX - TILE_SIZE * this.getMoveDirection().x, this.targetX, easeProgress);
        this.renderY = this.lerp(this.targetY - TILE_SIZE * this.getMoveDirection().y, this.targetY, easeProgress);
      }
    }

    if (this.state !== MonsterState.DYING) {
      this.shakeOffset.x = (Math.random() - 0.5) * (this.state === MonsterState.ATTACK_COOLDOWN ? 3 : 0);
      this.shakeOffset.y = (Math.random() - 0.5) * (this.state === MonsterState.ATTACK_COOLDOWN ? 3 : 0);
    }

    return result;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  private getMoveDirection(): Position {
    const dx = Math.round((this.targetX - this.renderX) / TILE_SIZE);
    const dy = Math.round((this.targetY - this.renderY) / TILE_SIZE);
    return { x: Math.sign(dx), y: Math.sign(dy) };
  }

  private updatePatrol(deltaTime: number, map: GameMap): void {
    this.moveTimer += deltaTime;
    if (this.moveTimer >= this.moveCooldown * 2) {
      this.moveTimer = 0;
      
      let nextIndex = this.patrolIndex + this.patrolDirection;
      if (nextIndex >= this.patrolPath.length || nextIndex < 0) {
        this.patrolDirection *= -1;
        nextIndex = this.patrolIndex + this.patrolDirection;
      }
      
      if (nextIndex >= 0 && nextIndex < this.patrolPath.length) {
        const target = this.patrolPath[nextIndex];
        const tile = map.getTileAt(target.x, target.y);
        if (tile !== TileType.WALL) {
          this.moveTo(target);
          this.patrolIndex = nextIndex;
        } else {
          this.patrolDirection *= -1;
        }
      }
    }
  }

  private checkChaseTrigger(map: GameMap, player: Player): void {
    const playerPos = player.getPosition();
    if (map.isInSameRoom({ x: this.gridX, y: this.gridY }, playerPos)) {
      this.state = MonsterState.CHASE;
      this.moveTimer = 0;
    }
  }

  private updateChase(deltaTime: number, map: GameMap, player: Player): void {
    this.moveTimer += deltaTime;
    if (this.moveTimer >= this.moveCooldown) {
      this.moveTimer = 0;
      
      const playerPos = player.getPosition();
      const dx = playerPos.x - this.gridX;
      const dy = playerPos.y - this.gridY;
      
      let moves: Position[] = [];
      if (Math.abs(dx) > Math.abs(dy)) {
        moves = [
          { x: Math.sign(dx), y: 0 },
          { x: 0, y: Math.sign(dy) }
        ];
      } else {
        moves = [
          { x: 0, y: Math.sign(dy) },
          { x: Math.sign(dx), y: 0 }
        ];
      }
      
      for (const move of moves) {
        const nx = this.gridX + move.x;
        const ny = this.gridY + move.y;
        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
          const tile = map.getTileAt(nx, ny);
          if (tile !== TileType.WALL) {
            this.moveTo({ x: nx, y: ny });
            break;
          }
        }
      }
    }
  }

  private moveTo(pos: Position): void {
    if (this.moving) return;
    this.targetX = pos.x * TILE_SIZE;
    this.targetY = pos.y * TILE_SIZE;
    this.moving = true;
    this.moveProgress = 0;
  }

  private checkPlayerCollision(player: Player): boolean {
    const playerPos = player.getPosition();
    return this.gridX === playerPos.x && this.gridY === playerPos.y;
  }

  takeDamage(knockbackDir: Position, map: GameMap): void {
    this.health--;
    this.state = MonsterState.STUNNED;
    this.stunTimer = 500;
    this.rotation = 0;
    
    const nx = this.gridX + knockbackDir.x;
    const ny = this.gridY + knockbackDir.y;
    if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
      const tile = map.getTileAt(nx, ny);
      if (tile !== TileType.WALL) {
        this.gridX = nx;
        this.gridY = ny;
        this.renderX = nx * TILE_SIZE;
        this.renderY = ny * TILE_SIZE;
        this.targetX = this.renderX;
        this.targetY = this.renderY;
      }
    }
  }

  getPosition(): Position {
    return { x: this.gridX, y: this.gridY };
  }

  getRenderPosition(): Position {
    return {
      x: this.renderX + this.shakeOffset.x,
      y: this.renderY + this.shakeOffset.y
    };
  }

  getRotation(): number {
    return this.rotation;
  }

  getOpacity(): number {
    return this.opacity;
  }

  isFlashing(): boolean {
    if (this.state === MonsterState.STUNNED) {
      return Math.floor(this.stunTimer / 100) % 2 === 0;
    }
    if (this.state === MonsterState.DYING) {
      return this.flashCount % 2 === 0;
    }
    return false;
  }

  isDying(): boolean {
    return this.state === MonsterState.DYING;
  }

  isDead(): boolean {
    return this.state === MonsterState.DYING && this.dyingTimer <= 0;
  }

  isStunned(): boolean {
    return this.state === MonsterState.STUNNED;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }
}
