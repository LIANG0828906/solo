import type { Point, AttackTarget, AIStrategy, ShipStats } from '../store';

export interface EnemyState {
  pos: Point;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  hitTimer: number;
  alive: boolean;
  path: Point[];
  pathIndex: number;
  attackCooldown: number;
}

export interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  fromPlayer: boolean;
  damage: number;
}

export interface DamageNumber {
  x: number;
  y: number;
  value: number;
  elapsed: number;
  duration: number;
  fromPlayer: boolean;
}

export interface CombatFrame {
  playerPos: Point;
  playerHp: number;
  playerMaxHp: number;
  playerHitTimer: number;
  enemies: EnemyState[];
  projectiles: Projectile[];
  damageNumbers: DamageNumber[];
  battleOver: boolean;
  winner: 'player' | 'enemy' | null;
}

const ATTACK_RANGE = 250;
const ATTACK_COOLDOWN = 60;
const PROJECTILE_SPEED = 8;

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function generateEnemyPath(
  startPos: Point,
  strategy: AIStrategy,
  playerPath: Point[],
  enemyIndex: number,
  enemyCount: number,
  canvasW: number,
  canvasH: number,
): Point[] {
  const path: Point[] = [{ ...startPos }];

  if (strategy === 'flank') {
    const side = enemyIndex % 2 === 0 ? -1 : 1;
    const flankX = 600 + side * (300 + enemyIndex * 50);
    path.push({ x: flankX, y: 500 });
    const targetX = 600 + side * 100;
    path.push({ x: targetX, y: 650 });
    path.push({ x: 600, y: 600 });
  } else if (strategy === 'frontal') {
    path.push({ x: 600, y: 500 });
    path.push({ x: 600, y: 600 });
    path.push({ x: 580, y: 620 });
    path.push({ x: 620, y: 600 });
  } else {
    const angle = (Math.PI * 2 * enemyIndex) / enemyCount;
    const cx = 600;
    const cy = 450;
    const r = 200;
    path.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
    const innerAngle = angle + Math.PI / 4;
    path.push({
      x: cx + Math.cos(innerAngle) * 80,
      y: cy + Math.sin(innerAngle) * 80,
    });
    path.push({
      x: cx + Math.cos(angle + Math.PI / 2) * r,
      y: cy + Math.sin(angle + Math.PI / 2) * r,
    });
  }

  return path;
}

export interface CombatInit {
  playerPath: Point[];
  attackTargets: AttackTarget[];
  playerStats: ShipStats;
  enemies: { maxHp: number; attack: number; defense: number; speed: number }[];
  aiStrategy: AIStrategy;
  canvasWidth: number;
  canvasHeight: number;
}

export function initCombat(state: CombatInit): CombatFrame {
  const enemies: EnemyState[] = state.enemies.map((e, i) => {
    const count = state.enemies.length;
    const spacing = state.canvasW / (count + 1);
    const startPos: Point = { x: spacing * (i + 1), y: 100 };

    const path = generateEnemyPath(
      startPos,
      state.aiStrategy,
      state.playerPath,
      i,
      count,
      state.canvasWidth,
      state.canvasHeight,
    );

    return {
      pos: { ...startPos },
      hp: e.maxHp,
      maxHp: e.maxHp,
      attack: e.attack,
      defense: e.defense,
      speed: e.speed,
      hitTimer: 0,
      alive: true,
      path,
      pathIndex: 0,
      attackCooldown: ATTACK_COOLDOWN + Math.random() * 30,
    };
  });

  return {
    playerPos: { ...state.playerPath[0] },
    playerHp: state.playerStats.maxHp,
    playerMaxHp: state.playerStats.maxHp,
    playerHitTimer: 0,
    enemies,
    projectiles: [],
    damageNumbers: [],
    battleOver: false,
    winner: null,
  };
}

export function computeFrame(
  frame: CombatFrame,
  playerPath: Point[],
  attackTargets: AttackTarget[],
  playerStats: ShipStats,
): CombatFrame {
  if (frame.battleOver) return frame;

  const next = JSON.parse(JSON.stringify(frame)) as CombatFrame;
  next.damageNumbers = frame.damageNumbers
    .map((d) => ({ ...d, elapsed: d.elapsed + 1 }))
    .filter((d) => d.elapsed < d.duration);

  next.projectiles = next.projectiles.filter((p) => p.progress < 1);

  for (const p of next.projectiles) {
    p.progress += p.speed / 100;
    if (p.progress >= 1) p.progress = 1;
  }

  if (next.playerHitTimer > 0) next.playerHitTimer -= 1;
  for (const e of next.enemies) {
    if (e.hitTimer > 0) e.hitTimer -= 1;
  }

  if (playerPath.length > 1) {
    let closestSeg = 0;
    let closestDist = Infinity;
    for (let i = 0; i < playerPath.length - 1; i++) {
      const mid = {
        x: (playerPath[i].x + playerPath[i + 1].x) / 2,
        y: (playerPath[i].y + playerPath[i + 1].y) / 2,
      };
      const d = distance(next.playerPos, mid);
      if (d < closestDist) {
        closestDist = d;
        closestSeg = i;
      }
    }

    const target = playerPath[Math.min(closestSeg + 1, playerPath.length - 1)];
    const dx = target.x - next.playerPos.x;
    const dy = target.y - next.playerPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveSpeed = playerStats.speed * 0.8;

    if (dist > 2) {
      next.playerPos.x += (dx / dist) * moveSpeed;
      next.playerPos.y += (dy / dist) * moveSpeed;
    }
  }

  for (const enemy of next.enemies) {
    if (!enemy.alive) continue;

    if (enemy.pathIndex < enemy.path.length - 1) {
      const target = enemy.path[enemy.pathIndex + 1];
      const dx = target.x - enemy.pos.x;
      const dy = target.y - enemy.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < enemy.speed * 2) {
        enemy.pathIndex += 1;
      } else {
        enemy.pos.x += (dx / dist) * enemy.speed;
        enemy.pos.y += (dy / dist) * enemy.speed;
      }
    } else {
      const idx = enemy.pathIndex;
      if (idx > 0) {
        const target = enemy.path[idx - 1];
        const dx = target.x - enemy.pos.x;
        const dy = target.y - enemy.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > enemy.speed * 2) {
          enemy.pos.x += (dx / dist) * enemy.speed * 0.3;
          enemy.pos.y += (dy / dist) * enemy.speed * 0.3;
        } else {
          enemy.pathIndex = Math.max(0, idx - 1);
        }
      }
    }

    enemy.attackCooldown -= 1;
    if (enemy.attackCooldown <= 0 && distance(enemy.pos, next.playerPos) < ATTACK_RANGE + 100) {
      enemy.attackCooldown = ATTACK_COOLDOWN + Math.random() * 20;
      next.projectiles.push({
        x: enemy.pos.x,
        y: enemy.pos.y,
        targetX: next.playerPos.x + (Math.random() - 0.5) * 30,
        targetY: next.playerPos.y + (Math.random() - 0.5) * 30,
        progress: 0,
        speed: PROJECTILE_SPEED,
        fromPlayer: false,
        damage: Math.max(1, enemy.attack - playerStats.defense * 0.5),
      });
    }
  }

  for (const at of attackTargets) {
    if (at.pointIndex >= playerPath.length) continue;
    const pathPt = playerPath[at.pointIndex];
    const distToPt = distance(next.playerPos, pathPt);
    if (distToPt < 60) {
      const aliveEnemies = next.enemies.filter((e) => e.alive);
      let bestEnemy: EnemyState | null = null;
      let bestDist = Infinity;
      for (const e of aliveEnemies) {
        const d = distance({ x: at.targetX, y: at.targetY }, e.pos);
        if (d < bestDist) {
          bestDist = d;
          bestEnemy = e;
        }
      }
      if (bestEnemy && distance(next.playerPos, bestEnemy.pos) < ATTACK_RANGE) {
        const shouldFire = Math.random() < 0.03 * playerStats.speed;
        if (shouldFire) {
          next.projectiles.push({
            x: next.playerPos.x,
            y: next.playerPos.y,
            targetX: bestEnemy.pos.x,
            targetY: bestEnemy.pos.y,
            progress: 0,
            speed: PROJECTILE_SPEED,
            fromPlayer: true,
            damage: Math.max(1, playerStats.attack - bestEnemy.defense * 0.5),
          });
        }
      }
    }
  }

  const aliveEnemies = next.enemies.filter((e) => e.alive);
  if (aliveEnemies.length > 0 && attackTargets.length === 0) {
    let nearestEnemy: EnemyState | null = null;
    let nearestDist = Infinity;
    for (const e of aliveEnemies) {
      const d = distance(next.playerPos, e.pos);
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemy = e;
      }
    }
    if (nearestEnemy && nearestDist < ATTACK_RANGE) {
      const shouldFire = Math.random() < 0.02 * playerStats.speed;
      if (shouldFire) {
        next.projectiles.push({
          x: next.playerPos.x,
          y: next.playerPos.y,
          targetX: nearestEnemy.pos.x,
          targetY: nearestEnemy.pos.y,
          progress: 0,
          speed: PROJECTILE_SPEED,
          fromPlayer: true,
          damage: Math.max(1, playerStats.attack - nearestEnemy.defense * 0.5),
        });
      }
    }
  }

  for (const p of next.projectiles) {
    if (p.progress < 0.95) continue;

    const currentX = lerp(p.x, p.targetX, p.progress);
    const currentY = lerp(p.y, p.targetY, p.progress);

    if (p.fromPlayer) {
      for (const e of next.enemies) {
        if (!e.alive) continue;
        const d = distance({ x: currentX, y: currentY }, e.pos);
        if (d < 25) {
          e.hp -= p.damage;
          e.hitTimer = 12;
          next.damageNumbers.push({
            x: e.pos.x,
            y: e.pos.y - 20,
            value: Math.round(p.damage),
            elapsed: 0,
            duration: 36,
            fromPlayer: true,
          });
          if (e.hp <= 0) {
            e.hp = 0;
            e.alive = false;
          }
          p.progress = 2;
          break;
        }
      }
    } else {
      const d = distance({ x: currentX, y: currentY }, next.playerPos);
      if (d < 25) {
        next.playerHp -= p.damage;
        next.playerHitTimer = 12;
        next.damageNumbers.push({
          x: next.playerPos.x,
          y: next.playerPos.y - 20,
          value: Math.round(p.damage),
          elapsed: 0,
          duration: 36,
          fromPlayer: false,
        });
        if (next.playerHp <= 0) next.playerHp = 0;
        p.progress = 2;
      }
    }
  }

  next.projectiles = next.projectiles.filter((p) => p.progress <= 1);

  const allDead = next.enemies.every((e) => !e.alive);
  const playerDead = next.playerHp <= 0;

  if (allDead) {
    next.battleOver = true;
    next.winner = 'player';
  } else if (playerDead) {
    next.battleOver = true;
    next.winner = 'enemy';
  }

  return next;
}
