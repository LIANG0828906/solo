import { PlayerState, Vec2 } from './types';

const MOVE_SPEED = 220;
const JUMP_VEL = -420;
const MAX_FALL_SPEED = 600;

export type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  jump: boolean;
};

export function computePlayerVelocity(
  player: PlayerState,
  input: InputState
): Vec2 {
  let vx = 0;

  if (input.left) {
    vx = -MOVE_SPEED;
  }
  if (input.right) {
    vx = MOVE_SPEED;
  }

  let vy = player.vel.y;

  if (input.jump && player.isGrounded) {
    vy = JUMP_VEL;
  }

  vy = Math.min(vy, MAX_FALL_SPEED);

  return { x: vx, y: vy };
}

export function updatePlayerFacing(
  player: PlayerState,
  input: InputState
): PlayerState {
  let facingRight = player.facingRight;
  if (input.left) facingRight = false;
  if (input.right) facingRight = true;
  return { ...player, facingRight };
}

export interface DragState {
  isDragging: boolean;
  startPos: Vec2 | null;
  currentPos: Vec2 | null;
}

export function startDrag(pos: Vec2): DragState {
  return { isDragging: true, startPos: { ...pos }, currentPos: { ...pos } };
}

export function updateDrag(drag: DragState, pos: Vec2): DragState {
  if (!drag.isDragging) return drag;
  return { ...drag, currentPos: { ...pos } };
}

export function endDrag(drag: DragState): { released: boolean; startPos: Vec2 | null; endPos: Vec2 | null } {
  if (!drag.isDragging || !drag.startPos || !drag.currentPos) {
    return { released: false, startPos: null, endPos: null };
  }

  const dx = drag.currentPos.x - drag.startPos.x;
  const dy = drag.currentPos.y - drag.startPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 15) {
    return { released: true, startPos: drag.startPos, endPos: drag.currentPos };
  }

  return { released: false, startPos: drag.startPos, endPos: drag.currentPos };
}
