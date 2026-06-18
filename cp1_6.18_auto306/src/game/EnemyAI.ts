import { ShadowGuard, DungeonMap, Room } from '@/types';

export interface GuardEventCallbacks {
  onPlayerCaught: (guard: ShadowGuard) => void;
  onModeChange: (guard: ShadowGuard, mode: 'patrol' | 'chase') => void;
}

export class EnemyAI {
  private guards: ShadowGuard[] = [];
  private map: DungeonMap | null = null;
  private callbacks: GuardEventCallbacks;
  private guardCount: number = 2;

  constructor(callbacks: GuardEventCallbacks, guardCount: number = 2) {
    this.callbacks = callbacks;
    this.guardCount = guardCount;
  }

  setMap(map: DungeonMap): void {
    this.map = map;
  }

  generateGuards(guardRooms: Room[]): ShadowGuard[] {
    this.guards = [];

    for (let i = 0; i < this.guardCount && i < guardRooms.length; i++) {
      const room = guardRooms[i];
      const patrolPath = this.createPatrolPath(room);
      const guard: ShadowGuard = {
        id: i,
        x: patrolPath[0].x,
        y: patrolPath[0].y,
        mode: 'patrol',
        patrolPath,
        patrolIndex: 0,
        speed: 0.5,
        stunTimer: 0,
        trail: [],
      };
      this.guards.push(guard);
    }

    return this.guards;
  }

  update(deltaTime: number, playerX: number, playerY: number): void {
    for (const guard of this.guards) {
      if (guard.stunTimer > 0) {
        guard.stunTimer -= deltaTime;
        continue;
      }

      this.updateTrail(guard);

      const distanceToPlayer = Math.sqrt(
        Math.pow(guard.x - playerX, 2) + Math.pow(guard.y - playerY, 2)
      );

      const playerInRoom = this.isPlayerInGuardRoom(guard, playerX, playerY);

      if (playerInRoom && guard.mode === 'patrol') {
        guard.mode = 'chase';
        guard.speed = 1.5;
        if (this.callbacks.onModeChange) {
          this.callbacks.onModeChange(guard, 'chase');
        }
      } else if (!playerInRoom && guard.mode === 'chase') {
        guard.mode = 'patrol';
        guard.speed = 0.5;
        if (this.callbacks.onModeChange) {
          this.callbacks.onModeChange(guard, 'patrol');
        }
      }

      if (guard.mode === 'patrol') {
        this.patrol(guard, deltaTime);
      } else {
        this.chase(guard, playerX, playerY, deltaTime);
      }

      if (distanceToPlayer < 0.6) {
        if (this.callbacks.onPlayerCaught) {
          this.callbacks.onPlayerCaught(guard);
        }
        this.stunGuard(guard);
      }
    }
  }

  private isPlayerInGuardRoom(guard: ShadowGuard, playerX: number, playerY: number): boolean {
    if (!this.map) return false;

    const detectionRange = 6;
    const distance = Math.sqrt(
      Math.pow(guard.x - playerX, 2) + Math.pow(guard.y - playerY, 2)
    );
    return distance < detectionRange;
  }

  private patrol(guard: ShadowGuard, deltaTime: number): void {
    if (guard.patrolPath.length < 2) return;

    const target = guard.patrolPath[guard.patrolIndex];
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.1) {
      guard.patrolIndex = (guard.patrolIndex + 1) % guard.patrolPath.length;
    } else {
      const moveDistance = guard.speed * deltaTime;
      guard.x += (dx / distance) * moveDistance;
      guard.y += (dy / distance) * moveDistance;
    }
  }

  private chase(guard: ShadowGuard, playerX: number, playerY: number, deltaTime: number): void {
    const dx = playerX - guard.x;
    const dy = playerY - guard.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.1) {
      const moveDistance = guard.speed * deltaTime;
      const newX = guard.x + (dx / distance) * moveDistance;
      const newY = guard.y + (dy / distance) * moveDistance;

      if (this.isWalkable(newX, newY)) {
        guard.x = newX;
        guard.y = newY;
      } else if (this.isWalkable(newX, guard.y)) {
        guard.x = newX;
      } else if (this.isWalkable(guard.x, newY)) {
        guard.y = newY;
      }
    }
  }

  private isWalkable(x: number, y: number): boolean {
    if (!this.map) return false;
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    if (tileX < 0 || tileX >= this.map.width || tileY < 0 || tileY >= this.map.height) {
      return false;
    }
    const tile = this.map.tiles[tileY][tileX];
    return tile.type !== 'wall';
  }

  private updateTrail(guard: ShadowGuard): void {
    guard.trail.unshift({ x: guard.x, y: guard.y, alpha: 0.3 });

    const maxTrailLength = 5;
    if (guard.trail.length > maxTrailLength) {
      guard.trail.pop();
    }

    for (let i = 0; i < guard.trail.length; i++) {
      guard.trail[i].alpha = 0.3 * (1 - i / guard.trail.length);
    }
  }

  stunGuard(guard: ShadowGuard): void {
    guard.stunTimer = 2;
    guard.mode = 'patrol';
    guard.speed = 0.5;
  }

  getGuards(): ShadowGuard[] {
    return this.guards;
  }

  reset(): void {
    this.guards = [];
  }

  private createPatrolPath(room: Room): { x: number; y: number }[] {
    if (!this.map) return [];

    const path: { x: number; y: number }[] = [];

    const corners = [
      { x: room.x + 1, y: room.y + 1 },
      { x: room.x + room.width - 2, y: room.y + 1 },
      { x: room.x + room.width - 2, y: room.y + room.height - 2 },
      { x: room.x + 1, y: room.y + room.height - 2 },
    ];

    for (const corner of corners) {
      if (corner.x > 0 && corner.x < this.map.width && corner.y > 0 && corner.y < this.map.height) {
        path.push({ x: corner.x + 0.5, y: corner.y + 0.5 });
      }
    }

    if (path.length < 2) {
      path.push({ x: room.centerX, y: room.centerY });
      path.push({ x: room.centerX + 1, y: room.centerY });
    }

    return path;
  }
}
