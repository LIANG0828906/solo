import { Entity } from './types';

export interface CollisionEvent {
  a: Entity;
  b: Entity;
  type: string;
}

export class CollisionDetector {
  static checkRectCollision(a: Entity, b: Entity): boolean {
    return (
      a.x - a.width / 2 < b.x + b.width / 2 &&
      a.x + a.width / 2 > b.x - b.width / 2 &&
      a.y - a.height / 2 < b.y + b.height / 2 &&
      a.y + a.height / 2 > b.y - b.height / 2
    );
  }

  static checkDistanceCollision(a: Entity, b: Entity, distance: number): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < distance;
  }

  static detectCollisions(
    player: Entity,
    enemies: Entity[],
    playerBullets: Entity[],
    enemyBullets: Entity[]
  ): CollisionEvent[] {
    const events: CollisionEvent[] = [];

    for (const bullet of playerBullets) {
      for (const enemy of enemies) {
        if (this.checkRectCollision(bullet, enemy)) {
          events.push({ a: bullet, b: enemy, type: 'bullet_enemy' });
        }
      }
    }

    for (const bullet of enemyBullets) {
      if (this.checkRectCollision(bullet, player)) {
        events.push({ a: bullet, b: player, type: 'enemyBullet_player' });
      }
    }

    for (const enemy of enemies) {
      if (this.checkRectCollision(enemy, player)) {
        events.push({ a: enemy, b: player, type: 'enemy_player' });
      }
    }

    return events;
  }
}
