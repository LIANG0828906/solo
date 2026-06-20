export interface PlayerConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  gravity: number;
  jumpForce: number;
  moveSpeed: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
}

export class Player {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public velocityX: number = 0;
  public velocityY: number = 0;
  public isOnGround: boolean = false;
  public facingRight: boolean = true;

  private gravity: number;
  private jumpForce: number;
  private moveSpeed: number;

  constructor(config: PlayerConfig) {
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.gravity = config.gravity;
    this.jumpForce = config.jumpForce;
    this.moveSpeed = config.moveSpeed;
  }

  public update(input: InputState, worldWidth: number): void {
    if (input.left) {
      this.velocityX = -this.moveSpeed;
      this.facingRight = false;
    } else if (input.right) {
      this.velocityX = this.moveSpeed;
      this.facingRight = true;
    } else {
      this.velocityX *= 0.8;
      if (Math.abs(this.velocityX) < 0.1) {
        this.velocityX = 0;
      }
    }

    if (input.jumpPressed && this.isOnGround) {
      this.velocityY = -this.jumpForce;
      this.isOnGround = false;
    }

    this.velocityY += this.gravity;

    this.x += this.velocityX;
    this.y += this.velocityY;

    if (this.x < 0) {
      this.x = 0;
      this.velocityX = 0;
    }
    if (this.x + this.width > worldWidth) {
      this.x = worldWidth - this.width;
      this.velocityX = 0;
    }
  }

  public reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isOnGround = false;
    this.facingRight = true;
  }

  public getBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
    };
  }
}
