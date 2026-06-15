import Phaser from 'phaser';
import { ResourceLoader } from '../utils/ResourceLoader';
import { DifficultyManager } from '../ai/DifficultyManager';
import { EnemySpawner } from '../ai/EnemySpawner';
import { Enemy } from './Enemy';

export class GameScene extends Phaser.Scene {
  private resourceLoader!: ResourceLoader;
  private difficultyManager!: DifficultyManager;
  private enemySpawner!: EnemySpawner;

  private player!: Phaser.Physics.Arcade.Image;
  private playerBody!: Phaser.GameObjects.Arc;
  private playerDirectionIndicator!: Phaser.GameObjects.Arc;
  private playerHealth: number = 100;
  private playerMaxHealth: number = 100;
  private playerSpeed: number = 180;
  private playerFacingAngle: number = -Math.PI / 2;

  private attackCooldown: number = 300;
  private lastAttackTime: number = 0;
  private attackRange: number = 70;
  private attackDamage: number = 25;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private keysW: Phaser.Input.Keyboard.Key | null = null;
  private keysA: Phaser.Input.Keyboard.Key | null = null;
  private keysS: Phaser.Input.Keyboard.Key | null = null;
  private keysD: Phaser.Input.Keyboard.Key | null = null;

  private killCount: number = 0;
  private levelStartTime: number = 0;

  private healthBar!: Phaser.GameObjects.Graphics;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private difficultyStarsContainer!: Phaser.GameObjects.Container;
  private cooldownCircle!: Phaser.GameObjects.Graphics;
  private difficultyFlashRect!: Phaser.GameObjects.Rectangle;

  private isMobile: boolean = false;
  private scaleFactor: number = 1;
  private touchJoystick: { active: boolean; x: number; y: number } = { active: false, x: 0, y: 0 };
  private touchAttackButton: Phaser.GameObjects.Arc | null = null;
  private touchJoystickBase: Phaser.GameObjects.Arc | null = null;
  private touchJoystickKnob: Phaser.GameObjects.Arc | null = null;

  private attackVisuals: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    this.resourceLoader = new ResourceLoader(this);
  }

  async create(): Promise<void> {
    await this.resourceLoader.loadResources();

    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS || this.scale.width < 800;
    this.scaleFactor = this.isMobile ? 0.7 : 1.0;

    this.difficultyManager = new DifficultyManager();
    this.enemySpawner = new EnemySpawner(this, this.difficultyManager);

    this.setupInput();
    this.createBackground();
    this.createPlayer();
    this.createUI();
    this.setupCollisions();

    this.difficultyManager.setOnDifficultyChange((level) => {
      this.onDifficultyChanged(level);
    });

    this.enemySpawner.start();
    this.levelStartTime = Date.now();
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keysW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keysA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keysS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keysD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    if (this.isMobile) {
      this.setupTouchControls();
    }
  }

  private setupTouchControls(): void {
    const { width, height } = this.scale;
    const joystickRadius = 50;
    const knobRadius = 25;
    const margin = 80;

    this.touchJoystickBase = this.add.circle(margin, height - margin, joystickRadius, 0x3c5a3c, 0.5)
      .setScrollFactor(0)
      .setDepth(1000)
      .setStrokeStyle(2, 0x1a2a1a, 1);

    this.touchJoystickKnob = this.add.circle(margin, height - margin, knobRadius, 0xe67300, 0.8)
      .setScrollFactor(0)
      .setDepth(1001);

    this.touchAttackButton = this.add.circle(width - margin, height - margin, 40, 0xe67300, 0.7)
      .setScrollFactor(0)
      .setDepth(1000)
      .setStrokeStyle(3, 0x1a2a1a, 1);

    const attackText = this.add.text(width - margin, height - margin, 'ATK', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    let joystickPointerId: number | null = null;
    let attackPointerId: number | null = null;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (joystickPointerId === null) {
        const baseDist = Phaser.Math.Distance.Between(pointer.x, pointer.y, margin, height - margin);
        if (baseDist < joystickRadius * 2) {
          joystickPointerId = pointer.id;
          this.touchJoystick.active = true;
        }
      }
      if (attackPointerId === null && this.touchAttackButton) {
        const attackDist = Phaser.Math.Distance.Between(pointer.x, pointer.y, width - margin, height - margin);
        if (attackDist < 60) {
          attackPointerId = pointer.id;
          this.performAttack();
        }
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === joystickPointerId && this.touchJoystickBase && this.touchJoystickKnob) {
        let dx = pointer.x - margin;
        let dy = pointer.y - (height - margin);
        const dist = Math.hypot(dx, dy);
        const maxDist = joystickRadius - knobRadius;

        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }

        this.touchJoystickKnob.x = margin + dx;
        this.touchJoystickKnob.y = height - margin + dy;
        this.touchJoystick.x = dx / maxDist;
        this.touchJoystick.y = dy / maxDist;
      }
    });

    const resetJoystick = () => {
      if (this.touchJoystickKnob) {
        this.touchJoystickKnob.x = margin;
        this.touchJoystickKnob.y = height - margin;
      }
      this.touchJoystick.active = false;
      this.touchJoystick.x = 0;
      this.touchJoystick.y = 0;
    };

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === joystickPointerId) {
        joystickPointerId = null;
        resetJoystick();
      }
      if (pointer.id === attackPointerId) {
        attackPointerId = null;
      }
    });

    this.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === joystickPointerId) {
        joystickPointerId = null;
        resetJoystick();
      }
      if (pointer.id === attackPointerId) {
        attackPointerId = null;
      }
    });
  }

  private createBackground(): void {
    const { width, height } = this.scale;

    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x1a2a1a, 1);
    bgGraphics.fillRect(0, 0, width, height);

    const treeCount = Math.floor((width * height) / 40000);
    for (let i = 0; i < treeCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 15 + Math.random() * 25;
      const shade = 0x2a4a2a + Math.floor(Math.random() * 0x101010);
      const tree = this.add.circle(x, y, size, shade, 0.4);
      tree.setDepth(-10);

      this.add.circle(x, y, size * 0.7, 0x1a3a1a, 0.3).setDepth(-11);
    }

    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      this.add.circle(x, y, 2 + Math.random() * 3, 0x4a6a4a, 0.3).setDepth(-5);
    }
  }

  private createPlayer(): void {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    this.playerBody = this.add.circle(0, 0, 16 * this.scaleFactor, 0x4a7a4a, 1)
      .setStrokeStyle(3, 0x2a4a2a, 1);

    this.playerDirectionIndicator = this.add.circle(0, -10 * this.scaleFactor, 5 * this.scaleFactor, 0xe67300, 1);

    const playerContainer = this.add.container(centerX, centerY, [this.playerBody, this.playerDirectionIndicator]);
    playerContainer.setSize(32 * this.scaleFactor, 32 * this.scaleFactor);

    this.physics.add.existing(playerContainer);
    this.player = playerContainer as unknown as Phaser.Physics.Arcade.Image;

    const playerPhysicsBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerPhysicsBody.setCircle(16 * this.scaleFactor);
    playerPhysicsBody.setCollideWorldBounds(true);
    playerPhysicsBody.setDamping(true);
    playerPhysicsBody.setDrag(0.92, 0.92);
  }

  private createUI(): void {
    const { width, height } = this.scale;

    this.difficultyFlashRect = this.add.rectangle(
      width / 2, height / 2,
      width, height,
      0xffffff, 0
    ).setScrollFactor(0).setDepth(100);

    const uiScale = this.scaleFactor;

    this.healthBarBg = this.add.graphics();
    this.healthBarBg.setScrollFactor(0).setDepth(50);

    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0).setDepth(51);

    this.scoreText = this.add.text(20 * uiScale, 55 * uiScale, '', {
      fontSize: `${16 * uiScale}px`,
      fontFamily: 'Courier New',
      color: '#e67300',
      fontStyle: 'bold',
      backgroundColor: 'rgba(26, 42, 26, 0.75)',
      padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(52);

    this.difficultyStarsContainer = this.add.container(20 * uiScale, height - 40 * uiScale);
    this.difficultyStarsContainer.setScrollFactor(0).setDepth(52);

    this.cooldownCircle = this.add.graphics();
    this.cooldownCircle.setScrollFactor(0).setDepth(52);

    this.updateUI();
  }

  private updateUI(): void {
    if (!this.scoreText || !this.healthBar || !this.healthBarBg) return;
    const { width, height } = this.scale;
    const uiScale = this.scaleFactor;

    const healthBarWidth = 200 * uiScale;
    const healthBarHeight = 18 * uiScale;
    const healthBarX = 20 * uiScale;
    const healthBarY = 20 * uiScale;

    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(0x0a1a0a, 0.8);
    this.healthBarBg.fillRoundedRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 6 * uiScale);
    this.healthBarBg.lineStyle(2, 0x3c5a3c, 1);
    this.healthBarBg.strokeRoundedRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 6 * uiScale);

    const healthRatio = Math.max(0, this.playerHealth / this.playerMaxHealth);
    const greenColor = Phaser.Display.Color.GetColor(0, Math.floor(255 * (1 - (1 - healthRatio) * 0.5)), Math.floor(100 * healthRatio));
    const healthColor = healthRatio > 0.5
      ? Phaser.Display.Color.Interpolate.ColorWithColor(
          { r: 255, g: 0, b: 0 },
          { r: 0, g: 200, b: 100 },
          100,
          Math.floor(healthRatio * 100)
        )
      : healthRatio > 0.25
      ? Phaser.Display.Color.Interpolate.ColorWithColor(
          { r: 255, g: 0, b: 0 },
          { r: 255, g: 200, b: 0 },
          100,
          Math.floor(healthRatio * 200)
        )
      : { r: 255, g: 50, b: 50 };

    const hColorInt = (healthColor.r << 16) | (healthColor.g << 8) | healthColor.b;

    this.healthBar.clear();
    this.healthBar.fillGradientStyle(
      hColorInt, hColorInt,
      this.darkenColorInt(hColorInt, 0.7), this.darkenColorInt(hColorInt, 0.7),
      1
    );
    this.healthBar.fillRoundedRect(
      healthBarX + 2,
      healthBarY + 2,
      (healthBarWidth - 4) * healthRatio,
      healthBarHeight - 4,
      4 * uiScale
    );

    const healthText = this.add.text(
      healthBarX + healthBarWidth / 2,
      healthBarY + healthBarHeight / 2,
      `${Math.ceil(this.playerHealth)}/${this.playerMaxHealth}`,
      {
        fontSize: `${12 * uiScale}px`,
        fontFamily: 'Courier New',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(53);

    this.time.delayedCall(16, () => healthText.destroy());

    this.scoreText.setText(`击杀: ${this.killCount}`);

    if (!this.difficultyStarsContainer) return;
    this.difficultyStarsContainer.removeAll(true);
    const level = this.difficultyManager.getCurrentLevel();
    const bgRect = this.add.rectangle(0, 0, 140 * uiScale, 32 * uiScale, 0x1a2a1a, 0.75)
      .setStrokeStyle(2, 0x3c5a3c, 1)
      .setOrigin(0, 0.5);
    this.difficultyStarsContainer.add(bgRect);

    const starText = this.add.text(8 * uiScale, 0, '难度:', {
      fontSize: `${12 * uiScale}px`,
      fontFamily: 'Courier New',
      color: '#a0c0a0',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.difficultyStarsContainer.add(starText);

    for (let i = 0; i < 5; i++) {
      const starX = 60 * uiScale + i * 16 * uiScale;
      const starColor = i < level ? 0xe67300 : 0x3c5a3c;
      const star = this.createStar(starX, 0, 7 * uiScale, starColor);
      this.difficultyStarsContainer.add(star);
    }

    this.updateCooldownUI();
  }

  private darkenColorInt(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }

  private createStar(x: number, y: number, radius: number, color: number): Phaser.GameObjects.Polygon {
    const points: number[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? radius : radius * 0.45;
      points.push(x + Math.cos(angle) * r);
      points.push(y + Math.sin(angle) * r);
    }
    return this.add.polygon(0, 0, points, color, 1)
      .setStrokeStyle(1, 0x1a2a1a, 1);
  }

  private updateCooldownUI(): void {
    const { width, height } = this.scale;
    const uiScale = this.scaleFactor;
    const circleX = width - 50 * uiScale;
    const circleY = height - 50 * uiScale;
    const radius = 35 * uiScale;

    this.cooldownCircle.clear();

    this.cooldownCircle.lineStyle(1, 0x3c5a3c, 1);
    this.cooldownCircle.strokeCircle(circleX, circleY, radius);

    this.cooldownCircle.fillStyle(0x1a2a1a, 0.75);
    this.cooldownCircle.fillCircle(circleX, circleY, radius - 2);

    const now = Date.now();
    const elapsed = now - this.lastAttackTime;
    const progress = Math.min(1, elapsed / this.attackCooldown);

    this.cooldownCircle.lineStyle(5, 0xe67300, 1);
    this.cooldownCircle.beginPath();
    this.cooldownCircle.arc(circleX, circleY, radius - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
    this.cooldownCircle.strokePath();

    const cooldownText = this.add.text(circleX, circleY, 'ATK', {
      fontSize: `${12 * uiScale}px`,
      fontFamily: 'Courier New',
      color: progress >= 1 ? '#00ff88' : '#666666',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(53);

    this.time.delayedCall(16, () => cooldownText.destroy());
  }

  private setupCollisions(): void {
    this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
    });
  }

  update(time: number, delta: number): void {
    this.updatePlayerMovement(delta);
    this.checkAttackInput();

    const enemies = this.enemySpawner.getAllEnemies();
    for (const enemy of enemies) {
      if (enemy.isActive()) {
        enemy.setOnHitPlayerCallback((damage, srcEnemy) => {
          this.onEnemyHitPlayer(damage, srcEnemy);
        });

        this.checkEnemyBulletCollisions(enemy);
      }
    }

    this.enemySpawner.update(time, delta, this.player.x, this.player.y);
    this.checkPlayerEnemyCollisions();
    this.updateUI();

    this.difficultyManager.updateMetrics({
      playerHealth: this.playerHealth,
      killCount: this.killCount,
      levelTime: (Date.now() - this.levelStartTime) / 1000
    });
  }

  private updatePlayerMovement(delta: number): void {
    let moveX = 0;
    let moveY = 0;

    if (this.cursors.left.isDown || (this.keysA && this.keysA.isDown)) moveX -= 1;
    if (this.cursors.right.isDown || (this.keysD && this.keysD.isDown)) moveX += 1;
    if (this.cursors.up.isDown || (this.keysW && this.keysW.isDown)) moveY -= 1;
    if (this.cursors.down.isDown || (this.keysS && this.keysS.isDown)) moveY += 1;

    if (this.touchJoystick.active) {
      moveX += this.touchJoystick.x;
      moveY += this.touchJoystick.y;
    }

    const magnitude = Math.hypot(moveX, moveY);
    if (magnitude > 0) {
      moveX /= magnitude;
      moveY /= magnitude;

      const targetAngle = Math.atan2(moveY, moveX);
      this.playerFacingAngle = Phaser.Math.Angle.RotateTo(
        this.playerFacingAngle, targetAngle, 0.25
      );

      this.playerBody.rotation = this.playerFacingAngle + Math.PI / 2;
      this.playerDirectionIndicator.x = Math.cos(this.playerFacingAngle) * 10 * this.scaleFactor;
      this.playerDirectionIndicator.y = Math.sin(this.playerFacingAngle) * 10 * this.scaleFactor;

      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.velocity.x = moveX * this.playerSpeed;
      body.velocity.y = moveY * this.playerSpeed;
    } else {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.velocity.x *= 0.85;
      body.velocity.y *= 0.85;
    }
  }

  private checkAttackInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.performAttack();
    }
  }

  private performAttack(): void {
    const now = Date.now();
    if (now - this.lastAttackTime < this.attackCooldown) return;

    this.lastAttackTime = now;

    const attackAngle = this.playerFacingAngle;
    const attackSpread = Math.PI / 3;
    const halfSpread = attackSpread / 2;

    this.createAttackVisual(attackAngle, attackSpread);

    const enemies = this.enemySpawner.getActiveEnemies();
    for (const enemy of enemies) {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= this.attackRange) {
        const enemyAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(enemyAngle - attackAngle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        if (angleDiff <= halfSpread) {
          const killed = enemy.takeDamage(this.attackDamage);
          if (killed) {
            this.killCount++;
          }
        }
      }
    }
  }

  private createAttackVisual(angle: number, spread: number): void {
    const graphics = this.add.graphics();
    const halfSpread = spread / 2;
    const segments = 12;

    graphics.lineStyle(3, 0x00ffff, 0.8);
    graphics.fillStyle(0x00ffff, 0.25);

    graphics.beginPath();
    graphics.moveTo(this.player.x, this.player.y);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const currentAngle = angle - halfSpread + spread * t;
      const px = this.player.x + Math.cos(currentAngle) * this.attackRange;
      const py = this.player.y + Math.sin(currentAngle) * this.attackRange;
      graphics.lineTo(px, py);
    }

    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    this.tweens.add({
      targets: graphics,
      alpha: 0,
      scale: 1.15,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        graphics.destroy();
      }
    });

    this.attackVisuals.push(graphics);
    this.time.delayedCall(300, () => {
      const idx = this.attackVisuals.indexOf(graphics);
      if (idx !== -1) this.attackVisuals.splice(idx, 1);
    });
  }

  private checkEnemyBulletCollisions(enemy: Enemy): void {
    const bullets = enemy.getBullets();
    if (!bullets) return;

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

    bullets.getChildren().forEach((bulletObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Image;
      if (!bullet.active) return;

      const bulletBody = bullet.body as Phaser.Physics.Arcade.Body;
      const dist = Phaser.Math.Distance.Between(
        bulletBody.x, bulletBody.y,
        playerBody.x, playerBody.y
      );

      if (dist < 20) {
        bullet.setActive(false);
        bullet.setVisible(false);
        this.damagePlayer(enemy.getAttack());
      }
    });
  }

  private checkPlayerEnemyCollisions(): void {
    const enemies = this.enemySpawner.getActiveEnemies();
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

    for (const enemy of enemies) {
      if (!enemy.isActive()) continue;

      const dist = Phaser.Math.Distance.Between(
        enemy.x, enemy.y,
        playerBody.x, playerBody.y
      );

      const type = enemy.getType();
      if (type === 'explosive') {
        if (dist <= enemy.getAttackRange() + 10) {
          const explosionR = enemy.getExplosionRadius();
          if (explosionR > 0 && dist <= explosionR) {
          }
        }
      }

      this.physics.world.collide(
        this.player,
        enemy,
        undefined,
        () => {
          return false;
        }
      );
    }
  }

  private onEnemyHitPlayer(damage: number, enemy: Enemy): void {
    this.damagePlayer(damage);
    this.difficultyManager.recordPlayerHit();
  }

  private damagePlayer(amount: number): void {
    this.playerHealth = Math.max(0, this.playerHealth - amount);

    this.cameras.main.shake(150, 0.005 * amount);

    const flash = this.add.rectangle(
      this.player.x, this.player.y,
      60, 60,
      0xff0000, 0.4
    );
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 250,
      onComplete: () => flash.destroy()
    });

    if (this.playerHealth <= 0) {
      this.onPlayerDeath();
    }
  }

  private onPlayerDeath(): void {
    this.enemySpawner.stop();

    const { width, height } = this.scale;
    const deathText = this.add.text(width / 2, height / 2, '你被击败了！', {
      fontSize: '48px',
      fontFamily: 'Courier New',
      color: '#ff4444',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 30, y: 20 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    const subText = this.add.text(width / 2, height / 2 + 80, `击杀数: ${this.killCount}  点击重新开始`, {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#e67300'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    this.input.once('pointerdown', () => {
      deathText.destroy();
      subText.destroy();
      this.restartGame();
    });
  }

  private restartGame(): void {
    this.enemySpawner.destroy();
    this.killCount = 0;
    this.playerHealth = this.playerMaxHealth;
    this.difficultyManager.reset();
    this.levelStartTime = Date.now();

    const { width, height } = this.scale;
    this.player.x = width / 2;
    this.player.y = height / 2;

    this.enemySpawner = new EnemySpawner(this, this.difficultyManager);
    this.difficultyManager.setOnDifficultyChange((level) => {
      this.onDifficultyChanged(level);
    });
    this.enemySpawner.start();
  }

  private onDifficultyChanged(newLevel: number): void {
    this.enemySpawner.onDifficultyChanged();

    this.tweens.add({
      targets: this.difficultyFlashRect,
      alpha: { from: 0, to: 0.35, duration: 100 },
      yoyo: true,
      hold: 150,
      duration: 500,
      ease: 'Linear'
    });

    const { width, height } = this.scale;
    const levelText = this.add.text(width / 2, 100, `难度提升至 Lv.${newLevel}!`, {
      fontSize: '28px',
      fontFamily: 'Courier New',
      color: '#e67300',
      fontStyle: 'bold',
      stroke: '#1a2a1a',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

    this.tweens.add({
      targets: levelText,
      y: 180,
      alpha: 0,
      duration: 1800,
      ease: 'Cubic.easeIn',
      onComplete: () => levelText.destroy()
    });
  }
}
