import type { CharacterState, InputState, CollisionInfo, TerrainBlock } from './types';
import { GRAVITY, JUMP_VELOCITY, MOVE_SPEED, SLOPE_SPEED_FACTOR, CLIMB_SPEED, TILE_SIZE } from './types';

export class CharacterController {
  state: CharacterState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): CharacterState {
    return {
      x: 100,
      y: 400,
      width: 30,
      height: 40,
      vx: 0,
      vy: 0,
      onGround: false,
      onWall: null,
      climbing: false,
      facing: 'right',
      runPhase: 0,
      wasOnGround: false,
      oneWayPassThrough: false
    };
  }

  reset(): void {
    this.state = this.createInitialState();
  }

  update(input: InputState, collisions: CollisionInfo[], terrains: TerrainBlock[], dt: number): void {
    const s = this.state;

    s.oneWayPassThrough = input.down;

    const onSlope = collisions.some(c => c.terrain?.type === 'slope' && c.side === 'slope');
    const onStep = collisions.some(c => c.terrain?.type === 'step');

    let targetVx = 0;
    const speedFactor = onSlope ? SLOPE_SPEED_FACTOR : 1.0;

    if (input.left) {
      targetVx = -MOVE_SPEED * speedFactor;
      s.facing = 'left';
    }
    if (input.right) {
      targetVx = MOVE_SPEED * speedFactor;
      s.facing = 'right';
    }

    if (s.onGround) {
      const accel = 2500;
      if (targetVx > s.vx) {
        s.vx = Math.min(s.vx + accel * dt, targetVx);
      } else if (targetVx < s.vx) {
        s.vx = Math.max(s.vx - accel * dt, targetVx);
      }
    } else {
      const airAccel = 1500;
      if (targetVx !== 0) {
        if (targetVx > s.vx) {
          s.vx = Math.min(s.vx + airAccel * dt, targetVx);
        } else {
          s.vx = Math.max(s.vx - airAccel * dt, targetVx);
        }
      }
    }

    s.climbing = false;
    if (s.onWall && !s.onGround) {
      const nearWall = s.onWall;
      const pressingIntoWall = (nearWall === 'left' && input.left) || (nearWall === 'right' && input.right);
      if (pressingIntoWall) {
        s.climbing = true;
      }
    }

    if (s.climbing) {
      s.vy = 0;
      if (input.up) {
        s.vy = -CLIMB_SPEED;
      } else if (input.down) {
        s.vy = CLIMB_SPEED;
      }
      if (input.jumpPressed) {
        s.vy = -JUMP_VELOCITY * 0.8;
        s.vx = (s.onWall === 'left' ? 1 : -1) * MOVE_SPEED * 0.8;
        s.climbing = false;
      }
    } else {
      s.vy += GRAVITY * dt;

      if (input.jumpPressed && s.onGround) {
        s.vy = -JUMP_VELOCITY;
        s.onGround = false;
      }

      if (!input.jump && s.vy < -JUMP_VELOCITY * 0.4) {
        s.vy = -JUMP_VELOCITY * 0.4;
      }
    }

    if (s.vy > 1200) {
      s.vy = 1200;
    }
    if (s.vx > 800) s.vx = 800;
    if (s.vx < -800) s.vx = -800;

    this.handleStepClimbing(collisions, dt);

    if (s.onGround && (input.left || input.right)) {
      s.runPhase += dt;
    } else {
      s.runPhase = 0;
    }
  }

  private handleStepClimbing(collisions: CollisionInfo[], dt: number): void {
    const s = this.state;
    if (!s.onGround) return;

    const maxStepHeight = s.height * 0.5;
    const wallCol = collisions.find(c => c.side === 'left' || c.side === 'right');

    if (wallCol && wallCol.terrain) {
      const stepH = wallCol.terrain.stepHeight || TILE_SIZE;
      if (stepH <= maxStepHeight && (s.vx !== 0)) {
        s.y -= stepH * 0.5;
        s.vy = -80;
      }
    }
  }
}
