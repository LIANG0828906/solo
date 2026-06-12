import Phaser from 'phaser';

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public health: number = 5;
  public maxHealth: number = 5;
  public keys: number = 0;
  public maxKeys: number = 3;
  public kills: number = 0;
  public invincible: boolean = false;
  public attacking: boolean = false;
  public facing: 'up' | 'down' | 'left' | 'right' = 'down';

  private moveCooldown: number = 0;
  private attackCooldown: number = 0;
  private invincibleTimer: number = 0;
  private attackTimer: number = 0;
  private blinkTimer: number = 0;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey: Phaser.Input.Keyboard.Key;
  private eKey: Phaser.Input.Keyboard.Key;

  private attackGraphics: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDisplaySize(16, 16);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.eKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.attackGraphics = scene.add.graphics();
    this.attackGraphics.setDepth(10);
  }

  public update(delta: number): void {
    if (this.moveCooldown > 0) this.moveCooldown -= delta;
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.sprite.setAlpha(1);
      } else {
        this.blinkTimer += delta;
        if (this.blinkTimer > 100) {
          this.blinkTimer = 0;
          this.sprite.setAlpha(this.sprite.alpha === 1 ? 0.3 : 1);
        }
      }
    }

    if (this.attacking) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.attacking = false;
        this.attackGraphics.clear();
      }
    }

    this.handleMovement(delta);
    this.handleAttack();
  }

  private handleMovement(delta: number): void {
    if (this.moveCooldown > 0) return;

    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown) {
      dx = -4;
      this.facing = 'left';
    } else if (this.cursors.right.isDown) {
      dx = 4;
      this.facing = 'right';
    } else if (this.cursors.up.isDown) {
      dy = -4;
      this.facing = 'up';
    } else if (this.cursors.down.isDown) {
      dy = 4;
      this.facing = 'down';
    }

    if (dx !== 0 || dy !== 0) {
      this.sprite.x += dx;
      this.sprite.y += dy;
      this.moveCooldown = 100;
    }
  }

  private handleAttack(): void {
    if (this.attackCooldown > 0 || this.attacking) return;

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.attacking = true;
      this.attackTimer = 300;
      this.attackCooldown = 400;
      this.drawAttackArc();
    }
  }

  private drawAttackArc(): void {
    this.attackGraphics.clear();
    this.attackGraphics.lineStyle(2, 0xffffff, 0.7);
    this.attackGraphics.fillStyle(0xffffff, 0.3);

    let startAngle = 0;
    let endAngle = 0;
    const radius = 20;

    switch (this.facing) {
      case 'up':
        startAngle = -Math.PI * 0.75;
        endAngle = -Math.PI * 0.25;
        break;
      case 'down':
        startAngle = Math.PI * 0.25;
        endAngle = Math.PI * 0.75;
        break;
      case 'left':
        startAngle = Math.PI * 0.75;
        endAngle = Math.PI * 1.25;
        break;
      case 'right':
        startAngle = -Math.PI * 0.25;
        endAngle = Math.PI * 0.25;
        break;
    }

    this.attackGraphics.beginPath();
    this.attackGraphics.moveTo(this.sprite.x, this.sprite.y);
    this.attackGraphics.arc(this.sprite.x, this.sprite.y, radius, startAngle, endAngle, false);
    this.attackGraphics.closePath();
    this.attackGraphics.fillPath();
    this.attackGraphics.strokePath();
  }

  public isEKeyPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.eKey);
  }

  public takeDamage(): void {
    if (this.invincible) return;
    this.health--;
    this.invincible = true;
    this.invincibleTimer = 500;
    this.blinkTimer = 0;
  }

  public heal(): void {
    if (this.health < this.maxHealth) {
      this.health++;
    }
  }

  public addKey(): void {
    if (this.keys < this.maxKeys) {
      this.keys++;
    }
  }

  public addKill(): void {
    this.kills++;
  }

  public getAttackHitbox(): { x: number; y: number; radius: number } | null {
    if (!this.attacking) return null;
    return {
      x: this.sprite.x,
      y: this.sprite.y,
      radius: 20
    };
  }

  public destroy(): void {
    this.attackGraphics.destroy();
    this.sprite.destroy();
  }
}
