import Phaser from 'phaser';

export type PowerUpType = 'expand' | 'multiball' | 'fireball';

export interface PowerUpConfig {
  type: PowerUpType;
  color: number;
  glowColor: string;
  label: string;
}

export const POWERUP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  expand: { type: 'expand', color: 0x00ff88, glowColor: '#00ff88', label: '+' },
  multiball: { type: 'multiball', color: 0x00aaff, glowColor: '#00aaff', label: '≡' },
  fireball: { type: 'fireball', color: 0xff3333, glowColor: '#ff3333', label: '🔥' }
};

export interface PowerUpActivatedEvent {
  type: PowerUpType;
  x: number;
  y: number;
}

export class PowerUpManager {
  private scene: Phaser.Scene;
  private powerUps!: Phaser.Physics.Arcade.Group;
  private fallSpeed: number = 200;
  private dropChance: number = 0.2;
  public onPowerUpActivated: Phaser.Events.EventEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.onPowerUpActivated = new Phaser.Events.EventEmitter();
    this.powerUps = this.scene.physics.add.group({
      allowGravity: false,
      immovable: false
    });
  }

  trySpawnPowerUp(x: number, y: number): void {
    if (Math.random() < this.dropChance) {
      this.spawnPowerUp(x, y);
    }
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['expand', 'multiball', 'fireball'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWERUP_CONFIGS[type];

    const key = `powerup-${type}`;
    this.createPowerUpTexture(key, config);

    const powerUp = this.powerUps.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
    powerUp.setData('type', type);
    powerUp.setVelocityY(this.fallSpeed);
    powerUp.setCollideWorldBounds(false);
    powerUp.setDisplaySize(32, 32);

    this.scene.tweens.add({
      targets: powerUp,
      angle: { from: 0, to: 360 },
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  private createPowerUpTexture(key: string, config: PowerUpConfig): void {
    if (this.scene.textures.exists(key)) return;

    const size = 40;
    const texture = this.scene.textures.createCanvas(key, size, size);
    const ctx = texture.getContext();

    ctx.shadowColor = config.glowColor;
    ctx.shadowBlur = 15;

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#' + config.color.toString(16).padStart(6, '0'));
    gradient.addColorStop(1, '#ffffff');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(4, 4, size - 8, size - 8, 6);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.label, size / 2, size / 2);

    texture.refresh();
  }

  update(): void {
    const height = this.scene.cameras.main.height;
    this.powerUps.getChildren().forEach(child => {
      const powerUp = child as Phaser.Physics.Arcade.Sprite;
      if (powerUp.y > height + 50) {
        this.powerUps.remove(powerUp, true, true);
      }
    });
  }

  handlePaddleCollision(paddle: Phaser.GameObjects.GameObject): void {
    this.scene.physics.overlap(paddle, this.powerUps, (_, powerUp) => {
      const pu = powerUp as Phaser.Physics.Arcade.Sprite;
      const type = pu.getData('type') as PowerUpType;
      const x = pu.x;
      const y = pu.y;

      this.createCollectParticles(x, y, POWERUP_CONFIGS[type]);
      this.onPowerUpActivated.emit('activate', { type, x, y } as PowerUpActivatedEvent);
      this.powerUps.remove(pu, true, true);
    });
  }

  private createCollectParticles(x: number, y: number, config: PowerUpConfig): void {
    this.scene.particles.createEmitter({
      x: x,
      y: y,
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      lifespan: 400,
      scale: { start: 1, end: 0 },
      quantity: 15,
      tint: config.color,
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      on: true
    }).explode(15, x, y);
  }

  getGroup(): Phaser.Physics.Arcade.Group {
    return this.powerUps;
  }

  clear(): void {
    this.powerUps.clear(true, true);
  }
}
