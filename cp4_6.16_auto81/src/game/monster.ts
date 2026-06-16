import { Position } from '../map/types';

export type MonsterType = 'slime' | 'skeleton' | 'bat';

export type MonsterState = 'patrol' | 'chase' | 'dead';

export interface Monster {
  id: number;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  roomX: number;
  roomY: number;
  hp: number;
  maxHp: number;
  attack: number;
  type: MonsterType;
  state: MonsterState;
  patrolPath: Position[];
  patrolIndex: number;
  patrolDirection: 1 | -1;
  moveSpeed: number;
  moveProgress: number;
  moveFromX: number;
  moveFromY: number;
  moveToX: number;
  moveToY: number;
  animFrame: 0 | 1;
  deathTimer: number;
  hurtTimer: number;
  damageText: number;
  damageTextTimer: number;
  isAttacking: boolean;
  attackTimer: number;
}

const PLAYER_MOVE_DURATION = 0.3;
const MONSTER_SPEED_RATIO = 0.7;
const MOVE_DURATION = PLAYER_MOVE_DURATION / MONSTER_SPEED_RATIO;
const ANIM_FRAME_DURATION = 0.15;

let monsterIdCounter = 0;

export function createMonster(
  gridX: number,
  gridY: number,
  roomX: number,
  roomY: number,
  tileSize: number,
  type: MonsterType
): Monster {
  const x = gridX * tileSize;
  const y = gridY * tileSize;

  let hp: number;
  let attack: number;

  switch (type) {
    case 'slime':
      hp = 3;
      attack = 1;
      break;
    case 'skeleton':
      hp = 5;
      attack = 2;
      break;
    case 'bat':
      hp = 2;
      attack = 1;
      break;
  }

  return {
    id: monsterIdCounter++,
    x,
    y,
    gridX,
    gridY,
    roomX,
    roomY,
    hp,
    maxHp: hp,
    attack,
    type,
    state: 'patrol',
    patrolPath: [],
    patrolIndex: 0,
    patrolDirection: 1,
    moveSpeed: MONSTER_SPEED_RATIO,
    moveProgress: 0,
    moveFromX: x,
    moveFromY: y,
    moveToX: x,
    moveToY: y,
    animFrame: 0,
    deathTimer: 0,
    hurtTimer: 0,
    damageText: 0,
    damageTextTimer: 0,
    isAttacking: false,
    attackTimer: 0,
  };
}

export function generatePatrolPath(
  room: { gridX: number; gridY: number; width: number; height: number },
  monster: Monster
): Position[] {
  const path: Position[] = [];
  const pointsCount = Math.floor(Math.random() * 3) + 4;
  const isVertical = Math.random() < 0.5;

  if (isVertical) {
    const fixedX = monster.gridX;
    const startY = room.gridY + 1;
    const endY = room.gridY + room.height - 2;
    const stepY = Math.max(1, Math.floor((endY - startY) / (pointsCount - 1)));

    for (let i = 0; i < pointsCount; i++) {
      const y = Math.min(endY, startY + i * stepY);
      path.push({ x: fixedX, y });
    }
  } else {
    const fixedY = monster.gridY;
    const startX = room.gridX + 1;
    const endX = room.gridX + room.width - 2;
    const stepX = Math.max(1, Math.floor((endX - startX) / (pointsCount - 1)));

    for (let i = 0; i < pointsCount; i++) {
      const x = Math.min(endX, startX + i * stepX);
      path.push({ x, y: fixedY });
    }
  }

  return path;
}

function startMonsterMove(
  monster: Monster,
  targetGridX: number,
  targetGridY: number,
  tileSize: number
): void {
  monster.moveProgress = 0;
  monster.moveFromX = monster.x;
  monster.moveFromY = monster.y;
  monster.moveToX = targetGridX * tileSize;
  monster.moveToY = targetGridY * tileSize;
  monster.gridX = targetGridX;
  monster.gridY = targetGridY;
}

export function updateMonster(
  monster: Monster,
  player: { gridX: number; gridY: number; x: number; y: number },
  deltaTime: number,
  tiles: number[][],
  isWalkable: (gridX: number, gridY: number, tiles: number[][]) => boolean
): boolean {
  if (monster.state === 'dead') {
    monster.deathTimer -= deltaTime;
    return monster.deathTimer <= 0;
  }

  const tileSize = monster.moveToX - monster.moveFromX || monster.x;
  const actualTileSize = tileSize > 0 ? tileSize : monster.x / monster.gridX || 1;

  const dx = player.gridX - monster.gridX;
  const dy = player.gridY - monster.gridY;
  const distance = Math.abs(dx) + Math.abs(dy);

  if (distance <= 5 && monster.state !== 'chase') {
    monster.state = 'chase';
  } else if (distance > 8 && monster.state !== 'patrol') {
    monster.state = 'patrol';
    monster.patrolIndex = 0;
    monster.patrolDirection = 1;
  }

  const isMoving = monster.moveProgress < 1 && (monster.moveFromX !== monster.moveToX || monster.moveFromY !== monster.moveToY);

  if (!isMoving) {
    if (monster.state === 'patrol' && monster.patrolPath.length > 0) {
      const target = monster.patrolPath[monster.patrolIndex];
      if (target) {
        startMonsterMove(monster, target.x, target.y, actualTileSize);

        monster.patrolIndex += monster.patrolDirection;
        if (monster.patrolIndex >= monster.patrolPath.length) {
          monster.patrolDirection = -1;
          monster.patrolIndex = monster.patrolPath.length - 2;
        } else if (monster.patrolIndex < 0) {
          monster.patrolDirection = 1;
          monster.patrolIndex = 1;
        }
      }
    } else if (monster.state === 'chase') {
      let targetX = monster.gridX;
      let targetY = monster.gridY;

      if (Math.abs(dx) > Math.abs(dy)) {
        const nextX = monster.gridX + Math.sign(dx);
        if (isWalkable(nextX, monster.gridY, tiles)) {
          targetX = nextX;
        } else {
          const nextY = monster.gridY + Math.sign(dy);
          if (isWalkable(monster.gridX, nextY, tiles)) {
            targetY = nextY;
          }
        }
      } else {
        const nextY = monster.gridY + Math.sign(dy);
        if (isWalkable(monster.gridX, nextY, tiles)) {
          targetY = nextY;
        } else {
          const nextX = monster.gridX + Math.sign(dx);
          if (isWalkable(nextX, monster.gridY, tiles)) {
            targetX = nextX;
          }
        }
      }

      if (targetX !== monster.gridX || targetY !== monster.gridY) {
        startMonsterMove(monster, targetX, targetY, actualTileSize);
      }
    }
  } else {
    monster.moveProgress += deltaTime / MOVE_DURATION;

    if (monster.moveProgress >= 1) {
      monster.moveProgress = 1;
      monster.x = monster.moveToX;
      monster.y = monster.moveToY;
    } else {
      monster.x = monster.moveFromX + (monster.moveToX - monster.moveFromX) * monster.moveProgress;
      monster.y = monster.moveFromY + (monster.moveToY - monster.moveFromY) * monster.moveProgress;
    }
  }

  monster.animFrame = Math.floor(Date.now() / (ANIM_FRAME_DURATION * 1000)) % 2 === 0 ? 0 : 1;

  if (monster.attackTimer > 0) {
    monster.attackTimer -= deltaTime;
    if (monster.attackTimer <= 0) {
      monster.isAttacking = false;
    }
  }

  if (monster.hurtTimer > 0) {
    monster.hurtTimer -= deltaTime;
  }

  if (monster.damageTextTimer > 0) {
    monster.damageTextTimer -= deltaTime;
  }

  return false;
}

export function takeDamage(monster: Monster, damage: number): void {
  monster.hp = Math.max(0, monster.hp - damage);
  monster.hurtTimer = 0.5;
  monster.damageText = damage;
  monster.damageTextTimer = 0.8;

  if (monster.hp <= 0) {
    monster.state = 'dead';
    monster.deathTimer = 2;
  }
}

export function getMonsterDrop(): 'potion' | 'gold' {
  return Math.random() < 0.3 ? 'potion' : 'gold';
}
