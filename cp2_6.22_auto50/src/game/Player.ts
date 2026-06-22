import * as PIXI from 'pixi.js';
import type { Vector2, Rect, PlayerState, PlatformConfig, SweptAABBResult } from '../../types';

export class Player {
  public sprite: PIXI.Container;
  public body: PIXI.Graphics;
  public position: Vector2;
  public velocity: Vector2;
  public isGrounded: boolean;
  public facing: 1 | -1;
  public isJumping: boolean;
  public isDead: boolean;
  public actionState: number;
  public width: number;
  public height: number;

  private readonly GRAVITY = 1800;
  private readonly JUMP_FORCE = -650;
  private readonly MOVE_SPEED = 320;
  private readonly MAX_FALL_SPEED = 900;
  private readonly COLLISION_PADDING = 0.01;

  private keys: Set<string>;
  private trail: PIXI.Graphics[] = [];
  private readonly TRAIL_LENGTH = 8;

  constructor(x: number, y: number) {
    this.width = 24;
    this.height = 32;
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.isGrounded = false;
    this.facing = 1;
    this.isJumping = false;
    this.isDead = false;
    this.actionState = 0;
    this.keys = new Set();

    this.sprite = new PIXI.Container();

    this.body = new PIXI.Graphics();
    this.drawBody(0x39ff14);
    this.sprite.addChild(this.body);

    this.sprite.x = x;
    this.sprite.y = y;
  }

  private drawBody(color: number): void {
    this.body.clear();
    this.body.beginFill(color);
    this.body.drawRect(-this.width / 2, -this.height / 2, this.width, this.height);
    this.body.endFill();

    this.body.beginFill(0x0a0a2e);
    const eyeOffset = this.facing * 3;
    this.body.drawRect(-4 + eyeOffset, -8, 3, 3);
    this.body.drawRect(2 + eyeOffset, -8, 3, 3);
    this.body.endFill();
  }

  public setColor(color: number, alpha: number = 1): void {
    this.body.clear();
    this.body.beginFill(color, alpha);
    this.body.drawRect(-this.width / 2, -this.height / 2, this.width, this.height);
    this.body.endFill();
  }

  public handleKeyDown(key: string): void {
    this.keys.add(key);
  }

  public handleKeyUp(key: string): void {
    this.keys.delete(key);
  }

  public getRect(): Rect {
    return {
      x: this.position.x - this.width / 2,
      y: this.position.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }

  public getState(): PlayerState {
    return {
      position: { ...this.position },
      velocity: { ...this.velocity },
      isGrounded: this.isGrounded,
      facing: this.facing,
      isJumping: this.isJumping,
      isDead: this.isDead,
      actionState: this.actionState
    };
  }

  public setState(state: PlayerState): void {
    this.position = { ...state.position };
    this.velocity = { ...state.velocity };
    this.isGrounded = state.isGrounded;
    this.facing = state.facing;
    this.isJumping = state.isJumping;
    this.isDead = state.isDead || false;
    this.actionState = state.actionState || 0;
    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;
  }

  private aabbOverlap(a: Rect, b: { x: number; y: number; width: number; height: number }): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  private sweptAABB(
    startPos: Vector2,
    deltaX: number,
    deltaY: number,
    platforms: PlatformConfig[]
  ): SweptAABBResult {
    const result: SweptAABBResult = {
      position: { ...startPos },
      tHitX: 1,
      tHitY: 1,
      tFirst: 1,
      hitNormal: false,
      hitX: false,
      hitY: false,
      hitGround: false,
      hitCeiling: false,
      hitLeft: false,
      hitRight: false,
      cornerCollision: false
    };

    if (deltaX === 0 && deltaY === 0) {
      return result;
    }

    const maxDistance = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    const steps = Math.max(
      Math.ceil(maxDistance / (Math.min(this.width, this.height) * 0.5)),
      1
    );

    const stepDeltaX = deltaX / steps;
    const stepDeltaY = deltaY / steps;
    let currentPos = { ...startPos };

    for (let step = 0; step < steps; step++) {
      const stepStartPos = { ...currentPos };

      let localTHitX = 1;
      let localTHitY = 1;
      let localHitRight = false;
      let localHitLeft = false;
      let localHitGround = false;
      let localHitCeiling = false;
      let localCornerCollision = false;
      let collidedPlatform: PlatformConfig | null = null;

      for (const platform of platforms) {
        const pMinX = currentPos.x - this.width / 2;
        const pMinY = currentPos.y - this.height / 2;
        const pMaxX = currentPos.x + this.width / 2;
        const pMaxY = currentPos.y + this.height / 2;

        const bMinX = platform.x;
        const bMinY = platform.y;
        const bMaxX = platform.x + platform.width;
        const bMaxY = platform.y + platform.height;

        if (stepDeltaX !== 0) {
          let txEntry: number;
          let txExit: number;

          if (stepDeltaX > 0) {
            txEntry = (bMinX - pMaxX) / stepDeltaX;
            txExit = (bMaxX - pMinX) / stepDeltaX;
          } else {
            txEntry = (bMaxX - pMinX) / stepDeltaX;
            txExit = (bMinX - pMaxX) / stepDeltaX;
          }

          if (txEntry < 0) txEntry = 0;
          if (txExit > 1) txExit = 1;

          const yEntryCheck = Math.max(pMinY, bMinY);
          const yExitCheck = Math.min(pMaxY, bMaxY);
          const yOverlaps = yEntryCheck < yExitCheck;

          if (txEntry >= 0 && txEntry <= 1 && txEntry < txExit && yOverlaps) {
            if (txEntry < localTHitX) {
              localTHitX = txEntry;
              if (stepDeltaX > 0) {
                localHitRight = true;
                localHitLeft = false;
              } else {
                localHitLeft = true;
                localHitRight = false;
              }
              collidedPlatform = platform;
            }
          }
        }

        if (stepDeltaY !== 0) {
          let tyEntry: number;
          let tyExit: number;

          if (stepDeltaY > 0) {
            tyEntry = (bMinY - pMaxY) / stepDeltaY;
            tyExit = (bMaxY - pMinY) / stepDeltaY;
          } else {
            tyEntry = (bMaxY - pMinY) / stepDeltaY;
            tyExit = (bMinY - pMaxY) / stepDeltaY;
          }

          if (tyEntry < 0) tyEntry = 0;
          if (tyExit > 1) tyExit = 1;

          const xEntryCheck = Math.max(pMinX, bMinX);
          const xExitCheck = Math.min(pMaxX, bMaxX);
          const xOverlaps = xEntryCheck < xExitCheck;

          if (tyEntry >= 0 && tyEntry <= 1 && tyEntry < tyExit && xOverlaps) {
            if (tyEntry < localTHitY) {
              localTHitY = tyEntry;
              if (stepDeltaY > 0) {
                localHitGround = true;
                localHitCeiling = false;
              } else {
                localHitCeiling = true;
                localHitGround = false;
              }
              if (!collidedPlatform) {
                collidedPlatform = platform;
              }
            }
          }
        }
      }

      const localTFirst = Math.min(localTHitX, localTHitY);

      if (localTFirst < 1) {
        const normalizedTHitX = localTHitX / Math.max(localTFirst, 0.0001);
        const normalizedTHitY = localTHitY / Math.max(localTFirst, 0.0001);

        if (Math.abs(localTHitX - localTHitY) < 0.05) {
          localCornerCollision = true;
        }

        if (localCornerCollision) {
          if (localHitGround || localHitCeiling) {
            currentPos.x = stepStartPos.x + stepDeltaX * localTHitY;
            currentPos.y = stepStartPos.y + stepDeltaY * localTHitY;
            result.tHitY = Math.min(result.tHitY, (step + localTHitY) / steps);
            result.hitY = true;
            if (localHitGround) result.hitGround = true;
            if (localHitCeiling) result.hitCeiling = true;

            const testAfterX: Rect = {
              x: currentPos.x + stepDeltaX * (1 - localTHitY) - this.width / 2,
              y: currentPos.y - this.height / 2,
              width: this.width,
              height: this.height
            };

            let blockedAfterX = false;
            for (const platform of platforms) {
              if (this.aabbOverlap(testAfterX, platform)) {
                blockedAfterX = true;
                break;
              }
            }

            if (blockedAfterX) {
              result.tHitX = Math.min(result.tHitX, (step + localTHitY) / steps);
              result.hitX = true;
              if (localHitRight) result.hitRight = true;
              if (localHitLeft) result.hitLeft = true;
            } else {
              currentPos.x = stepStartPos.x + stepDeltaX;
            }
          } else {
            currentPos.x = stepStartPos.x + stepDeltaX * localTHitX;
            currentPos.y = stepStartPos.y + stepDeltaY * localTHitX;
            result.tHitX = Math.min(result.tHitX, (step + localTHitX) / steps);
            result.hitX = true;
            if (localHitRight) result.hitRight = true;
            if (localHitLeft) result.hitLeft = true;

            const testAfterY: Rect = {
              x: currentPos.x - this.width / 2,
              y: currentPos.y + stepDeltaY * (1 - localTHitX) - this.height / 2,
              width: this.width,
              height: this.height
            };

            let blockedAfterY = false;
            for (const platform of platforms) {
              if (this.aabbOverlap(testAfterY, platform)) {
                blockedAfterY = true;
                break;
              }
            }

            if (blockedAfterY) {
              result.tHitY = Math.min(result.tHitY, (step + localTHitX) / steps);
              result.hitY = true;
              if (localHitGround) result.hitGround = true;
              if (localHitCeiling) result.hitCeiling = true;
            } else {
              currentPos.y = stepStartPos.y + stepDeltaY;
            }
          }
          result.cornerCollision = true;
        } else if (normalizedTHitX < normalizedTHitY) {
          const safeT = Math.max(0, localTHitX - this.COLLISION_PADDING);
          currentPos.x = stepStartPos.x + stepDeltaX * safeT;
          currentPos.y = stepStartPos.y + stepDeltaY * safeT;

          result.tHitX = Math.min(result.tHitX, (step + safeT) / steps);
          result.hitX = true;
          if (localHitRight) result.hitRight = true;
          if (localHitLeft) result.hitLeft = true;

          const remainingT = 1 - safeT;
          const testYPos = { ...currentPos };
          testYPos.y += stepDeltaY * remainingT;
          const testYRect: Rect = {
            x: testYPos.x - this.width / 2,
            y: testYPos.y - this.height / 2,
            width: this.width,
            height: this.height
          };

          let yBlocked = false;
          for (const platform of platforms) {
            if (this.aabbOverlap(testYRect, platform)) {
              yBlocked = true;
              break;
            }
          }

          if (!yBlocked) {
            currentPos.y = testYPos.y;
          } else {
            result.tHitY = Math.min(result.tHitY, (step + safeT) / steps);
            result.hitY = true;
          }
        } else {
          const safeT = Math.max(0, localTHitY - this.COLLISION_PADDING);
          currentPos.x = stepStartPos.x + stepDeltaX * safeT;
          currentPos.y = stepStartPos.y + stepDeltaY * safeT;

          result.tHitY = Math.min(result.tHitY, (step + safeT) / steps);
          result.hitY = true;
          if (localHitGround) result.hitGround = true;
          if (localHitCeiling) result.hitCeiling = true;

          const remainingT = 1 - safeT;
          const testXPos = { ...currentPos };
          testXPos.x += stepDeltaX * remainingT;
          const testXRect: Rect = {
            x: testXPos.x - this.width / 2,
            y: testXPos.y - this.height / 2,
            width: this.width,
            height: this.height
          };

          let xBlocked = false;
          for (const platform of platforms) {
            if (this.aabbOverlap(testXRect, platform)) {
              xBlocked = true;
              break;
            }
          }

          if (!xBlocked) {
            currentPos.x = testXPos.x;
          } else {
            result.tHitX = Math.min(result.tHitX, (step + safeT) / steps);
            result.hitX = true;
          }
        }

        if (collidedPlatform) {
          result.collidedPlatform = collidedPlatform;
        }
      } else {
        currentPos.x = stepStartPos.x + stepDeltaX;
        currentPos.y = stepStartPos.y + stepDeltaY;
      }
    }

    result.position = currentPos;
    result.tFirst = Math.min(result.tHitX, result.tHitY);
    result.hitNormal = result.hitX || result.hitY;

    return result;
  }

  public update(deltaTime: number, platforms: PlatformConfig[], activeDoors: Rect[]): void {
    const dt = Math.min(deltaTime, 1 / 30);

    let moveX = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) {
      moveX -= 1;
      this.facing = -1;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D')) {
      moveX += 1;
      this.facing = 1;
    }

    const prevActionState = this.actionState;
    if (moveX !== 0) {
      this.actionState = 1;
    } else {
      this.actionState = 0;
    }

    this.velocity.x = moveX * this.MOVE_SPEED;

    const wasJumping = this.isJumping;
    if ((this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W') || this.keys.has(' ')) && this.isGrounded) {
      this.velocity.y = this.JUMP_FORCE;
      this.isGrounded = false;
      this.isJumping = true;
      this.actionState = 2;
    } else if (!wasJumping && this.isJumping && !this.isGrounded) {
      this.actionState = 2;
    }

    this.velocity.y += this.GRAVITY * dt;
    this.velocity.y = Math.min(this.velocity.y, this.MAX_FALL_SPEED);

    const deltaX = this.velocity.x * dt;
    const deltaY = this.velocity.y * dt;

    const allColliders = [
      ...platforms,
      ...activeDoors.map(d => ({ ...d, type: 'normal' as const }))
    ];

    const collisionResult = this.sweptAABB(this.position, deltaX, deltaY, allColliders);

    this.position = collisionResult.position;

    if (collisionResult.hitX) {
      this.velocity.x = 0;
    }
    if (collisionResult.hitY) {
      this.velocity.y = 0;
      if (collisionResult.hitGround) {
        this.isGrounded = true;
        this.isJumping = false;
      }
      if (collisionResult.hitCeiling && !collisionResult.hitGround) {
        this.isJumping = false;
      }
    } else {
      this.isGrounded = false;
    }

    if (prevActionState !== this.actionState) {
      // 状态变化会被 TimeRecorder 捕获
    }

    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;

    this.updateTrail();
  }

  private updateTrail(): void {
    if (this.trail.length < this.TRAIL_LENGTH) {
      const trailPart = new PIXI.Graphics();
      this.trail.push(trailPart);
    }

    for (let i = this.trail.length - 1; i > 0; i--) {
      const prev = this.sprite.parent.getChildIndex(this.trail[i - 1]);
      if (this.sprite.parent.getChildIndex(this.trail[i]) !== prev - 1) {
        this.sprite.parent.addChildAt(this.trail[i], prev);
      }
    }
  }

  public reset(x: number, y: number): void {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.isGrounded = false;
    this.facing = 1;
    this.isJumping = false;
    this.isDead = false;
    this.actionState = 0;
    this.sprite.x = x;
    this.sprite.y = y;
    this.keys.clear();
  }
}
