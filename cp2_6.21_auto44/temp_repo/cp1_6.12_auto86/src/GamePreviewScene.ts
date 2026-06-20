import Phaser from 'phaser';
import {
  GRID_COLS,
  GRID_ROWS,
  CELL_SIZE,
  GAME_WIDTH,
  GAME_HEIGHT,
  ElementType,
  LevelCell,
  LevelData,
} from './config';

interface EnemyInfo {
  sprite: Phaser.Physics.Arcade.Sprite;
  originX: number;
  range: number;
  speed: number;
  dir: number;
}

export class GamePreviewScene extends Phaser.Scene {
  private levelData!: LevelData;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private playerStartPos!: { x: number; y: number };
  private groundGroup!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Phaser.Physics.Arcade.Sprite[] = [];
  private coins: Phaser.Physics.Arcade.StaticSprite[] = [];
  private redFlash!: Phaser.GameObjects.Rectangle;
  private isResetting = false;
  private won = false;
  private audioCtx: AudioContext | null = null;
  private enemyData: EnemyInfo[] = [];
  private spikePositions: { x: number; y: number }[] = [];
  private endFlagPos: { x: number; y: number } | null = null;

  constructor() {
    super({ key: 'GamePreviewScene' });
  }

  init(data: { levelData: LevelData }): void {
    this.levelData = data.levelData;
    this.isResetting = false;
    this.won = false;
    this.enemies = [];
    this.coins = [];
    this.enemyData = [];
    this.spikePositions = [];
    this.endFlagPos = null;
  }

  create(): void {
    this.groundGroup = this.physics.add.staticGroup();

    this.createBackground();
    this.createLevel();
    this.createPlayer();
    this.setupCollisions();
    this.setupInput();

    this.redFlash = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0xFF0000,
      0
    );
    this.redFlash.setDepth(100);
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    const colors = [0x87CEEB, 0xA8D8EA, 0xC5E8F7, 0xE0F6FF];
    const segmentHeight = GAME_HEIGHT / (colors.length - 1);
    for (let i = 0; i < colors.length - 1; i++) {
      bg.fillGradientStyle(colors[i], colors[i], colors[i + 1], colors[i + 1]);
      bg.fillRect(0, i * segmentHeight, GAME_WIDTH, segmentHeight + 1);
    }
    bg.setDepth(-10);
  }

  private createLevel(): void {
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const cell = this.levelData.grid[y]?.[x];
        if (!cell) continue;

        switch (cell.type) {
          case ElementType.GROUND: {
            const sprite = this.groundGroup.create(
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2,
              'ground'
            ) as Phaser.Physics.Arcade.StaticSprite;
            this.addShadow(sprite, CELL_SIZE, CELL_SIZE);
            break;
          }
          case ElementType.PLATFORM: {
            if (cell.platformLength && cell.platformLength > 0) {
              const len = cell.platformLength;
              const sprite = this.groundGroup.create(
                x * CELL_SIZE + (len * CELL_SIZE) / 2,
                y * CELL_SIZE + CELL_SIZE / 2,
                `platform_${len}`
              ) as Phaser.Physics.Arcade.StaticSprite;
              this.addShadow(sprite, len * CELL_SIZE, CELL_SIZE);
            }
            break;
          }
          case ElementType.SPIKE: {
            this.add.image(
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2,
              'spike'
            ).setDepth(1);
            this.spikePositions.push({ x, y });
            break;
          }
          case ElementType.ENEMY: {
            const ex = x * CELL_SIZE + CELL_SIZE / 2;
            const ey = y * CELL_SIZE + CELL_SIZE / 2;
            const enemy = this.physics.add.sprite(ex, ey, 'enemy');
            enemy.setImmovable(true);
            enemy.setGravityY(-800);
            enemy.setDepth(2);
            enemy.setSize(30, 30);
            const range = (cell.enemyRange ?? 3) * CELL_SIZE;
            this.enemies.push(enemy);
            this.enemyData.push({
              sprite: enemy,
              originX: ex,
              range,
              speed: 60,
              dir: 1,
            });
            break;
          }
          case ElementType.COIN: {
            const coinSprite = this.physics.add.staticSprite(
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2,
              'coin'
            );
            coinSprite.setDepth(2);
            this.coins.push(coinSprite);
            this.tweens.add({
              targets: coinSprite,
              angle: 360,
              duration: 1500,
              repeat: -1,
              ease: 'Linear',
            });
            break;
          }
          case ElementType.PLAYER_START: {
            break;
          }
          case ElementType.END_FLAG: {
            const flag = this.add.image(
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2,
              'end_flag'
            );
            flag.setDepth(2);
            this.endFlagPos = { x: x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2 };
            this.tweens.add({
              targets: flag,
              y: flag.y - 4,
              yoyo: true,
              repeat: -1,
              duration: 800,
              ease: 'Sine.easeInOut',
            });
            break;
          }
        }
      }
    }
  }

  private addShadow(sprite: Phaser.GameObjects.Sprite, w: number, h: number): void {
    const shadow = this.add.rectangle(
      sprite.x,
      sprite.y + h / 2 + 4,
      w,
      6,
      0x000000,
      0.3
    );
    shadow.setDepth(0);
    shadow.blendMode = Phaser.BlendModes.MULTIPLY;
  }

  private createPlayer(): void {
    const start = this.levelData.playerStart!;
    this.playerStartPos = {
      x: start.x * CELL_SIZE + CELL_SIZE / 2,
      y: start.y * CELL_SIZE + CELL_SIZE / 2,
    };

    this.player = this.physics.add.sprite(
      this.playerStartPos.x,
      this.playerStartPos.y,
      'player_preview'
    );
    this.player.setDepth(5);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(24, 36);
    this.player.setOffset(8, 4);
    this.player.setBounce(0);
  }

  private setupCollisions(): void {
    this.physics.add.collider(this.player, this.groundGroup);

    this.enemies.forEach((enemy) => {
      this.physics.add.collider(enemy, this.groundGroup);
    });

    this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
      this.onCoinCollect(coin as Phaser.Physics.Arcade.StaticSprite);
    });

    this.physics.add.overlap(this.player, this.enemies, (_p, enemy) => {
      this.onEnemyTouch(enemy as Phaser.Physics.Arcade.Sprite);
    });
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-ESC', () => {
      this.returnToEditor();
    });
  }

  update(): void {
    if (this.won) return;

    this.handlePlayerMovement();
    this.updateEnemies();
    this.checkSpikeCollision();
    this.checkEndFlag();

    if (this.player.y > GAME_HEIGHT + 50) {
      this.resetPlayer();
    }
  }

  private handlePlayerMovement(): void {
    if (this.isResetting) return;

    const speed = 200;
    const jumpVelocity = -438;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.player.body?.touching.down) {
      this.player.setVelocityY(jumpVelocity);
    }
  }

  private updateEnemies(): void {
    this.enemyData.forEach((data) => {
      data.sprite.setVelocityX(data.speed * data.dir);

      if (data.sprite.x > data.originX + data.range) {
        data.dir = -1;
      } else if (data.sprite.x < data.originX - data.range) {
        data.dir = 1;
      }

      data.sprite.setFlipX(data.dir < 0);
    });
  }

  private checkSpikeCollision(): void {
    const px = this.player.x;
    const py = this.player.y;
    const pw = 12;
    const ph = 17;

    for (const spike of this.spikePositions) {
      const sx = spike.x * CELL_SIZE + CELL_SIZE / 2;
      const sy = spike.y * CELL_SIZE + CELL_SIZE * 0.75;

      if (
        px + pw > sx - CELL_SIZE / 2 + 4 &&
        px - pw < sx + CELL_SIZE / 2 - 4 &&
        py + ph > sy - CELL_SIZE / 4 &&
        py - ph < sy + CELL_SIZE / 4
      ) {
        this.resetPlayer();
        return;
      }
    }
  }

  private checkEndFlag(): void {
    if (!this.endFlagPos) return;

    const dist = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.endFlagPos.x,
      this.endFlagPos.y
    );

    if (dist < CELL_SIZE) {
      this.onReachEnd();
    }
  }

  private resetPlayer(): void {
    if (this.isResetting || this.won) return;
    this.isResetting = true;

    this.redFlash.setAlpha(0.4);
    this.tweens.add({
      targets: this.redFlash,
      alpha: 0,
      duration: 300,
      ease: 'Linear',
    });

    this.player.setVelocity(0, 0);
    this.player.setPosition(this.playerStartPos.x, this.playerStartPos.y);

    this.time.delayedCall(300, () => {
      this.isResetting = false;
    });
  }

  private onCoinCollect(coin: Phaser.Physics.Arcade.StaticSprite): void {
    if (!coin.active) return;
    coin.destroy();
    const idx = this.coins.indexOf(coin);
    if (idx >= 0) this.coins.splice(idx, 1);
    this.playCoinSound();
  }

  private playCoinSound(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio not available
    }
  }

  private onEnemyTouch(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (!enemy.active || this.isResetting || this.won) return;

    this.createExplosion(enemy.x, enemy.y);
    enemy.destroy();
    const idx = this.enemies.indexOf(enemy);
    if (idx >= 0) {
      this.enemyData.splice(idx, 1);
      this.enemies.splice(idx, 1);
    }
  }

  private createExplosion(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      const particle = this.add.circle(x, y, 4, 0xFFFFFF);
      particle.setDepth(10);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        scale: 0.5,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private onReachEnd(): void {
    if (this.won) return;
    this.won = true;
    this.player.setVelocity(0, 0);

    const victoryText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      '关卡通过！',
      {
        fontSize: '48px',
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#8B6914',
        strokeThickness: 4,
      }
    );
    victoryText.setOrigin(0.5);
    victoryText.setDepth(200);
    victoryText.setScale(0);

    this.tweens.add({
      targets: victoryText,
      scale: 1.2,
      duration: 800,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: victoryText,
          alpha: 0.2,
          yoyo: true,
          repeat: 5,
          duration: 100,
        });
      },
    });

    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const star = this.add.star(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        5,
        8,
        16,
        0xFFD700
      );
      star.setDepth(200);

      this.tweens.add({
        targets: star,
        x: GAME_WIDTH / 2 + Math.cos(angle) * 120,
        y: GAME_HEIGHT / 2 + Math.sin(angle) * 120,
        alpha: 0,
        scale: 1.5,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  private returnToEditor(): void {
    this.scene.start('EditorScene');
  }
}
