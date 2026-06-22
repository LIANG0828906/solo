import * as PIXI from 'pixi.js';
import type { Vector2, Rect, PlayerState, PlatformConfig } from '../../types';

export class Player {
  public sprite: PIXI.Container;
  public body: PIXI.Graphics;
  public position: Vector2;
  public velocity: Vector2;
  public isGrounded: boolean;
  public facing: 1 | -1;
  public isJumping: boolean;
  public width: number;
  public height: number;

  private readonly GRAVITY = 1800;
  private readonly JUMP_FORCE = -650;
  private readonly MOVE_SPEED = 320;
  private readonly MAX_FALL_SPEED = 900;
  private readonly COLLISION_PADDING = 0.5;

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
      isJumping: this.isJumping
    };
  }

  public setState(state: PlayerState): void {
    this.position = { ...state.position };
    this.velocity = { ...state.velocity };
    this.isGrounded = state.isGrounded;
    this.facing = state.facing;
    this.isJumping = state.isJumping;
    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;
  }

  private aabbOverlap(a: Rect, b: Rect): boolean {
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
  ): { position: Vector2; hitX: boolean; hitY: boolean; hitGround: boolean } {
    const result = {
      position: { ...startPos },
      hitX: false,
      hitY: false,
      hitGround: false
    };

    const steps = Math.max(
      Math.ceil(Math.abs(deltaX) / (this.height * 0.5)),
      Math.ceil(Math.abs(deltaY) / (this.height * 0.5)),
      1
    );

    const stepX = deltaX / steps;
    const stepY = deltaY / steps;
    let currentPos = { ...startPos };

    for (let i = 0; i < steps; i++) {
      let nextX = currentPos.x + stepX;
      let nextY = currentPos.y + stepY;

      const testRectX: Rect = {
        x: nextX - this.width / 2,
        y: currentPos.y - this.height / 2,
        width: this.width,
        height: this.height
      };

      let collidedX = false;
      for (const platform of platforms) {
        if (this.aabbOverlap(testRectX, platform)) {
          collidedX = true;
          result.hitX = true;
          break;
        }
      }

      if (!collidedX) {
        currentPos.x = nextX;
      } else {
        if (stepX > 0) {
          for (const platform of platforms) {
            const testRect: Rect = {
              x: currentPos.x - this.width / 2 + this.COLLISION_PADDING,
              y: currentPos.y - this.height / 2,
              width: this.width,
              height: this.height
            };
            if (
              currentPos.x + this.width / 2 <= platform.x &&
              this.aabbOverlap(testRect, {
                x: platform.x - this.width / 2 - 1,
                y: platform.y,
                width: this.width + 2,
                height: platform.height
              })
            ) {
              currentPos.x = platform.x - this.width / 2 - this.COLLISION_PADDING;
              break;
            }
          }
        } else if (stepX < 0) {
          for (const platform of platforms) {
            const testRect: Rect = {
              x: currentPos.x - this.width / 2 - this.COLLISION_PADDING,
              y: currentPos.y - this.height / 2,
              width: this.width,
              height: this.height
            };
            if (
              currentPos.x - this.width / 2 >= platform.x + platform.width &&
              this.aabbOverlap(testRect, {
                x: platform.x + platform.width - this.width / 2 + 1,
                y: platform.y,
                width: this.width + 2,
                height: platform.height
              })
            ) {
              currentPos.x = platform.x + platform.width + this.width / 2 + this.COLLISION_PADDING;
              break;
            }
          }
        }
      }

      const testRectY: Rect = {
        x: currentPos.x - this.width / 2,
        y: nextY - this.height / 2,
        width: this.width,
        height: this.height
      };

      let collidedY = false;
      for (const platform of platforms) {
        if (this.aabbOverlap(testRectY, platform)) {
          collidedY = true;
          result.hitY = true;
          if (stepY > 0) {
            result.hitGround = true;
          }
          break;
        }
      }

      if (!collidedY) {
        currentPos.y = nextY;
      } else {
        if (stepY > 0) {
          for (const platform of platforms) {
            if (
              currentPos.y + this.height / 2 <= platform.y &&
              this.aabbOverlap(
                {
                  x: currentPos.x - this.width / 2,
                  y: currentPos.y - this.height / 2 + this.COLLISION_PADDING,
                  width: this.width,
                  height: this.height
                },
                {
                  x: platform.x,
                  y: platform.y - this.height / 2 - 1,
                  width: platform.width,
                  height: this.height + 2
                }
              )
            ) {
              currentPos.y = platform.y - this.height / 2 - this.COLLISION_PADDING;
              break;
            }
          }
        } else if (stepY < 0) {
          for (const platform of platforms) {
            if (
              currentPos.y - this.height / 2 >= platform.y + platform.height &&
              this.aabbOverlap(
                {
                  x: currentPos.x - this.width / 2,
                  y: currentPos.y - this.height / 2 - this.COLLISION_PADDING,
                  width: this.width,
                  height: this.height
                },
                {
                  x: platform.x,
                  y: platform.y + platform.height - this.height / 2 + 1,
                  width: platform.width,
                  height: this.height + 2
                }
              )
            ) {
              currentPos.y = platform.y + platform.height + this.height / 2 + this.COLLISION_PADDING;
              break;
            }
          }
        }
      }
    }

    result.position = currentPos;
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

    this.velocity.x = moveX * this.MOVE_SPEED;

    if ((this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W') || this.keys.has(' ')) && this.isGrounded) {
      this.velocity.y = this.JUMP_FORCE;
      this.isGrounded = false;
      this.isJumping = true;
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
    } else {
      this.isGrounded = false;
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
    this.sprite.x = x;
    this.sprite.y = y;
    this.keys.clear();
  }
}
