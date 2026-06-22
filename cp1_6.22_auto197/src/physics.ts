import type { PlayerState, InputState, Rect, Platform, PressurePlate, Door, PushableBox } from './types';

const GRAVITY = 0.6;
const MOVE_SPEED = 4;
const JUMP_FORCE = -13;
const FRICTION = 0.85;
const MAX_FALL_SPEED = 15;

export function rectIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function resolveCollision(
  obj: { x: number; y: number; w: number; h: number; vx: number; vy: number },
  solids: Rect[]
): { onGround: boolean; hitCeiling: boolean } {
  let onGround = false;
  let hitCeiling = false;

  obj.x += obj.vx;
  for (const solid of solids) {
    if (rectIntersect(obj, solid)) {
      if (obj.vx > 0) {
        obj.x = solid.x - obj.w;
      } else if (obj.vx < 0) {
        obj.x = solid.x + solid.w;
      }
      obj.vx = 0;
    }
  }

  obj.y += obj.vy;
  for (const solid of solids) {
    if (rectIntersect(obj, solid)) {
      if (obj.vy > 0) {
        obj.y = solid.y - obj.h;
        onGround = true;
      } else if (obj.vy < 0) {
        obj.y = solid.y + solid.h;
        hitCeiling = true;
      }
      obj.vy = 0;
    }
  }

  return { onGround, hitCeiling };
}

function getSolids(
  platforms: Platform[],
  doors: Door[],
  boxes: PushableBox[],
  excludeBoxId?: string
): Rect[] {
  const solids: Rect[] = [];
  for (const p of platforms) {
    if (p.type === 'solid') {
      solids.push(p);
    }
  }
  for (const d of doors) {
    if (!d.open) {
      solids.push(d);
    }
  }
  for (const b of boxes) {
    if (b.id !== excludeBoxId) {
      solids.push(b);
    }
  }
  return solids;
}

export interface PhysicsResult {
  player: PlayerState;
  boxes: PushableBox[];
  plates: PressurePlate[];
  doors: Door[];
  hitSpike: boolean;
  reachedGoal: boolean;
}

export function updatePhysics(
  player: PlayerState,
  input: InputState,
  platforms: Platform[],
  plates: PressurePlate[],
  doors: Door[],
  boxes: PushableBox[],
  goal: Rect,
  dt: number = 1
): PhysicsResult {
  const newPlayer: PlayerState = { ...player };
  const newBoxes = boxes.map(b => ({ ...b }));
  const newPlates = plates.map(p => ({ ...p, activated: false }));
  const newDoors = doors.map(d => ({ ...d }));

  if (input.left) {
    newPlayer.vx = -MOVE_SPEED;
    newPlayer.facingRight = false;
  } else if (input.right) {
    newPlayer.vx = MOVE_SPEED;
    newPlayer.facingRight = true;
  } else {
    newPlayer.vx *= FRICTION;
    if (Math.abs(newPlayer.vx) < 0.1) newPlayer.vx = 0;
  }

  if (input.jumpPressed && newPlayer.onGround) {
    newPlayer.vy = JUMP_FORCE;
    newPlayer.onGround = false;
  }

  newPlayer.vy += GRAVITY * dt;
  if (newPlayer.vy > MAX_FALL_SPEED) newPlayer.vy = MAX_FALL_SPEED;

  const playerSolids = getSolids(platforms, newDoors, newBoxes);
  resolveCollision(newPlayer, playerSolids);

  for (let i = 0; i < newBoxes.length; i++) {
    const box = newBoxes[i];
    const playerRect: Rect = { x: newPlayer.x, y: newPlayer.y, w: newPlayer.w, h: newPlayer.h };

    if (rectIntersect(playerRect, box)) {
      const overlapLeft = (newPlayer.x + newPlayer.w) - box.x;
      const overlapRight = (box.x + box.w) - newPlayer.x;
      const overlapTop = (newPlayer.y + newPlayer.h) - box.y;
      const overlapBottom = (box.y + box.h) - newPlayer.y;

      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        const pushDir = overlapLeft < overlapRight ? 1 : -1;
        box.vx = pushDir * MOVE_SPEED * 0.8;
        if (pushDir > 0) {
          newPlayer.x = box.x - newPlayer.w;
        } else {
          newPlayer.x = box.x + box.w;
        }
        newPlayer.vx = 0;
      }
    }
  }

  for (let i = 0; i < newBoxes.length; i++) {
    const box = newBoxes[i];
    box.vy += GRAVITY * dt;
    if (box.vy > MAX_FALL_SPEED) box.vy = MAX_FALL_SPEED;
    box.vx *= 0.7;
    if (Math.abs(box.vx) < 0.1) box.vx = 0;

    const boxSolids = getSolids(platforms, newDoors, newBoxes, box.id);
    resolveCollision(box, boxSolids);
  }

  for (const plate of newPlates) {
    const playerRect: Rect = { x: newPlayer.x, y: newPlayer.y, w: newPlayer.w, h: newPlayer.h };
    if (rectIntersect(playerRect, plate)) {
      plate.activated = true;
    }
    for (const box of newBoxes) {
      if (rectIntersect(box, plate)) {
        plate.activated = true;
      }
    }
  }

  for (const door of newDoors) {
    let shouldOpen = false;
    let activatedByTimed = false;

    for (const plate of newPlates) {
      if (plate.linkedDoorIds.includes(door.id) && plate.activated) {
        shouldOpen = true;
        if (door.isTimed) {
          door.timer = door.maxTimer;
          activatedByTimed = true;
        }
      }
    }

    if (door.isTimed && !activatedByTimed && door.timer > 0) {
      shouldOpen = true;
    }

    if (door.isTimed && door.timer > 0 && !activatedByTimed) {
      door.timer -= 1 / 60;
      if (door.timer < 0) door.timer = 0;
    }

    door.open = shouldOpen;
  }

  let hitSpike = false;
  for (const p of platforms) {
    if (p.type === 'spike') {
      const playerRect: Rect = { x: newPlayer.x, y: newPlayer.y, w: newPlayer.w, h: newPlayer.h };
      if (rectIntersect(playerRect, p)) {
        hitSpike = true;
      }
    }
  }

  if (newPlayer.y > 700) {
    hitSpike = true;
  }

  const playerRect: Rect = { x: newPlayer.x, y: newPlayer.y, w: newPlayer.w, h: newPlayer.h };
  const reachedGoal = rectIntersect(playerRect, goal);

  return {
    player: newPlayer,
    boxes: newBoxes,
    plates: newPlates,
    doors: newDoors,
    hitSpike,
    reachedGoal
  };
}

export interface ClonePhysicsResult {
  clonePlayer: PlayerState;
  plates: PressurePlate[];
  doors: Door[];
  boxes: PushableBox[];
}

export function updateClonePhysics(
  clone: PlayerState,
  recordedVx: number,
  recordedVy: number,
  recordedJumpPressed: boolean,
  platforms: Platform[],
  plates: PressurePlate[],
  doors: Door[],
  boxes: PushableBox[]
): ClonePhysicsResult {
  const newClone: PlayerState = { ...clone };
  const newPlates = plates.map(p => ({ ...p }));
  const newDoors = doors.map(d => ({ ...d }));
  const newBoxes = boxes.map(b => ({ ...b }));

  newClone.vx = recordedVx;
  newClone.vy = recordedVy;

  if (recordedJumpPressed && newClone.onGround) {
    newClone.vy = JUMP_FORCE;
    newClone.onGround = false;
  }

  newClone.vy += GRAVITY;
  if (newClone.vy > MAX_FALL_SPEED) newClone.vy = MAX_FALL_SPEED;

  const solids = getSolids(platforms, newDoors, newBoxes);
  resolveCollision(newClone, solids);

  for (const plate of newPlates) {
    const cloneRect: Rect = { x: newClone.x, y: newClone.y, w: newClone.w, h: newClone.h };
    if (rectIntersect(cloneRect, plate)) {
      plate.activated = true;
    }
  }

  for (const door of newDoors) {
    let shouldOpen = false;
    for (const plate of newPlates) {
      if (plate.linkedDoorIds.includes(door.id) && plate.activated) {
        shouldOpen = true;
      }
    }
    if (!door.isTimed) {
      door.open = shouldOpen;
    }
  }

  return {
    clonePlayer: newClone,
    plates: newPlates,
    doors: newDoors,
    boxes: newBoxes
  };
}
