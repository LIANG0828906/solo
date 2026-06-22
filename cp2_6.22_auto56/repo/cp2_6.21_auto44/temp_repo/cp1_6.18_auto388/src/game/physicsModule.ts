import { Vec2, PlayerState, ShadowClone, Block, Platform, MovingPlatform, Trap, Door, PressurePlate, ExitPortal, CollisionEvent, LevelMap } from './types';

const GRAVITY = 980;
const FRICTION = 0.3;
const FIXED_DT = 1 / 60;
const MAP_BOUNDS_Y = 620;

function rectCircleCollision(
  rx: number, ry: number, rw: number, rh: number,
  cx: number, cy: number, cr: number
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (cr * cr);
}

function rectRectCollision(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function resolveCircleRect(
  cx: number, cy: number, cr: number,
  rx: number, ry: number, rw: number, rh: number
): { pos: Vec2; grounded: boolean; pushDir: Vec2 | null } {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist >= cr || dist === 0) {
    return { pos: { x: cx, y: cy }, grounded: false, pushDir: null };
  }

  const overlap = cr - dist;
  const nx = dx / dist;
  const ny = dy / dist;

  const newPos = {
    x: cx + nx * overlap,
    y: cy + ny * overlap,
  };

  const grounded = ny < -0.5;
  const pushDir = (Math.abs(nx) > 0.5) ? { x: nx, y: 0 } : null;

  return { pos: newPos, grounded, pushDir };
}

function resolveRectRect(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): { pos: Vec2; grounded: boolean } | null {
  if (!rectRectCollision(ax, ay, aw, ah, bx, by, bw, bh)) return null;

  const overlapLeft = (ax + aw) - bx;
  const overlapRight = (bx + bw) - ax;
  const overlapTop = (ay + ah) - by;
  const overlapBottom = (by + bh) - ay;

  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

  let nx = 0, ny = 0;
  if (minOverlap === overlapTop) { ny = -1; }
  else if (minOverlap === overlapBottom) { ny = 1; }
  else if (minOverlap === overlapLeft) { nx = -1; }
  else { nx = 1; }

  return {
    pos: {
      x: ax + nx * minOverlap,
      y: ay + ny * minOverlap,
    },
    grounded: ny === -1,
  };
}

export function updatePhysics(
  player: PlayerState,
  blocks: Block[],
  platforms: Platform[],
  movingPlatforms: MovingPlatform[],
  shadows: ShadowClone[],
  traps: Trap[],
  doors: Door[],
  pressurePlates: PressurePlate[],
  exitPortal: ExitPortal | null,
  inputVel: Vec2,
  dt: number
): { player: PlayerState; blocks: Block[]; collisionEvents: CollisionEvent[]; movingPlatforms: MovingPlatform[] } {
  const events: CollisionEvent[] = [];
  let p = { ...player, vel: { ...player.vel }, pos: { ...player.pos } };

  p.vel.x = inputVel.x;
  p.vel.y += GRAVITY * dt;

  p.pos.x += p.vel.x * dt;
  p.pos.y += p.vel.y * dt;

  let grounded = false;

  const allRects: { x: number; y: number; w: number; h: number; id: string; type: string }[] = [];

  for (const plat of platforms) {
    allRects.push({ x: plat.pos.x, y: plat.pos.y, w: plat.width, h: plat.height, id: plat.id, type: 'platform' });
  }

  const updatedMovingPlatforms = movingPlatforms.map((mp) => {
    const newMp = { ...mp, pos: { ...mp.pos } };
    newMp.progress += mp.speed * dt * mp.direction / 100;
    if (newMp.progress >= 1) { newMp.progress = 1; newMp.direction = -1; }
    if (newMp.progress <= 0) { newMp.progress = 0; newMp.direction = 1; }
    newMp.pos.x = mp.startPos.x + (mp.endPos.x - mp.startPos.x) * newMp.progress;
    newMp.pos.y = mp.startPos.y + (mp.endPos.y - mp.startPos.y) * newMp.progress;
    allRects.push({ x: newMp.pos.x, y: newMp.pos.y, w: newMp.width, h: newMp.height, id: newMp.id, type: 'moving' });
    return newMp;
  });

  for (const shadow of shadows) {
    const sr = shadow.shadowRect;
    allRects.push({ x: sr.x, y: sr.y, w: sr.width, h: sr.height, id: shadow.id, type: 'shadow' });
  }

  for (const door of doors) {
    if (!door.open) {
      allRects.push({ x: door.pos.x, y: door.pos.y, w: door.width, h: door.height, id: door.id, type: 'door' });
    }
  }

  for (const rect of allRects) {
    const result = resolveCircleRect(p.pos.x, p.pos.y, p.radius, rect.x, rect.y, rect.w, rect.h);
    if (result.grounded || result.pushDir) {
      p.pos = result.pos;
      if (result.grounded) {
        p.vel.y = 0;
        grounded = true;
      }
      if (result.pushDir) {
        p.vel.x = 0;
      }
    }
  }

  const updatedBlocks = blocks.map((block) => {
    const b = { ...block, vel: { ...block.vel }, pos: { ...block.pos } };
    b.vel.y += GRAVITY * dt;
    b.vel.x *= (1 - FRICTION * dt * 10);
    b.pos.x += b.vel.x * dt;
    b.pos.y += b.vel.y * dt;

    let bGrounded = false;

    for (const rect of allRects.filter((r) => r.type === 'platform' || r.type === 'moving')) {
      const res = resolveRectRect(b.pos.x, b.pos.y, b.width, b.height, rect.x, rect.y, rect.w, rect.h);
      if (res) {
        b.pos = res.pos;
        if (res.grounded) {
          b.vel.y = 0;
          bGrounded = true;
        } else {
          b.vel.x = 0;
        }
      }
    }

    const pRes = resolveCircleRect(p.pos.x, p.pos.y, p.radius, b.pos.x, b.pos.y, b.width, b.height);
    if (pRes.pushDir || pRes.grounded) {
      p.pos = pRes.pos;
      if (pRes.grounded) {
        p.vel.y = 0;
        grounded = true;
      }
      if (pRes.pushDir) {
        b.vel.x += pRes.pushDir.x * 200;
        p.vel.x = 0;
        events.push({ type: 'player_block', entityId: b.id });
      }
    }

    b.isGrounded = bGrounded;
    return b;
  });

  p.isGrounded = grounded;

  if (p.pos.y > MAP_BOUNDS_Y) {
    events.push({ type: 'player_trap' });
  }

  for (const trap of traps) {
    if (rectCircleCollision(trap.pos.x, trap.pos.y, trap.width, trap.height, p.pos.x, p.pos.y, p.radius)) {
      events.push({ type: 'player_trap' });
    }
  }

  if (exitPortal) {
    const dx = p.pos.x - exitPortal.pos.x;
    const dy = p.pos.y - exitPortal.pos.y;
    if (Math.sqrt(dx * dx + dy * dy) < exitPortal.radius + p.radius) {
      events.push({ type: 'player_exit' });
    }
  }

  return { player: p, blocks: updatedBlocks, collisionEvents: events, movingPlatforms: updatedMovingPlatforms };
}

export { rectCircleCollision, rectRectCollision, MAP_BOUNDS_Y, GRAVITY, FRICTION };
