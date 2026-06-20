import Phaser from 'phaser';

export interface PlayerInput {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  charge: Phaser.Input.Keyboard.Key;
}

export class Player {
  public scene: Phaser.Scene;
  public id: number;
  public sprite!: Phaser.Physics.Arcade.Sprite;
  public slingshot!: Phaser.GameObjects.Graphics;
  public band!: Phaser.GameObjects.Graphics;
  
  public hp: number = 3;
  public maxHp: number = 3;
  
  public isCharging: boolean = false;
  public chargeStartTime: number = 0;
  public chargePower: number = 0;
  
  public aimAngle: number = 0;
  public isHit: boolean = false;
  public hitTimer: number = 0;
  
  public input: PlayerInput;
  public facingRight: boolean = true;
  
  public onGround: boolean = false;
  
  private readonly MOVE_SPEED: number = 200;
  private readonly MIN_CHARGE_TIME: number = 100;
  private readonly MAX_CHARGE_TIME: number = 2000;

  constructor(scene: Phaser.Scene, id: number, x: number, y: number, input: PlayerInput) {
    this.scene = scene;
    this.id = id;
    this.input = input;
    this.facingRight = id === 1;
    
    this.createSprite(x, y);
    this.createSlingshot();
  }

  private createSprite(x: number, y: number): void {
    this.sprite = this.scene.physics.add.sprite(x, y, '');
    this.sprite.setSize(30, 50);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.setFriction(0.5, 0);
    this.sprite.setVisible(true);
    
    this.drawPlayerBody();
  }

  private drawPlayerBody(): void {
    const graphics = this.scene.add.graphics();
    const color = this.id === 1 ? 0x3498DB : 0xE74C3C;
    
    graphics.fillStyle(color, 1);
    graphics.fillRect(-15, -25, 30, 40);
    
    graphics.fillStyle(0xF5CBA7, 1);
    graphics.fillCircle(0, -35, 14);
    
    graphics.fillStyle(0x000000, 1);
    const eyeOffset = this.facingRight ? 4 : -4;
    graphics.fillCircle(eyeOffset - 3, -37, 2);
    graphics.fillCircle(eyeOffset + 3, -37, 2);
    
    graphics.fillStyle(color, 1);
    graphics.fillRect(-12, 15, 10, 15);
    graphics.fillRect(2, 15, 10, 15);
    
    const textureKey = `player_body_${this.id}`;
    graphics.generateTexture(textureKey, 60, 80);
    this.sprite.setTexture(textureKey);
    graphics.destroy();
  }

  private createSlingshot(): void {
    this.slingshot = this.scene.add.graphics();
    this.band = this.scene.add.graphics();
    this.updateSlingshotPosition();
  }

  public updateSlingshotPosition(): void {
    this.slingshot.clear();
    
    const x = this.sprite.x + (this.facingRight ? 25 : -25);
    const y = this.sprite.y - 10;
    
    this.slingshot.lineStyle(5, 0x8B4513, 1);
    this.slingshot.beginPath();
    this.slingshot.moveTo(x, y + 30);
    this.slingshot.lineTo(x, y - 10);
    this.slingshot.lineTo(x - 12, y - 25);
    this.slingshot.moveTo(x, y - 10);
    this.slingshot.lineTo(x + 12, y - 25);
    this.slingshot.strokePath();
    
    this.drawBand(0);
  }

  public drawBand(chargeAmount: number): void {
    this.band.clear();
    
    const x = this.sprite.x + (this.facingRight ? 25 : -25);
    const y = this.sprite.y - 10;
    
    const leftTipX = x - 12;
    const leftTipY = y - 25;
    const rightTipX = x + 12;
    const rightTipY = y - 25;
    
    const pullBack = chargeAmount * 30;
    const direction = this.facingRight ? -1 : 1;
    
    const aimX = x + direction * pullBack;
    const aimY = y - 10;
    
    const bandWidth = 2 + chargeAmount * 4;
    
    this.band.lineStyle(bandWidth, 0xD4A574, 1);
    this.band.beginPath();
    this.band.moveTo(leftTipX, leftTipY);
    this.band.lineTo(aimX, aimY);
    this.band.lineTo(rightTipX, rightTipY);
    this.band.strokePath();
  }

  public getSlingshotTip(): { x: number; y: number } {
    const x = this.sprite.x + (this.facingRight ? 25 : -25);
    const y = this.sprite.y - 20;
    return { x, y };
  }

  public update(time: number, delta: number): void {
    if (this.isHit) {
      this.hitTimer -= delta;
      const flicker = Math.floor(this.hitTimer / 50) % 2 === 0;
      this.sprite.setTint(flicker ? 0xFF0000 : 0xFFFFFF);
      
      if (this.hitTimer <= 0) {
        this.isHit = false;
        this.sprite.clearTint();
      }
    }
    
    if (!this.isCharging) {
      this.updateMovement(delta);
    }
    
    this.updateAim();
    
    if (this.input.charge.isDown && !this.isCharging) {
      this.startCharge();
    }
    
    if (this.isCharging) {
      this.updateCharge(time);
      this.drawBand(this.chargePower);
    } else {
      this.drawBand(0);
    }
    
    this.updateSlingshotPosition();
    this.sprite.setFlipX(!this.facingRight);
  }

  private updateMovement(delta: number): void {
    const velocity = this.sprite.body!.velocity;
    
    if (this.input.left.isDown) {
      velocity.x = -this.MOVE_SPEED;
      this.facingRight = false;
    } else if (this.input.right.isDown) {
      velocity.x = this.MOVE_SPEED;
      this.facingRight = true;
    } else {
      velocity.x *= 0.8;
    }
  }

  private updateAim(): void {
    const pointer = this.scene.input.activePointer;
    const tip = this.getSlingshotTip();
    
    this.aimAngle = Phaser.Math.Angle.Between(
      tip.x, tip.y,
      pointer.x, pointer.y
    );
  }

  private startCharge(): void {
    this.isCharging = true;
    this.chargeStartTime = this.scene.time.now;
    this.chargePower = 0;
    
    const powerBar = document.getElementById('power-bar-container');
    if (powerBar) powerBar.style.display = 'block';
  }

  private updateCharge(time: number): void {
    const elapsed = time - this.chargeStartTime;
    this.chargePower = Phaser.Math.Clamp(
      (elapsed - this.MIN_CHARGE_TIME) / (this.MAX_CHARGE_TIME - this.MIN_CHARGE_TIME),
      0, 1
    );
    
    const powerFill = document.getElementById('power-bar-fill');
    if (powerFill) {
      powerFill.style.width = `${this.chargePower * 100}%`;
    }
  }

  public releaseCharge(): { power: number; angle: number } | null {
    if (!this.isCharging) return null;
    
    const powerBar = document.getElementById('power-bar-container');
    if (powerBar) powerBar.style.display = 'none';
    
    const elapsed = this.scene.time.now - this.chargeStartTime;
    this.isCharging = false;
    
    if (elapsed < this.MIN_CHARGE_TIME) {
      return null;
    }
    
    const power = 200 + this.chargePower * 400;
    this.chargePower = 0;
    
    const powerFill = document.getElementById('power-bar-fill');
    if (powerFill) powerFill.style.width = '0%';
    
    return { power, angle: this.aimAngle };
  }

  public takeHit(impactX: number): void {
    this.hp--;
    this.isHit = true;
    this.hitTimer = 300;
    
    const direction = impactX < this.sprite.x ? 1 : -1;
    this.sprite.setVelocity(direction * 200, -150);
    
    this.updateHpBar();
  }

  public updateHpBar(): void {
    const hpElement = document.getElementById(`player${this.id}-hp`);
    if (!hpElement) return;
    
    hpElement.innerHTML = '';
    
    for (let i = 0; i < this.maxHp; i++) {
      const segment = document.createElement('div');
      segment.style.cssText = `
        display: inline-block;
        width: ${100 / this.maxHp - 2}%;
        height: 100%;
        margin: 0 1%;
        clip-path: polygon(3% 0, 97% 0, 100% 20%, 97% 100%, 3% 100%, 0 80%);
      `;
      
      if (i < this.hp) {
        const healthRatio = (i + 1) / this.maxHp;
        const r = Math.floor(255 * (1 - healthRatio + 0.5));
        const g = Math.floor(200 * healthRatio);
        segment.style.background = `rgb(${r}, ${g}, 50)`;
      } else {
        segment.style.background = '#444444';
      }
      
      hpElement.appendChild(segment);
    }
  }

  public destroy(): void {
    this.sprite.destroy();
    this.slingshot.destroy();
    this.band.destroy();
  }
}
