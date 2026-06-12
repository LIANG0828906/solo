import Phaser from 'phaser';
import { BeatManager, BeatData } from './BeatManager';
import { Player, Direction } from './Player';
import { Enemy } from './Enemy';
import { UIManager } from './UIManager';

enum TileType {
  WALL = 0,
  FLOOR = 1,
  CHEST = 2,
}

const BASE_WIDTH = 900;
const BASE_HEIGHT = 600;
const MAP_WIDTH = 15;
const MAP_HEIGHT = 10;

class GameScene extends Phaser.Scene {
  private tileSize: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;

  private map: TileType[][] = [];
  private mapTiles: Phaser.GameObjects.Rectangle[][] = [];
  private hoverTile: Phaser.GameObjects.Rectangle | null = null;

  private beatManager!: BeatManager;
  private player!: Player;
  private enemies: Enemy[] = [];
  private uiManager!: UIManager;

  private playerActedThisBeat: boolean = false;
  private enemiesActedThisBeat: boolean = false;
  private gameOver: boolean = false;

  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;

  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {}

  create(): void {
    this.gameOver = false;
    this.playerActedThisBeat = false;
    this.enemiesActedThisBeat = false;
    this.enemies = [];

    this.calculateTileSize();
    this.generateMap();
    this.renderMap();
    this.createHoverIndicator();

    this.beatManager = new BeatManager(this, 110);
    this.uiManager = new UIManager(this, this.scale.width, this.scale.height);

    this.spawnPlayer();
    this.spawnEnemies();

    this.setupInput();
    this.setupBeatEvents();

    this.scale.on('resize', this.handleResize, this);

    this.time.delayedCall(800, () => {
      this.beatManager.start();
      this.uiManager.fadeInUI();
    });

    const loading = document.getElementById('loading');
    if (loading) loading.remove();
  }

  private calculateTileSize(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const maxTileW = (w - 80) / MAP_WIDTH;
    const maxTileH = (h - 140) / MAP_HEIGHT;
    this.tileSize = Math.floor(Math.min(maxTileW, maxTileH));
    this.offsetX = (w - MAP_WIDTH * this.tileSize) / 2;
    this.offsetY = (h - MAP_HEIGHT * this.tileSize) / 2 + 10;
  }

  private generateMap(): void {
    this.map = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
      this.map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
          this.map[y][x] = TileType.WALL;
        } else {
          this.map[y][x] = TileType.FLOOR;
        }
      }
    }

    const wallCount = 15;
    for (let i = 0; i < wallCount; i++) {
      const x = Phaser.Math.Between(2, MAP_WIDTH - 3);
      const y = Phaser.Math.Between(2, MAP_HEIGHT - 3);
      if (!(x <= 2 && y <= 2)) {
        this.map[y][x] = TileType.WALL;
      }
    }

    for (let i = 0; i < 4; i++) {
      const len = Phaser.Math.Between(3, 6);
      const horizontal = Math.random() > 0.5;
      const sx = Phaser.Math.Between(2, MAP_WIDTH - 3 - len);
      const sy = Phaser.Math.Between(2, MAP_HEIGHT - 3 - (horizontal ? 0 : len));
      for (let j = 0; j < len; j++) {
        const wx = horizontal ? sx + j : sx;
        const wy = horizontal ? sy : sy + j;
        if (!(wx <= 2 && wy <= 2)) {
          this.map[wy][wx] = TileType.WALL;
        }
      }
    }

    const chestCount = 3;
    let placed = 0;
    let attempts = 0;
    while (placed < chestCount && attempts < 100) {
      const x = Phaser.Math.Between(1, MAP_WIDTH - 2);
      const y = Phaser.Math.Between(1, MAP_HEIGHT - 2);
      if (this.map[y][x] === TileType.FLOOR && !(x <= 2 && y <= 2)) {
        this.map[y][x] = TileType.CHEST;
        placed++;
      }
      attempts++;
    }
  }

  private renderMap(): void {
    this.mapTiles = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
      this.mapTiles[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = this.map[y][x];
        const px = this.offsetX + x * this.tileSize + this.tileSize / 2;
        const py = this.offsetY + y * this.tileSize + this.tileSize / 2;

        let bg: Phaser.GameObjects.Rectangle;
        const size = this.tileSize - 2;

        if (tile === TileType.WALL) {
          bg = this.add.rectangle(px, py, size, size, 0x2d1b4e, 1);
          bg.setStrokeStyle(2, 0xffd700, 0.35);
          bg.setDepth(1);

          const inner = this.add.rectangle(px, py, size * 0.6, size * 0.6, 0x4a2c7a, 0.7);
          inner.setDepth(2);
        } else if (tile === TileType.CHEST) {
          bg = this.add.rectangle(px, py, size, size, 0x1a0a2e, 1);
          bg.setStrokeStyle(1, 0x4a2c7a, 0.3);
          bg.setDepth(1);

          const chest = this.add.rectangle(px, py, size * 0.6, size * 0.45, 0xffd700, 0.9);
          chest.setStrokeStyle(2, 0xffb347, 1);
          chest.setDepth(5);

          const lock = this.add.rectangle(px, py - 2, size * 0.12, size * 0.18, 0x2d1b4e, 1);
          lock.setDepth(6);
        } else {
          const shade = ((x + y) % 2 === 0) ? 0x1a0a2e : 0x150822;
          bg = this.add.rectangle(px, py, size, size, shade, 1);
          bg.setStrokeStyle(1, 0x3a1f5e, 0.2);
          bg.setDepth(1);
        }

        bg.setAlpha(0);
        this.tweens.add({
          targets: bg,
          alpha: 1,
          duration: 400,
          delay: (x + y) * 25,
          ease: Phaser.Math.Easing.Quadratic.Out
        });

        this.mapTiles[y][x] = bg;
      }
    }
  }

  private createHoverIndicator(): void {
    this.hoverTile = this.add.rectangle(0, 0, this.tileSize - 2, this.tileSize - 2, 0xffd700, 0);
    this.hoverTile.setStrokeStyle(2, 0xffd700, 0.6);
    this.hoverTile.setDepth(80);
  }

  private spawnPlayer(): void {
    let sx = 1, sy = 1;
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        if (this.map[y][x] === TileType.FLOOR) {
          sx = x; sy = y;
          break;
        }
      }
    }

    this.player = new Player(this, {
      gridX: sx,
      gridY: sy,
      tileSize: this.tileSize,
      health: 100,
      attackPower: 25
    });

    const sprite = (this.player as unknown as { sprite: Phaser.GameObjects.Container }).sprite;
    sprite.x = this.offsetX + sx * this.tileSize + this.tileSize / 2;
    sprite.y = this.offsetY + sy * this.tileSize + this.tileSize / 2;
    this.player.fadeIn(800);
  }

  private spawnEnemies(): void {
    const enemyCount = 5;
    const types: Array<'slime' | 'skeleton' | 'ghost'> = ['slime', 'skeleton', 'ghost'];
    let placed = 0;
    let attempts = 0;

    while (placed < enemyCount && attempts < 200) {
      const x = Phaser.Math.Between(3, MAP_WIDTH - 2);
      const y = Phaser.Math.Between(3, MAP_HEIGHT - 2);

      if (this.map[y][x] === TileType.FLOOR) {
        const occupied = this.enemies.some(e => e.gridX === x && e.gridY === y);
        const distToPlayer = Math.abs(x - this.player.gridX) + Math.abs(y - this.player.gridY);

        if (!occupied && distToPlayer >= 4) {
          const type = types[Phaser.Math.Between(0, 2)];
          const enemy = new Enemy(this, {
            gridX: x,
            gridY: y,
            tileSize: this.tileSize,
            health: type === 'skeleton' ? 75 : type === 'ghost' ? 40 : 50,
            damage: type === 'skeleton' ? 15 : type === 'ghost' ? 8 : 10,
            type
          });

          const sprite = (enemy as unknown as { sprite: Phaser.GameObjects.Container }).sprite;
          sprite.x = this.offsetX + x * this.tileSize + this.tileSize / 2;
          sprite.y = this.offsetY + y * this.tileSize + this.tileSize / 2;
          enemy.fadeIn(600, placed * 100);

          this.enemies.push(enemy);
          placed++;
        }
      }
      attempts++;
    }
  }

  private setupInput(): void {
    this.keys = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D
    }) as typeof this.keys;

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.hoverTile) return;
      const gx = Math.floor((pointer.x - this.offsetX) / this.tileSize);
      const gy = Math.floor((pointer.y - this.offsetY) / this.tileSize);

      if (gx >= 0 && gx < MAP_WIDTH && gy >= 0 && gy < MAP_HEIGHT) {
        this.hoverTile.setPosition(
          this.offsetX + gx * this.tileSize + this.tileSize / 2,
          this.offsetY + gy * this.tileSize + this.tileSize / 2
        );
        this.hoverTile.setAlpha(0.4);
      } else {
        this.hoverTile.setAlpha(0);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
      this.touchStartTime = this.time.now;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver) return;

      const dx = pointer.x - this.touchStartX;
      const dy = pointer.y - this.touchStartY;
      const dt = this.time.now - this.touchStartTime;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30 && dt < 300) {
        this.tryAttack();
      } else if (dist > 40) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.tryMove(dx > 0 ? 'right' : 'left');
        } else {
          this.tryMove(dy > 0 ? 'down' : 'up');
        }
      }
    });
  }

  private setupBeatEvents(): void {
    this.beatManager.events.on('beat', (_data: BeatData) => {
      if (this.gameOver) return;

      this.uiManager.flashScreen();
      this.playerActedThisBeat = false;
      this.enemiesActedThisBeat = false;

      this.time.delayedCall(this.beatManager.getBeatInterval() * 0.6, () => {
        if (!this.gameOver && !this.enemiesActedThisBeat) {
          this.processEnemyTurn();
        }
      });
    });
  }

  update(_time: number, _delta: number): void {
    if (this.gameOver) return;

    const progress = this.beatManager.getBeatProgress();
    this.uiManager.updateBeatIndicator(progress);

    if (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.w)) {
      this.tryMove('up');
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.down) || Phaser.Input.Keyboard.JustDown(this.keys.s)) {
      this.tryMove('down');
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.left) || Phaser.Input.Keyboard.JustDown(this.keys.a)) {
      this.tryMove('left');
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.right) || Phaser.Input.Keyboard.JustDown(this.keys.d)) {
      this.tryMove('right');
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this.tryAttack();
    }
  }

  private tryMove(direction: Direction): void {
    if (this.gameOver || this.playerActedThisBeat) return;

    const isOnBeat = this.beatManager.isOnBeat();
    const canMove = (x: number, y: number): boolean => this.canPlayerMoveTo(x, y);

    const moved = this.player.move(direction, canMove);

    if (moved) {
      this.playerActedThisBeat = true;

      if (isOnBeat) {
        this.player.onBeatHit();
        this.uiManager.incrementCombo();
        this.uiManager.addScore(5);
        this.uiManager.showFloatingText(
          this.offsetX + this.player.gridX * this.tileSize + this.tileSize / 2,
          this.offsetY + this.player.gridY * this.tileSize,
          '+5 完美!',
          '#44ff44'
        );
      } else {
        this.player.onBeatMiss();
        this.uiManager.resetCombo();
        this.uiManager.showFloatingText(
          this.offsetX + this.player.gridX * this.tileSize + this.tileSize / 2,
          this.offsetY + this.player.gridY * this.tileSize,
          '错过节拍',
          '#ff8888'
        );
      }

      this.checkChestPickup();
      this.checkWinCondition();
    }
  }

  private tryAttack(): void {
    if (this.gameOver || this.playerActedThisBeat) return;

    const target = this.findAdjacentEnemy();
    const isOnBeat = this.beatManager.isOnBeat();

    if (!target) {
      this.uiManager.showFloatingText(
        this.offsetX + this.player.gridX * this.tileSize + this.tileSize / 2,
        this.offsetY + this.player.gridY * this.tileSize,
        '附近无敌人',
        '#ff8888'
      );
      return;
    }

    this.playerActedThisBeat = true;
    const damage = this.player.attack(isOnBeat);

    if (isOnBeat) {
      this.player.onBeatHit();
      this.uiManager.incrementCombo();

      const targetSprite = (target as unknown as { sprite: Phaser.GameObjects.Container }).sprite;
      this.uiManager.createParticles(targetSprite.x, targetSprite.y, 'note');

      const baseScore = 50;
      const comboBonus = Math.floor(this.uiManager.combo * 10);
      const totalScore = baseScore + comboBonus;
      this.uiManager.addScore(totalScore);

      this.uiManager.showFloatingText(
        targetSprite.x,
        targetSprite.y - this.tileSize * 0.3,
        `-${damage}  节拍命中!`,
        '#ffd700'
      );

      if (this.uiManager.combo >= 3) {
        this.uiManager.showFloatingText(
          targetSprite.x,
          targetSprite.y - this.tileSize * 0.6,
          `${this.uiManager.combo} 连击!`,
          this.uiManager.combo >= 10 ? '#ff4444' : '#ffaa00'
        );
      }
    } else {
      this.uiManager.resetCombo();
      this.uiManager.showFloatingText(
        (target as unknown as { sprite: Phaser.GameObjects.Container }).sprite.x,
        (target as unknown as { sprite: Phaser.GameObjects.Container }).sprite.y - this.tileSize * 0.3,
        `-${damage}  未踩节拍`,
        '#ff8888'
      );
    }

    const dead = target.takeDamage(damage);
    if (dead) {
      const targetSprite = (target as unknown as { sprite: Phaser.GameObjects.Container }).sprite;
      this.uiManager.createParticles(targetSprite.x, targetSprite.y, 'death');
      this.uiManager.addScore(200);
      this.uiManager.showFloatingText(targetSprite.x, targetSprite.y, '+200 击杀!', '#ffd700');

      const idx = this.enemies.indexOf(target);
      if (idx > -1) this.enemies.splice(idx, 1);
      this.checkWinCondition();
    }
  }

  private findAdjacentEnemy(): Enemy | null {
    const px = this.player.gridX;
    const py = this.player.gridY;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    for (const [dx, dy] of dirs) {
      const ex = px + dx;
      const ey = py + dy;
      const enemy = this.enemies.find(e => e.gridX === ex && e.gridY === ey && !e.isDead);
      if (enemy) return enemy;
    }
    return null;
  }

  private canPlayerMoveTo(x: number, y: number): boolean {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    if (this.map[y][x] === TileType.WALL) return false;
    if (this.enemies.some(e => e.gridX === x && e.gridY === y && !e.isDead)) return false;
    return true;
  }

  private canEnemyMoveTo(x: number, y: number, self: Enemy): boolean {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    if (this.map[y][x] === TileType.WALL) return false;
    if (this.player.gridX === x && this.player.gridY === y) return false;
    if (this.enemies.some(e => e !== self && e.gridX === x && e.gridY === y && !e.isDead)) return false;
    return true;
  }

  private processEnemyTurn(): void {
    this.enemiesActedThisBeat = true;

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      if (enemy.isAdjacentToPlayer(this.player.gridX, this.player.gridY)) {
        const dead = this.player.takeDamage(enemy.damage);
        this.uiManager.createParticles(
          this.offsetX + this.player.gridX * this.tileSize + this.tileSize / 2,
          this.offsetY + this.player.gridY * this.tileSize + this.tileSize / 2,
          'hit'
        );
        this.uiManager.showFloatingText(
          this.offsetX + this.player.gridX * this.tileSize + this.tileSize / 2,
          this.offsetY + this.player.gridY * this.tileSize,
          `-${enemy.damage}`,
          '#ff4444'
        );

        if (dead) {
          this.endGame(false);
          return;
        }
      } else {
        enemy.moveTowardsPlayer(
          this.player.gridX,
          this.player.gridY,
          (x, y, e) => this.canEnemyMoveTo(x, y, e)
        );
      }
    }
  }

  private checkChestPickup(): void {
    const px = this.player.gridX;
    const py = this.player.gridY;
    if (this.map[py][px] === TileType.CHEST) {
      this.map[py][px] = TileType.FLOOR;
      this.uiManager.addScore(100);
      this.uiManager.createParticles(
        this.offsetX + px * this.tileSize + this.tileSize / 2,
        this.offsetY + py * this.tileSize + this.tileSize / 2,
        'note'
      );
      this.uiManager.showFloatingText(
        this.offsetX + px * this.tileSize + this.tileSize / 2,
        this.offsetY + py * this.tileSize,
        '+100 宝箱!',
        '#ffd700'
      );

      const tile = this.mapTiles[py][px];
      this.tweens.add({
        targets: tile,
        scale: 0,
        alpha: 0,
        duration: 300,
        ease: Phaser.Math.Easing.Back.In,
        onComplete: () => {
          tile.destroy();
          const newTile = this.add.rectangle(
            this.offsetX + px * this.tileSize + this.tileSize / 2,
            this.offsetY + py * this.tileSize + this.tileSize / 2,
            this.tileSize - 2,
            this.tileSize - 2,
            0x1a0a2e,
            1
          );
          newTile.setStrokeStyle(1, 0x3a1f5e, 0.2);
          newTile.setDepth(1);
          this.mapTiles[py][px] = newTile;
        }
      });
    }
  }

  private checkWinCondition(): void {
    if (this.enemies.filter(e => !e.isDead).length === 0) {
      this.endGame(true);
    }
  }

  private endGame(win: boolean): void {
    this.gameOver = true;
    this.beatManager.stop();
    this.uiManager.showGameOver(win, this.uiManager.score);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.cameras.resize(gameSize.width, gameSize.height);
  }

  destroy(): void {
    if (this.beatManager) this.beatManager.destroy();
    if (this.player) this.player.destroy();
    if (this.uiManager) this.uiManager.destroy();
    this.enemies.forEach(e => e.destroy());
    this.scale.off('resize', this.handleResize, this);
    super.destroy();
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: '#0a0414',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_WIDTH,
    height: BASE_HEIGHT
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  input: {
    activePointers: 3
  },
  scene: [GameScene]
};

new Phaser.Game(config);
