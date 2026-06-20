import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };

  private obstacles!: Phaser.Physics.Arcade.Group;
  private starDusts!: Phaser.Physics.Arcade.Group;
  private starTrail!: Phaser.GameObjects.TileSprite;
  private bgStars!: Phaser.GameObjects.TileSprite;

  private baseSpeed: number = 3;
  private currentSpeed: number = 3;
  private obstacleTimer!: Phaser.Time.TimerEvent;
  private starDustTimer!: Phaser.Time.TimerEvent;

  private audioContext!: AudioContext;
  private score: number = 0;
  private starDust: number = 0;
  private isInvincible: boolean = false;
  private playerSpeed: number = 6;

  private collectEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private explosionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private engineEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  private starBurstFlash!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'GameScene', active: true });
  }

  init(): void {
    this.score = 0;
    this.starDust = 0;
    this.currentSpeed = this.baseSpeed;
    this.isInvincible = false;
    this.registry.set('score', 0);
    this.registry.set('starDust', 0);
  }

  create(): void {
    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const { width, height } = this.cameras.main;

    this.createParticleTexture();
    this.createBackground(width, height);
    this.createPlayer(width, height);
    this.createGroups();
    this.createEmitters();
    this.createControls();
    this.createTimers();
    this.createCollisions();
    this.createStarBurstEffect(width, height);

    this.scale.on('resize', this.handleResize, this);
  }

  private createParticleTexture(): void {
    const g = this.make.graphics();
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(2, 2, 2);
    g.generateTexture('particleTexture', 4, 4);
    g.destroy();
  }

  private createBackground(width: number, height: number): void {
    const bgGraphics = this.make.graphics();
    bgGraphics.fillStyle(0x0B0F2A, 1);
    bgGraphics.fillRect(0, 0, 10, height);
    for (let i = 0; i < 50; i++) {
      bgGraphics.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.3, 0.8));
      bgGraphics.fillPoint(
        Phaser.Math.Between(0, 10),
        Phaser.Math.Between(0, height)
      );
    }
    bgGraphics.generateTexture('bgStars', 10, height);
    bgGraphics.destroy();
    this.bgStars = this.add.tileSprite(width / 2, height / 2, width, height, 'bgStars');
    this.bgStars.setDepth(0);

    const trailGraphics = this.make.graphics();
    trailGraphics.fillGradientStyle(0x7B2FF7, 0xFF4B8B, 0x7B2FF7, 0xFF4B8B, 0.3);
    trailGraphics.fillRect(0, 0, width * 0.6, height);

    for (let i = 0; i < 3; i++) {
      const lineY = (height / 4) * (i + 1);
      trailGraphics.lineStyle(2, 0x7B2FF7, 0.5);
      trailGraphics.beginPath();
      trailGraphics.moveTo(0, lineY);
      for (let x = 0; x < width * 0.6; x += 20) {
        const wave = Math.sin(x * 0.02 + i) * 5;
        trailGraphics.lineTo(x, lineY + wave);
      }
      trailGraphics.strokePath();
    }

    trailGraphics.generateTexture('starTrail', Math.floor(width * 0.6), height);
    trailGraphics.destroy();
    this.starTrail = this.add.tileSprite(width / 2, height / 2, width * 0.6, height, 'starTrail');
    this.starTrail.setDepth(1);
    this.starTrail.setAlpha(0.8);
  }

  private createPlayer(width: number, height: number): void {
    const playerGraphics = this.make.graphics();
    playerGraphics.fillStyle(0x7B2FF7, 1);
    playerGraphics.beginPath();
    playerGraphics.moveTo(0, -20);
    playerGraphics.lineTo(15, 15);
    playerGraphics.lineTo(0, 8);
    playerGraphics.lineTo(-15, 15);
    playerGraphics.closePath();
    playerGraphics.fill();
    playerGraphics.fillStyle(0xFF4B8B, 1);
    playerGraphics.beginPath();
    playerGraphics.moveTo(0, -15);
    playerGraphics.lineTo(8, 8);
    playerGraphics.lineTo(0, 4);
    playerGraphics.lineTo(-8, 8);
    playerGraphics.closePath();
    playerGraphics.fill();
    playerGraphics.generateTexture('playerShip', 30, 35);
    playerGraphics.destroy();

    this.player = this.physics.add.image(width / 2, height * 0.75, 'playerShip');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0);
    this.player.setDepth(10);
    this.player.setSize(20, 25);
  }

  private createGroups(): void {
    this.obstacles = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.starDusts = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });
  }

  private createEmitters(): void {
    this.collectEmitter = this.add.particles(0, 0, 'particleTexture', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      lifespan: 500,
      quantity: 15,
      tint: 0xFFD700,
      emitting: false
    });

    this.explosionEmitter = this.add.particles(0, 0, 'particleTexture', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 800,
      quantity: 30,
      tint: 0xFF4B8B,
      emitting: false
    });

    this.engineEmitter = this.add.particles(0, 0, 'particleTexture', {
      speed: { min: 30, max: 80 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.5, end: 0 },
      lifespan: 300,
      quantity: 3,
      tint: [0x7B2FF7, 0xFF4B8B],
      follow: this.player,
      followOffset: { x: 0, y: 18 }
    });
  }

  private createControls(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.wasdKeys = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };

    this.wasdKeys.space.on('down', () => {
      if (this.starDust >= 10) {
        this.triggerStarBurst();
      }
    });
  }

  private createTimers(): void {
    this.obstacleTimer = this.time.addEvent({
      delay: 1500,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });

    this.starDustTimer = this.time.addEvent({
      delay: 2000,
      callback: this.spawnStarDust,
      callbackScope: this,
      loop: true
    });
  }

  private createCollisions(): void {
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      (_obj1, _obj2) => this.hitObstacle(),
      () => !this.isInvincible,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.starDusts,
      (_obj1, obj2) => this.collectStarDust(obj2 as Phaser.Physics.Arcade.Image),
      undefined,
      this
    );
  }

  private createStarBurstEffect(width: number, height: number): void {
    this.starBurstFlash = this.add.rectangle(
      width / 2, height / 2, width, height, 0xFFFFFF, 0
    ).setScrollFactor(0).setDepth(50);
  }

  private spawnObstacle(): void {
    const { width } = this.cameras.main;
    const types: string[] = ['asteroid', 'blackhole', 'storm'];
    const type = Phaser.Utils.Array.GetRandom(types);

    const x = Phaser.Math.Between(80, width - 80);
    const y = -50;

    let obstacle: Phaser.Physics.Arcade.Image;

    if (type === 'asteroid') {
      obstacle = this.createAsteroid(x, y);
    } else if (type === 'blackhole') {
      obstacle = this.createBlackHole(x, y);
    } else {
      obstacle = this.createEnergyStorm(x, y);
    }

    this.obstacles.add(obstacle);
  }

  private createAsteroid(x: number, y: number): Phaser.Physics.Arcade.Image {
    const size = Phaser.Math.Between(25, 45);
    const textureKey = `asteroid_${Date.now()}_${Phaser.Math.Between(0, 10000)}`;
    const g = this.make.graphics();
    g.fillStyle(0xCC0000, 1);
    g.beginPath();
    const points = 8;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = size * Phaser.Math.FloatBetween(0.7, 1);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
    g.lineStyle(3, 0xFF4444, 1);
    g.strokePath();
    g.generateTexture(textureKey, size * 2.2, size * 2.2);
    g.destroy();

    const asteroid = this.physics.add.image(x, y, textureKey);
    asteroid.setData('type', 'asteroid');
    asteroid.setAngularVelocity(Phaser.Math.FloatBetween(-50, 50));
    asteroid.setSize(size * 1.5, size * 1.5);
    return asteroid;
  }

  private createBlackHole(x: number, y: number): Phaser.Physics.Arcade.Image {
    const size = 50;
    const textureKey = `blackhole_${Date.now()}_${Phaser.Math.Between(0, 10000)}`;
    const g = this.make.graphics();
    for (let i = 5; i > 0; i--) {
      const alpha = i * 0.15;
      g.fillStyle(0x220044, alpha);
      g.fillCircle(0, 0, size * (i / 5));
    }
    g.fillStyle(0x000000, 1);
    g.fillCircle(0, 0, size * 0.3);
    g.lineStyle(2, 0x7B2FF7, 0.8);
    g.beginPath();
    g.arc(0, 0, size * 0.8, 0, Math.PI * 2);
    g.strokePath();
    g.generateTexture(textureKey, size * 2.2, size * 2.2);
    g.destroy();

    const blackhole = this.physics.add.image(x, y, textureKey);
    blackhole.setData('type', 'blackhole');
    blackhole.setSize(size * 1.2, size * 1.2);
    return blackhole;
  }

  private createEnergyStorm(x: number, y: number): Phaser.Physics.Arcade.Image {
    const size = 60;
    const textureKey = `storm_${Date.now()}_${Phaser.Math.Between(0, 10000)}`;
    const g = this.make.graphics();
    for (let i = 0; i < 5; i++) {
      g.lineStyle(3, 0xCC0000, 0.7);
      g.beginPath();
      let lx = 0, ly = -size;
      g.moveTo(lx, ly);
      for (let j = 0; j < 6; j++) {
        lx += Phaser.Math.FloatBetween(-size * 0.3, size * 0.3);
        ly += size * 0.3;
        g.lineTo(lx, ly);
      }
      g.strokePath();
    }
    g.generateTexture(textureKey, size * 2, size * 2);
    g.destroy();

    const storm = this.physics.add.image(x, y, textureKey);
    storm.setData('type', 'storm');
    storm.setSize(size, size);
    return storm;
  }

  private spawnStarDust(): void {
    const { width } = this.cameras.main;
    const count = Phaser.Math.Between(1, 3);

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(80, width - 80);
      const y = -30 - i * 40;

      const textureKey = `stardust_${Date.now()}_${i}_${Phaser.Math.Between(0, 10000)}`;
      const g = this.make.graphics();
      g.fillStyle(0xFFD700, 1);
      g.beginPath();
      for (let j = 0; j < 5; j++) {
        const angle = (j / 5) * Math.PI * 2 - Math.PI / 2;
        const outerX = Math.cos(angle) * 12;
        const outerY = Math.sin(angle) * 12;
        const innerAngle = angle + Math.PI / 5;
        const innerX = Math.cos(innerAngle) * 5;
        const innerY = Math.sin(innerAngle) * 5;
        if (j === 0) g.moveTo(outerX, outerY);
        else g.lineTo(outerX, outerY);
        g.lineTo(innerX, innerY);
      }
      g.closePath();
      g.fill();
      g.generateTexture(textureKey, 28, 28);
      g.destroy();

      const starDust = this.physics.add.image(x, y, textureKey);
      starDust.setData('collected', false);
      starDust.setAngularVelocity(100);
      starDust.setSize(20, 20);
      this.starDusts.add(starDust);
    }
  }

  private collectStarDust(starDust: Phaser.Physics.Arcade.Image): void {
    if (starDust.getData('collected')) return;
    starDust.setData('collected', true);

    this.collectEmitter.explode(15, starDust.x, starDust.y);
    this.playCollectSound();

    starDust.destroy();

    this.starDust++;
    this.registry.set('starDust', this.starDust);

    if (this.starDust >= 10) {
      this.showStarBurstHint();
    }
  }

  private showStarBurstHint(): void {
    const { width, height } = this.cameras.main;
    const hint = this.add.text(width / 2, height * 0.3, '按空格键释放星爆！', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#00FF00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);

    hint.setShadow(2, 2, '#00FF00', 4, true, true);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      scale: 1.2,
      duration: 1500,
      ease: 'Power2.out',
      onComplete: () => hint.destroy()
    });
  }

  private triggerStarBurst(): void {
    this.starDust = 0;
    this.registry.set('starDust', 0);

    this.playStarBurstSound();

    this.tweens.add({
      targets: this.starBurstFlash,
      fillAlpha: 1,
      duration: 100,
      yoyo: true,
      repeat: 3
    });

    this.explosionEmitter.explode(50, this.player.x, this.player.y);

    const { width, height } = this.cameras.main;
    const burstRadius = Math.max(width, height);

    this.obstacles.getChildren().forEach((obs) => {
      const obstacle = obs as Phaser.Physics.Arcade.Image;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        obstacle.x, obstacle.y
      );
      if (dist < burstRadius) {
        this.explosionEmitter.explode(20, obstacle.x, obstacle.y);
        obstacle.destroy();
      }
    });

    this.isInvincible = true;
    this.player.setAlpha(0.5);

    const blink = this.time.addEvent({
      delay: 150,
      callback: () => {
        this.player.setAlpha(this.player.alpha === 0.5 ? 1 : 0.5);
      },
      loop: true
    });

    this.time.delayedCall(2000, () => {
      this.isInvincible = false;
      this.player.setAlpha(1);
      blink.remove();
    });
  }

  private hitObstacle(): void {
    this.explosionEmitter.explode(40, this.player.x, this.player.y);
    this.playExplosionSound();

    this.cameras.main.shake(300, 0.02);

    this.gameOver();
  }

  private gameOver(): void {
    this.obstacleTimer.remove();
    this.starDustTimer.remove();
    this.engineEmitter.stop();

    this.scene.pause();
    this.scene.launch('EndScene', { score: this.score });
  }

  private playCollectSound(): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.audioContext.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  private playExplosionSound(): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);
  }

  private playStarBurstSound(): void {
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioContext.destination);
    osc1.frequency.setValueAtTime(440, this.audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1760, this.audioContext.currentTime + 0.2);
    osc2.frequency.setValueAtTime(660, this.audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(2200, this.audioContext.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    osc1.start();
    osc2.start();
    osc1.stop(this.audioContext.currentTime + 0.4);
    osc2.stop(this.audioContext.currentTime + 0.4);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.player.setCollideWorldBounds(true);
    if (this.bgStars) {
      this.bgStars.setPosition(gameSize.width / 2, gameSize.height / 2);
      this.bgStars.setSize(gameSize.width, gameSize.height);
    }
    if (this.starTrail) {
      this.starTrail.setPosition(gameSize.width / 2, gameSize.height / 2);
      this.starTrail.setSize(gameSize.width * 0.6, gameSize.height);
    }
    if (this.starBurstFlash) {
      this.starBurstFlash.setPosition(gameSize.width / 2, gameSize.height / 2);
      this.starBurstFlash.setSize(gameSize.width, gameSize.height);
    }
  }

  update(_time: number, delta: number): void {
    if (!this.player.active) return;

    this.currentSpeed = this.baseSpeed + (this.score / 500);
    const newDelay = Math.max(600, 1500 - this.score * 0.5);
    if (Math.abs(this.obstacleTimer.delay - newDelay) > 100) {
      this.obstacleTimer.reset({
        delay: newDelay,
        callback: this.spawnObstacle,
        callbackScope: this,
        loop: true
      });
    }

    this.bgStars.tilePositionY += this.currentSpeed * 0.5 * (delta / 16.67);
    this.starTrail.tilePositionY += this.currentSpeed * (delta / 16.67);

    this.score += this.currentSpeed * 0.1 * (delta / 16.67);
    this.registry.set('score', this.score);

    this.updatePlayerMovement(delta);

    this.obstacles.getChildren().forEach((obs) => {
      const obstacle = obs as Phaser.Physics.Arcade.Image;
      obstacle.y += this.currentSpeed * (delta / 16.67);

      const type = obstacle.getData('type');
      if (type === 'blackhole') {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          obstacle.x, obstacle.y
        );
        if (dist < 150 && dist > 0) {
          const pullStrength = 0.5 * (150 - dist) / 150;
          const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            obstacle.x, obstacle.y
          );
          this.player.x += Math.cos(angle) * pullStrength * (delta / 16.67);
          this.player.y += Math.sin(angle) * pullStrength * (delta / 16.67);
        }
        obstacle.angle += 0.5;
      } else if (type === 'storm') {
        obstacle.angle += 1;
      }

      if (obstacle.y > this.cameras.main.height + 100) {
        obstacle.destroy();
      }
    });

    this.starDusts.getChildren().forEach((sd) => {
      const starDust = sd as Phaser.Physics.Arcade.Image;
      starDust.y += this.currentSpeed * 0.8 * (delta / 16.67);
      if (starDust.y > this.cameras.main.height + 50) {
        starDust.destroy();
      }
    });
  }

  private updatePlayerMovement(delta: number): void {
    const speed = this.playerSpeed * (delta / 16.67);
    let moveX = 0;
    let moveY = 0;

    if (this.cursors.left.isDown || this.wasdKeys.left.isDown) {
      moveX = -1;
    } else if (this.cursors.right.isDown || this.wasdKeys.right.isDown) {
      moveX = 1;
    }

    if (this.cursors.up.isDown || this.wasdKeys.up.isDown) {
      moveY = -1;
    } else if (this.cursors.down.isDown || this.wasdKeys.down.isDown) {
      moveY = 1;
    }

    if (moveX !== 0 && moveY !== 0) {
      const factor = 1 / Math.sqrt(2);
      moveX *= factor;
      moveY *= factor;
    }

    this.player.x += moveX * speed;
    this.player.y += moveY * speed;

    const tilt = moveX * 15;
    this.player.rotation = Phaser.Math.DegToRad(tilt);
  }
}
