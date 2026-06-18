import Phaser from 'phaser';
import { Particles } from '../modules/Particles';
import { DataManager } from '../modules/DataManager';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  damage: number;
  color: number;
  fromPlayer: boolean;
}

type EnemyType = 'normal' | 'tracker' | 'heavy';

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  size: number;
  angle: number;
  rotation: number;
  shootTimer: number;
}

interface Fragment {
  x: number;
  y: number;
  angle: number;
  pulse: number;
}

export class GameScene extends Phaser.Scene {
  private player!: { x: number; y: number; angle: number; vx: number; vy: number };
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private fragments: Fragment[] = [];
  private boss?: { x: number; y: number; hp: number; maxHp: number; rotation: number; shootTimer: number; angle: number };
  private particles!: Particles;
  private dataManager!: DataManager;
  private keys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private mouseDown: boolean = false;
  private fireTimer: number = 0;
  private enemySpawnTimer: number = 0;
  private safeZoneGraphics!: Phaser.GameObjects.Graphics;
  private shieldGraphics!: Phaser.GameObjects.Graphics;
  private playerGraphics!: Phaser.GameObjects.Graphics;
  private enemiesGraphics!: Phaser.GameObjects.Graphics;
  private bulletsGraphics!: Phaser.GameObjects.Graphics;
  private fragmentsGraphics!: Phaser.GameObjects.Graphics;
  private bossGraphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private lifeBarGraphics!: Phaser.GameObjects.Graphics;
  private shieldBarGraphics!: Phaser.GameObjects.Graphics;
  private lifeBarBgGraphics!: Phaser.GameObjects.Graphics;
  private shieldBarBgGraphics!: Phaser.GameObjects.Graphics;
  private gameOverGraphics!: Phaser.GameObjects.Graphics;
  private gameOverText!: Phaser.GameObjects.Text;
  private restartText!: Phaser.GameObjects.Text;
  private blinkTimer: number = 0;
  private outsideDamageTimer: number = 0;
  private centerX: number = 0;
  private centerY: number = 0;
  private screenWidth: number = 0;
  private screenHeight: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.screenWidth = this.scale.width;
    this.screenHeight = this.scale.height;
    this.centerX = this.screenWidth / 2;
    this.centerY = this.screenHeight / 2;

    this.dataManager = new DataManager();
    this.particles = new Particles(this, this.screenWidth, this.screenHeight);
    this.particles.setDepth(0);

    this.initPlayer();
    this.initGraphics();
    this.initUI();
    this.initInput();

    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.screenWidth = gameSize.width;
    this.screenHeight = gameSize.height;
    this.centerX = this.screenWidth / 2;
    this.centerY = this.screenHeight / 2;
    this.particles.resize(this.screenWidth, this.screenHeight);
    this.updateUIPositions();
  }

  private initPlayer(): void {
    this.player = {
      x: this.centerX,
      y: this.centerY,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0
    };
  }

  private initGraphics(): void {
    this.safeZoneGraphics = this.add.graphics().setDepth(1);
    this.bulletsGraphics = this.add.graphics().setDepth(3);
    this.enemiesGraphics = this.add.graphics().setDepth(4);
    this.playerGraphics = this.add.graphics().setDepth(5);
    this.shieldGraphics = this.add.graphics().setDepth(6);
    this.fragmentsGraphics = this.add.graphics().setDepth(7);
    this.bossGraphics = this.add.graphics().setDepth(8);
    this.lifeBarBgGraphics = this.add.graphics().setDepth(10);
    this.lifeBarGraphics = this.add.graphics().setDepth(11);
    this.shieldBarBgGraphics = this.add.graphics().setDepth(12);
    this.shieldBarGraphics = this.add.graphics().setDepth(13);
    this.gameOverGraphics = this.add.graphics().setDepth(20);
  }

  private initUI(): void {
    this.scoreText = this.add.text(20, 20, '分数: 0', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setDepth(15);
    this.scoreText.setShadow(2, 2, '#00E5FF', 2, true, true);

    this.gameOverText = this.add.text(0, 0, '游戏结束', {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: '#FF5252',
      stroke: '#000000',
      strokeThickness: 4
    }).setDepth(21).setVisible(false);
    this.gameOverText.setShadow(4, 4, '#00E5FF', 4, true, true);

    this.restartText = this.add.text(0, 0, '按任意键重新开始', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(21).setVisible(false);
    this.restartText.setShadow(2, 2, '#00E5FF', 2, true, true);

    this.updateUIPositions();
  }

  private updateUIPositions(): void {
    this.gameOverText.setPosition(this.centerX - this.gameOverText.width / 2, this.centerY - 80);
    this.restartText.setPosition(this.centerX - this.restartText.width / 2, this.centerY + 20);
  }

  private initInput(): void {
    this.keys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.mouseDown = true;
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) {
        this.mouseDown = false;
      }
    });

    this.input.keyboard!.on('keydown', () => {
      if (this.dataManager.getState().isGameOver) {
        this.restartGame();
      }
    });
  }

  private restartGame(): void {
    this.bullets.length = 0;
    this.enemies.length = 0;
    this.fragments.length = 0;
    this.boss = undefined;
    this.dataManager.reset();
    this.initPlayer();
    this.particles.clearAll();
    this.fireTimer = 0;
    this.enemySpawnTimer = 0;
    this.outsideDamageTimer = 0;
    this.blinkTimer = 0;
    this.gameOverText.setVisible(false);
    this.restartText.setVisible(false);
    this.gameOverGraphics.clear();
  }

  update(_time: number, delta: number): void {
    const state = this.dataManager.getState();

    if (!state.isGameOver) {
      this.dataManager.updateGameTime(delta);
      this.handlePlayerInput(delta);
      this.handleShooting(delta);
      this.updateBullets();
      this.spawnEnemies(delta);
      this.updateEnemies(delta);
      this.updateFragments(delta);
      this.updateBoss(delta);
      this.checkCollisions();
      this.checkSafeZoneDamage(delta);
      this.particles.update(delta);
    } else {
      this.blinkTimer += delta / 1000;
    }

    this.render();
    this.updateUI();
  }

  private handlePlayerInput(delta: number): void {
    const speed = 4;
    const dt = delta / 16.67;

    let dx = 0, dy = 0;
    if (this.keys.W.isDown) dy -= 1;
    if (this.keys.S.isDown) dy += 1;
    if (this.keys.A.isDown) dx -= 1;
    if (this.keys.D.isDown) dx += 1;

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      this.player.angle = Math.atan2(dy, dx);
    }

    this.player.x += dx * speed * dt;
    this.player.y += dy * speed * dt;

    this.player.x = Phaser.Math.Clamp(this.player.x, 20, this.screenWidth - 20);
    this.player.y = Phaser.Math.Clamp(this.player.y, 20, this.screenHeight - 20);

    if (len > 0) {
      const tailX = this.player.x - Math.cos(this.player.angle) * 15;
      const tailY = this.player.y - Math.sin(this.player.angle) * 15;
      this.particles.emitFlame(tailX, tailY, this.player.angle);
    }
  }

  private handleShooting(delta: number): void {
    this.fireTimer -= delta / 1000;
    if (this.mouseDown && this.fireTimer <= 0) {
      this.fireTimer = this.dataManager.getFireRate();
      const size = this.dataManager.getBulletSize();
      const pointer = this.input.activePointer;
      const angle = Math.atan2(pointer.y - this.player.y, pointer.x - this.player.x);
      this.player.angle = angle;

      this.bullets.push({
        x: this.player.x + Math.cos(angle) * 20,
        y: this.player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        size,
        damage: 1,
        color: 0xff6b6b,
        fromPlayer: true
      });
    }
  }

  private updateBullets(): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < -50 || b.x > this.screenWidth + 50 || b.y < -50 || b.y > this.screenHeight + 50) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private spawnEnemies(delta: number): void {
    const state = this.dataManager.getState();
    if (state.isBossActive) return;

    this.enemySpawnTimer -= delta / 1000;
    if (this.enemySpawnTimer <= 0) {
      this.enemySpawnTimer = 1.2;
      const ratio = this.dataManager.getEnemyRatio();
      const total = ratio.normal + ratio.tracker + ratio.heavy;
      const r = Phaser.Math.FloatBetween(0, total);

      let type: EnemyType;
      if (r < ratio.normal) type = 'normal';
      else if (r < ratio.normal + ratio.tracker) type = 'tracker';
      else type = 'heavy';

      this.spawnEnemy(type);
    }
  }

  private spawnEnemy(type: EnemyType): void {
    const side = Phaser.Math.Between(0, 3);
    let x: number, y: number;
    const margin = 30;
    switch (side) {
      case 0: x = Phaser.Math.Between(0, this.screenWidth); y = -margin; break;
      case 1: x = this.screenWidth + margin; y = Phaser.Math.Between(0, this.screenHeight); break;
      case 2: x = Phaser.Math.Between(0, this.screenWidth); y = this.screenHeight + margin; break;
      default: x = -margin; y = Phaser.Math.Between(0, this.screenHeight); break;
    }

    const angle = Math.atan2(this.centerY - y, this.centerX - x);
    let enemy: Enemy;

    switch (type) {
      case 'normal':
        enemy = { x, y, vx: Math.cos(angle) * 1.5, vy: Math.sin(angle) * 1.5, type, hp: 2, maxHp: 2, size: 24, angle, rotation: 0, shootTimer: 0 };
        break;
      case 'tracker':
        enemy = { x, y, vx: 0, vy: 0, type, hp: 3, maxHp: 3, size: 20, angle, rotation: 0, shootTimer: 0 };
        break;
      case 'heavy':
        enemy = { x, y, vx: Math.cos(angle) * 0.8, vy: Math.sin(angle) * 0.8, type, hp: 6, maxHp: 6, size: 20, angle, rotation: 0, shootTimer: 2 };
        break;
    }

    this.enemies.push(enemy);
  }

  private updateEnemies(delta: number): void {
    for (const e of this.enemies) {
      e.rotation += 0.02;
      if (e.type === 'tracker') {
        const targetAngle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
        const diff = Phaser.Math.Angle.Wrap(targetAngle - e.angle);
        e.angle += diff * 0.03;
        e.vx = Math.cos(e.angle) * 1.0;
        e.vy = Math.sin(e.angle) * 1.0;
      }
      e.x += e.vx;
      e.y += e.vy;

      if (e.type === 'heavy') {
        e.shootTimer -= delta / 1000;
        if (e.shootTimer <= 0) {
          e.shootTimer = 2;
          const bAngle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
          this.bullets.push({
            x: e.x, y: e.y, vx: Math.cos(bAngle) * 3, vy: Math.sin(bAngle) * 3,
            size: 5, damage: 10, color: 0x9c27b0, fromPlayer: false
          });
        }
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.x < -100 || e.x > this.screenWidth + 100 || e.y < -100 || e.y > this.screenHeight + 100) {
        this.enemies.splice(i, 1);
      }
    }
  }

  private updateFragments(delta: number): void {
    for (const f of this.fragments) {
      f.angle += delta / 1000 * 2;
      f.pulse += delta / 1000 * 5;
    }
  }

  private updateBoss(delta: number): void {
    const state = this.dataManager.getState();
    if (!state.isBossActive) return;

    if (!this.boss) {
      this.boss = {
        x: this.centerX,
        y: this.centerY - 100,
        hp: 80,
        maxHp: 80,
        rotation: 0,
        shootTimer: 0,
        angle: 0
      };
    }

    this.boss.rotation += delta / 1000 * 0.5;
    this.boss.angle = Math.atan2(this.player.y - this.boss.y, this.player.x - this.boss.x);
    this.boss.shootTimer -= delta / 1000;

    if (this.boss.shootTimer <= 0) {
      this.boss.shootTimer = 0.8;
      const spreadAngle = Phaser.Math.DegToRad(60);
      const startAngle = this.boss.angle - spreadAngle / 2;
      for (let i = 0; i < 5; i++) {
        const bAngle = startAngle + (spreadAngle / 4) * i;
        this.bullets.push({
          x: this.boss.x, y: this.boss.y, vx: Math.cos(bAngle) * 3, vy: Math.sin(bAngle) * 3,
          size: 6, damage: 10, color: 0xff1744, fromPlayer: false
        });
      }
    }
  }

  private checkCollisions(): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (!b.fromPlayer) continue;

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        const dist = Phaser.Math.Distance.Between(b.x, b.y, e.x, e.y);
        if (dist < e.size + b.size) {
          e.hp -= b.damage;
          this.bullets.splice(i, 1);
          this.particles.emitExplosion(b.x, b.y, 0xff6b6b, 5);
          if (e.hp <= 0) {
            this.killEnemy(e, j);
          }
          break;
        }
      }
    }

    if (this.boss) {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        if (!b.fromPlayer) continue;
        const dist = Phaser.Math.Distance.Between(b.x, b.y, this.boss.x, this.boss.y);
        if (dist < 40 + b.size) {
          this.boss.hp -= b.damage;
          this.bullets.splice(i, 1);
          this.particles.emitExplosion(b.x, b.y, 0xff6b6b, 5);
          if (this.boss.hp <= 0) {
            this.killBoss();
          }
        }
      }
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (b.fromPlayer) continue;
      const dist = Phaser.Math.Distance.Between(b.x, b.y, this.player.x, this.player.y);
      if (dist < 15 + b.size) {
        this.dataManager.takeDamage(b.damage);
        this.bullets.splice(i, 1);
        this.particles.emitExplosion(b.x, b.y, 0xff0000, 8);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dist = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
      if (dist < e.size + 15) {
        this.dataManager.takeDamage(15);
        this.killEnemy(e, i);
      }
    }

    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const f = this.fragments[i];
      const dist = Phaser.Math.Distance.Between(f.x, f.y, this.player.x, this.player.y);
      if (dist < 25) {
        this.dataManager.pickupFragment(1);
        this.fragments.splice(i, 1);
        this.particles.emitExplosion(f.x, f.y, 0xffd700, 8);
      }
    }
  }

  private killEnemy(e: Enemy, index: number): void {
    const colors: Record<EnemyType, number> = { normal: 0xff0000, tracker: 0xffff00, heavy: 0x888888 };
    const scores: Record<EnemyType, number> = { normal: 10, tracker: 20, heavy: 30 };
    this.particles.emitExplosion(e.x, e.y, colors[e.type], 20);
    this.dataManager.addScore(scores[e.type]);

    if (e.type !== 'heavy') {
      this.fragments.push({ x: e.x, y: e.y, angle: 0, pulse: 0 });
    } else {
      for (let k = 0; k < 3; k++) {
        const offset = Phaser.Math.FloatBetween(-15, 15);
        this.fragments.push({ x: e.x + offset, y: e.y + offset, angle: 0, pulse: 0 });
      }
    }

    this.enemies.splice(index, 1);
  }

  private killBoss(): void {
    if (!this.boss) return;
    this.particles.emitExplosion(this.boss.x, this.boss.y, 0x8b0000, 50);
    this.dataManager.addScore(500);
    this.boss = undefined;
  }

  private checkSafeZoneDamage(delta: number): void {
    const state = this.dataManager.getState();
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.centerX, this.centerY);
    let outside = dist > state.safeZoneRadius;

    if (this.boss) {
      const bossDist = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.centerX, this.centerY);
      if (bossDist > state.safeZoneRadius) outside = true;
    }

    if (outside) {
      this.outsideDamageTimer += delta / 1000;
      if (this.outsideDamageTimer >= 1) {
        this.outsideDamageTimer -= 1;
        this.dataManager.takeDamage(5);
      }
    } else {
      this.outsideDamageTimer = 0;
    }
  }

  private render(): void {
    this.renderSafeZone();
    this.renderBullets();
    this.renderEnemies();
    this.renderPlayer();
    this.renderShield();
    this.renderFragments();
    this.renderBoss();
    this.renderBars();
    this.renderGameOver();
  }

  private renderSafeZone(): void {
    this.safeZoneGraphics.clear();
    const state = this.dataManager.getState();
    const alpha = 0.9 + Math.sin(Date.now() / 100) * 0.1;

    this.safeZoneGraphics.lineStyle(3, 0x4fc3f7, alpha);
    this.safeZoneGraphics.beginPath();
    this.safeZoneGraphics.arc(this.centerX, this.centerY, state.safeZoneRadius, 0, Math.PI * 2);
    this.safeZoneGraphics.strokePath();

    this.safeZoneGraphics.fillStyle(0x4fc3f7, 0.15);
    this.safeZoneGraphics.beginPath();
    this.safeZoneGraphics.arc(this.centerX, this.centerY, state.safeZoneRadius, 0, Math.PI * 2);
    this.safeZoneGraphics.fillPath();
  }

  private renderBullets(): void {
    this.bulletsGraphics.clear();
    for (const b of this.bullets) {
      this.bulletsGraphics.fillStyle(b.color, 1);
      this.bulletsGraphics.fillCircle(b.x, b.y, b.size);
    }
  }

  private renderEnemies(): void {
    this.enemiesGraphics.clear();
    for (const e of this.enemies) {
      this.enemiesGraphics.save();
      this.enemiesGraphics.translateCanvas(e.x, e.y);
      this.enemiesGraphics.rotateCanvas(e.rotation);

      switch (e.type) {
        case 'normal':
          this.drawTriangle(e.size, 0xff3333);
          break;
        case 'tracker':
          this.drawDiamond(e.size, 0xffff33);
          break;
        case 'heavy':
          this.drawHexagon(e.size, 0x999999);
          break;
      }

      this.enemiesGraphics.restore();

      if (e.hp < e.maxHp) {
        const barW = e.size * 1.5;
        const barH = 3;
        const ratio = e.hp / e.maxHp;
        this.enemiesGraphics.fillStyle(0x333333, 1);
        this.enemiesGraphics.fillRect(e.x - barW / 2, e.y - e.size - 8, barW, barH);
        this.enemiesGraphics.fillStyle(0x00ff00, 1);
        this.enemiesGraphics.fillRect(e.x - barW / 2, e.y - e.size - 8, barW * ratio, barH);
      }
    }
  }

  private drawTriangle(size: number, color: number): void {
    this.enemiesGraphics.fillStyle(color, 1);
    this.enemiesGraphics.beginPath();
    this.enemiesGraphics.moveTo(size, 0);
    this.enemiesGraphics.lineTo(-size * 0.6, -size * 0.8);
    this.enemiesGraphics.lineTo(-size * 0.6, size * 0.8);
    this.enemiesGraphics.closePath();
    this.enemiesGraphics.fillPath();
    this.enemiesGraphics.lineStyle(2, 0xffffff, 0.5);
    this.enemiesGraphics.strokePath();
  }

  private drawDiamond(size: number, color: number): void {
    this.enemiesGraphics.fillStyle(color, 1);
    this.enemiesGraphics.beginPath();
    this.enemiesGraphics.moveTo(size, 0);
    this.enemiesGraphics.lineTo(0, -size);
    this.enemiesGraphics.lineTo(-size, 0);
    this.enemiesGraphics.lineTo(0, size);
    this.enemiesGraphics.closePath();
    this.enemiesGraphics.fillPath();
    this.enemiesGraphics.lineStyle(2, 0xffffff, 0.5);
    this.enemiesGraphics.strokePath();
  }

  private drawHexagon(radius: number, color: number): void {
    this.enemiesGraphics.fillStyle(color, 1);
    this.enemiesGraphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius;
      if (i === 0) this.enemiesGraphics.moveTo(x, y);
      else this.enemiesGraphics.lineTo(x, y);
    }
    this.enemiesGraphics.closePath();
    this.enemiesGraphics.fillPath();
    this.enemiesGraphics.lineStyle(2, 0xffffff, 0.5);
    this.enemiesGraphics.strokePath();
  }

  private renderPlayer(): void {
    this.playerGraphics.clear();
    this.playerGraphics.save();
    this.playerGraphics.translateCanvas(this.player.x, this.player.y);
    this.playerGraphics.rotateCanvas(this.player.angle);

    this.playerGraphics.fillStyle(0x00e5ff, 1);
    this.playerGraphics.beginPath();
    this.playerGraphics.moveTo(18, 0);
    this.playerGraphics.lineTo(-12, -10);
    this.playerGraphics.lineTo(-8, 0);
    this.playerGraphics.lineTo(-12, 10);
    this.playerGraphics.closePath();
    this.playerGraphics.fillPath();
    this.playerGraphics.lineStyle(2, 0xffffff, 0.8);
    this.playerGraphics.strokePath();

    this.playerGraphics.restore();
  }

  private renderShield(): void {
    this.shieldGraphics.clear();
    const state = this.dataManager.getState();
    if (state.shield > 0) {
      let alpha = 0.4;
      if (state.shieldFlashTime > 0) alpha = 0.9;
      this.shieldGraphics.lineStyle(2, 0x448aff, alpha);
      this.shieldGraphics.beginPath();
      this.shieldGraphics.arc(this.player.x, this.player.y, 30, 0, Math.PI * 2);
      this.shieldGraphics.strokePath();
    }
  }

  private renderFragments(): void {
    this.fragmentsGraphics.clear();
    for (const f of this.fragments) {
      const pulse = 1 + Math.sin(f.pulse) * 0.15;
      this.fragmentsGraphics.save();
      this.fragmentsGraphics.translateCanvas(f.x, f.y);
      this.fragmentsGraphics.rotateCanvas(f.angle);
      this.drawHexagram(10 * pulse, 0xffd700);
      this.fragmentsGraphics.restore();

      this.fragmentsGraphics.lineStyle(2, 0xffd700, 0.4);
      this.fragmentsGraphics.beginPath();
      this.fragmentsGraphics.arc(f.x, f.y, 15, 0, Math.PI * 2);
      this.fragmentsGraphics.strokePath();
    }
  }

  private drawHexagram(radius: number, color: number): void {
    this.fragmentsGraphics.fillStyle(color, 1);
    for (let i = 0; i < 6; i++) {
      const a1 = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2;
      const x1 = Math.cos(a1) * radius;
      const y1 = Math.sin(a1) * radius;
      const x2 = Math.cos(a2) * radius;
      const y2 = Math.sin(a2) * radius;
      const cx = Math.cos(a1 + Math.PI / 6) * (radius * 0.5);
      const cy = Math.sin(a1 + Math.PI / 6) * (radius * 0.5);

      this.fragmentsGraphics.beginPath();
      this.fragmentsGraphics.moveTo(x1, y1);
      this.fragmentsGraphics.lineTo(x2, y2);
      this.fragmentsGraphics.lineTo(cx, cy);
      this.fragmentsGraphics.closePath();
      this.fragmentsGraphics.fillPath();
    }
  }

  private renderBoss(): void {
    this.bossGraphics.clear();
    if (!this.boss) return;

    this.bossGraphics.save();
    this.bossGraphics.translateCanvas(this.boss.x, this.boss.y);
    this.bossGraphics.rotateCanvas(this.boss.rotation);

    this.bossGraphics.fillStyle(0x8b0000, 1);
    this.bossGraphics.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = Math.cos(a) * 40;
      const y = Math.sin(a) * 40;
      if (i === 0) this.bossGraphics.moveTo(x, y);
      else this.bossGraphics.lineTo(x, y);
    }
    this.bossGraphics.closePath();
    this.bossGraphics.fillPath();
    this.bossGraphics.lineStyle(3, 0xff1744, 0.8);
    this.bossGraphics.strokePath();

    this.bossGraphics.restore();

    const barW = 100;
    const barH = 6;
    const ratio = this.boss.hp / this.boss.maxHp;
    this.bossGraphics.fillStyle(0x333333, 1);
    this.bossGraphics.fillRect(this.boss.x - barW / 2, this.boss.y - 60, barW, barH);
    this.bossGraphics.fillStyle(0xff1744, 1);
    this.bossGraphics.fillRect(this.boss.x - barW / 2, this.boss.y - 60, barW * ratio, barH);
  }

  private renderBars(): void {
    const state = this.dataManager.getState();
    const x = 20;
    const y = this.screenHeight - 50;

    this.lifeBarBgGraphics.clear();
    this.lifeBarBgGraphics.fillStyle(0xffffff, 0.6);
    this.lifeBarBgGraphics.fillRoundedRect(x - 3, y - 3, 206, 22, 3);
    this.lifeBarBgGraphics.fillStyle(0x000000, 0.8);
    this.lifeBarBgGraphics.fillRoundedRect(x, y, 200, 16, 3);

    this.lifeBarGraphics.clear();
    this.lifeBarGraphics.fillStyle(0xff5252, 1);
    const lifeW = Math.max(0, (state.lives / state.maxLives) * 200);
    this.lifeBarGraphics.fillRoundedRect(x, y, lifeW, 16, 3);

    this.shieldBarBgGraphics.clear();
    this.shieldBarBgGraphics.fillStyle(0xffffff, 0.6);
    this.shieldBarBgGraphics.fillRoundedRect(x - 3, y + 20 - 3, 206, 18, 3);
    this.shieldBarBgGraphics.fillStyle(0x000000, 0.8);
    this.shieldBarBgGraphics.fillRoundedRect(x, y + 20, 200, 12, 3);

    this.shieldBarGraphics.clear();
    this.shieldBarGraphics.fillStyle(0x448aff, 1);
    const shieldW = Math.max(0, (state.shield / state.maxShield) * 200);
    this.shieldBarGraphics.fillRoundedRect(x, y + 20, shieldW, 12, 3);
  }

  private renderGameOver(): void {
    const state = this.dataManager.getState();
    if (!state.isGameOver) return;

    this.gameOverGraphics.clear();
    this.gameOverGraphics.fillStyle(0x000000, 0.7);
    this.gameOverGraphics.fillRect(0, 0, this.screenWidth, this.screenHeight);

    this.gameOverText.setText(`游戏结束\n最终得分: ${state.score}`);
    this.gameOverText.setVisible(true);

    const visible = Math.floor(this.blinkTimer / 0.4) % 2 === 0;
    this.restartText.setVisible(visible);

    this.updateUIPositions();
  }

  private updateUI(): void {
    const state = this.dataManager.getState();
    this.scoreText.setText(`分数: ${state.score}  武器: Lv.${state.weaponLevel + 1}  时间: ${Math.floor(state.gameTime)}s`);
  }
}
