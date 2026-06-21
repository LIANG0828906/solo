import Phaser from 'phaser';
import { MAX_REWIND_TIME, REWIND_FRAME_INTERVAL } from '../main';

export interface PlayerState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  facing: number;
  isJumping: boolean;
  gemCount: number;
  timestamp: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private stateHistory: PlayerState[] = [];
  private isRewinding = false;
  private rewindProgress = 0;
  private gemCount = 0;
  private baseSpeed = 320;
  private jumpForce = -520;
  private isDead = false;
  private spawnX = 100;
  private spawnY = 500;
  private particleManager!: Phaser.GameObjects.Particles.ParticleEmitter;
  private particleEmitter!: Phaser.GameObjects.Particles.ParticleEmitter | null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    this.spawnX = x;
    this.spawnY = y;
    this.createPlayerGraphics();
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setupPhysics();
    this.setupControls();
    this.setupParticles();
    this.setDepth(10);
  }

  private createPlayerGraphics(): void {
    const gfx = this.scene.add.graphics();
    gfx.fillStyle(0x7b2fbe, 1);
    gfx.fillRoundedRect(0, 0, 32, 48, 6);
    gfx.lineStyle(3, 0x00ffff, 1);
    gfx.strokeRoundedRect(0, 0, 32, 48, 6);
    gfx.fillStyle(0x39ff14, 1);
    gfx.fillCircle(10, 18, 5);
    gfx.fillCircle(22, 18, 5);
    gfx.fillStyle(0x000000, 1);
    gfx.fillCircle(11, 18, 2);
    gfx.fillCircle(23, 18, 2);
    const textureKey = 'player';
    if (!this.scene.textures.exists(textureKey)) {
      gfx.generateTexture(textureKey, 32, 48);
    }
    gfx.destroy();
    this.setTexture(textureKey);
    this.setOrigin(0.5, 0.5);
  }

  private setupPhysics(): void {
    this.setBounce(0.1);
    this.setCollideWorldBounds(true);
    this.setSize(28, 44);
    this.setOffset(2, 2);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.maxVelocity.x = 500;
    body.maxVelocity.y = 1000;
  }

  private setupControls(): void {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      W: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }

  private setupParticles(): void {
    this.particleManager = this.scene.add.particles(0, 0, 'particle', {
      lifespan: 300,
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.1, end: 0 },
      quantity: 0
    });
    this.particleManager.setDepth(9);
    this.particleEmitter = this.particleManager;
  }

  update(time: number, delta: number): void {
    if (this.isDead) return;

    if (this.isRewinding) {
      this.updateRewind(delta);
    } else {
      this.updateMovement();
      this.recordState(time);
    }
  }

  private updateMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let moveX = 0;

    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      moveX = -1;
      this.setFlipX(true);
    }
    if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      moveX = 1;
      this.setFlipX(false);
    }

    body.setVelocityX(moveX * this.baseSpeed);

    const jumpPressed = this.cursors.up.isDown || this.wasdKeys.W.isDown || this.cursors.space.isDown;
    if (jumpPressed && body.blocked.down) {
      body.setVelocityY(this.jumpForce);
      this.playJumpEffect();
    }
  }

  private playJumpEffect(): void {
    if (this.particleEmitter) {
      this.particleEmitter.setPosition(this.x, this.y + 24);
      this.particleEmitter.explode(5);
    }
  }

  private recordState(currentTime: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const state: PlayerState = {
      x: this.x,
      y: this.y,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      facing: this.flipX ? -1 : 1,
      isJumping: !body.blocked.down,
      gemCount: this.gemCount,
      timestamp: currentTime
    };

    this.stateHistory.push(state);

    const cutoffTime = currentTime - MAX_REWIND_TIME;
    while (this.stateHistory.length > 0 && this.stateHistory[0].timestamp < cutoffTime) {
      this.stateHistory.shift();
    }

    const maxFrames = Math.floor(MAX_REWIND_TIME / REWIND_FRAME_INTERVAL) + 60;
    while (this.stateHistory.length > maxFrames) {
      this.stateHistory.shift();
    }
  }

  public startRewind(): void {
    if (this.stateHistory.length < 2 || this.isRewinding) return;
    this.isRewinding = true;
    this.rewindProgress = this.stateHistory.length - 1;
    (this.body as Phaser.Physics.Arcade.Body).setEnable(false);
  }

  public stopRewind(): PlayerState | null {
    if (!this.isRewinding) return null;
    this.isRewinding = false;
    (this.body as Phaser.Physics.Arcade.Body).setEnable(true);

    const targetIdx = Math.max(0, Math.floor(this.rewindProgress));
    const state = this.stateHistory[targetIdx];

    if (state) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      this.setPosition(state.x, state.y);
      this.setFlipX(state.facing < 0);
      this.gemCount = state.gemCount;
      body.velocity.set(state.velocityX, state.velocityY);
    }

    this.stateHistory = this.stateHistory.slice(0, targetIdx + 1);
    return state;
  }

  private updateRewind(delta: number): void {
    if (this.stateHistory.length < 2) {
      this.stopRewind();
      return;
    }

    const rewindSpeed = 2.5;
    this.rewindProgress -= (delta / REWIND_FRAME_INTERVAL) * rewindSpeed;

    if (this.rewindProgress <= 0) {
      this.rewindProgress = 0;
      this.stopRewind();
      return;
    }

    const idx = Math.floor(this.rewindProgress);
    const t = this.rewindProgress - idx;
    const prev = this.stateHistory[Math.min(idx + 1, this.stateHistory.length - 1)];
    const curr = this.stateHistory[idx];

    if (prev && curr) {
      this.x = prev.x + (curr.x - prev.x) * t;
      this.y = prev.y + (curr.y - prev.y) * t;
      this.setFlipX(curr.facing < 0);
      this.gemCount = Math.round(prev.gemCount + (curr.gemCount - prev.gemCount) * t);
    }
  }

  public collectGem(): void {
    this.gemCount++;
  }

  public getGemCount(): number {
    return this.gemCount;
  }

  public setGemCount(count: number): void {
    this.gemCount = count;
  }

  public isInRewind(): boolean {
    return this.isRewinding;
  }

  public getRewindProgress(): number {
    if (!this.isRewinding) return 0;
    return 1 - (this.rewindProgress / Math.max(1, this.stateHistory.length - 1));
  }

  public die(spawnCallback?: () => void): void {
    if (this.isDead) return;
    this.isDead = true;
    this.playDeathEffect(() => {
      this.respawn();
      this.isDead = false;
      this.clearHistory();
      if (spawnCallback) spawnCallback();
    });
  }

  private playDeathEffect(callback: () => void): void {
    if (this.particleEmitter) {
      this.particleEmitter.setPosition(this.x, this.y);
      this.particleEmitter.explode(20);
    }
    this.setVisible(false);
    this.scene.time.delayedCall(500, callback);
  }

  public respawn(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setPosition(this.spawnX, this.spawnY);
    body.velocity.set(0, 0);
    this.setVisible(true);
    this.gemCount = 0;
    this.playSpawnEffect();
  }

  private playSpawnEffect(): void {
    if (this.particleEmitter) {
      this.particleEmitter.setPosition(this.x, this.y + 24);
      this.particleEmitter.setConfig({
        speedX: { min: -200, max: 200 },
        speedY: { min: -300, max: -50 }
      });
      this.particleEmitter.explode(15);
      this.particleEmitter.setConfig({
        speedX: undefined,
        speedY: undefined,
        speed: { min: 50, max: 200 }
      });
    }
  }

  public setCheckpoint(x: number, y: number): void {
    this.spawnX = x;
    this.spawnY = y;
  }

  public clearHistory(): void {
    this.stateHistory = [];
  }
}
