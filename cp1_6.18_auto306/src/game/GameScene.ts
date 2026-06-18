import Phaser from 'phaser';
import { DungeonGenerator } from './DungeonGenerator';
import { EchoCollector } from './EchoCollector';
import { EnemyAI } from './EnemyAI';
import { useGameStore } from '@/store/gameStore';
import {
  DungeonMap,
  EchoShard,
  ShadowGuard,
  Particle,
  TILE_SIZE,
  PLAYER_SIZE,
  SHARD_WIDTH,
  SHARD_HEIGHT,
  GUARD_SIZE,
  MEMORY_FRAGMENTS,
  AREA_NAMES,
} from '@/types';

export class GameScene extends Phaser.Scene {
  private dungeonGenerator!: DungeonGenerator;
  private echoCollector!: EchoCollector;
  private enemyAI!: EnemyAI;

  private dungeonMap!: DungeonMap;
  private player = { x: 0, y: 0, moveCooldown: 0, hurtFlash: 0, knockback: { x: 0, y: 0, time: 0 } };

  private graphics!: Phaser.GameObjects.Graphics;
  private shardGraphics!: Phaser.GameObjects.Graphics;
  private guardGraphics!: Phaser.GameObjects.Graphics;
  private playerGraphics!: Phaser.GameObjects.Graphics;
  private particleGraphics!: Phaser.GameObjects.Graphics;
  private overlayGraphics!: Phaser.GameObjects.Graphics;

  private particles: Particle[] = [];
  private maxParticles: number = 50;

  private keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};
  private lastMoveTime: number = 0;
  private moveInterval: number = 200;

  private cameraOffset = { x: 0, y: 0 };

  private doorOpen: boolean = false;
  private doorAnimation: number = 0;

  private fadeAlpha: number = 0;
  private fadeDirection: number = 0;
  private transitioning: boolean = false;

  private memoryText!: Phaser.GameObjects.Text;
  private memoryBg!: Phaser.GameObjects.Graphics;
  private memoryTimer: number = 0;
  private memoryVisible: boolean = false;

  private gameWidth: number = 960;
  private gameHeight: number = 640;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameWidth = this.cameras.main.width;
    this.gameHeight = this.cameras.main.height;

    this.graphics = this.add.graphics();
    this.shardGraphics = this.add.graphics();
    this.guardGraphics = this.add.graphics();
    this.playerGraphics = this.add.graphics();
    this.particleGraphics = this.add.graphics();
    this.overlayGraphics = this.add.graphics();

    this.setupKeys();
    this.setupMemoryText();
    this.initGame();

    this.scale.on('resize', this.handleResize, this);
    this.handleResize();
  }

  private setupKeys(): void {
    this.keys = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  private initGame(): void {
    const areaIndex = useGameStore.getState().areaIndex;

    this.dungeonGenerator = new DungeonGenerator(areaIndex + 1);
    this.dungeonMap = this.dungeonGenerator.generate();

    this.echoCollector = new EchoCollector(5);
    this.echoCollector.setMap(this.dungeonMap);
    this.echoCollector.setOnShardCollected(this.onShardCollected.bind(this));
    this.echoCollector.setOnCollectionComplete(this.onAllShardsCollected.bind(this));
    this.echoCollector.generateShards();

    const guardRooms = this.dungeonGenerator.getMiddleRooms(this.dungeonMap.rooms);
    this.enemyAI = new EnemyAI({
      onPlayerCaught: this.onPlayerCaught.bind(this),
      onModeChange: this.onGuardModeChange.bind(this),
    }, 2);
    this.enemyAI.setMap(this.dungeonMap);
    this.enemyAI.generateGuards(guardRooms);

    const startRoom = this.dungeonMap.startRoom;
    this.player.x = startRoom.centerX + 0.5;
    this.player.y = startRoom.centerY + 0.5;
    this.player.moveCooldown = 0;
    this.player.hurtFlash = 0;
    this.player.knockback = { x: 0, y: 0, time: 0 };

    this.cameraOffset.x = this.player.x * TILE_SIZE - this.gameWidth / 2;
    this.cameraOffset.y = this.player.y * TILE_SIZE - this.gameHeight / 2;

    this.doorOpen = false;
    this.doorAnimation = 0;

    useGameStore.getState().setTotalShards(5);
    useGameStore.getState().shardsCollected = 0;

    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: 0, y: 0, vx: 0, vy: 0,
        color: '#FFD700', radius: 3,
        life: 0, maxLife: 0.5, active: false,
      });
    }

    this.fadeIn();
  }

  private setupMemoryText(): void {
    this.memoryBg = this.add.graphics();
    this.memoryText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, '', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#FFFFFF',
      align: 'center',
      wordWrap: { width: 600 },
    }).setOrigin(0.5).setDepth(100);

    this.memoryBg.setDepth(99);
    this.memoryText.setVisible(false);
    this.memoryBg.setVisible(false);
  }

  update(time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    const gameStatus = useGameStore.getState().gameStatus;

    if (gameStatus !== 'playing') return;
    if (this.transitioning) {
      this.updateFade(deltaSeconds);
      return;
    }

    this.handlePlayerMovement(delta);
    this.echoCollector.update(deltaSeconds);
    this.enemyAI.update(deltaSeconds, this.player.x, this.player.y);

    this.updateParticles(deltaSeconds);
    this.updateCamera();
    this.updateHurtFlash(deltaSeconds);
    this.updateKnockback(deltaSeconds);

    if (this.doorOpen) {
      this.doorAnimation = Math.min(1, this.doorAnimation + deltaSeconds * 2);
      this.checkExitCollision();
    }

    this.updateMemoryText(deltaSeconds);

    this.render();
  }

  private handlePlayerMovement(delta: number): void {
    this.player.moveCooldown -= delta;

    if (this.player.knockback.time > 0) {
      return;
    }

    let dx = 0;
    let dy = 0;

    if (this.keys.left.isDown || this.keys.a.isDown) dx -= 1;
    if (this.keys.right.isDown || this.keys.d.isDown) dx += 1;
    if (this.keys.up.isDown || this.keys.w.isDown) dy -= 1;
    if (this.keys.down.isDown || this.keys.s.isDown) dy += 1;

    if (dx !== 0 || dy !== 0) {
      if (this.player.moveCooldown <= 0) {
        this.tryMovePlayer(dx, dy);
        this.player.moveCooldown = this.moveInterval;
      }
    }
  }

  private tryMovePlayer(dx: number, dy: number): void {
    const newX = this.player.x + dx;
    const newY = this.player.y + dy;

    if (this.canMoveTo(newX, this.player.y)) {
      this.player.x = newX;
    }
    if (this.canMoveTo(this.player.x, newY)) {
      this.player.y = newY;
    }

    this.echoCollector.checkCollection(this.player.x, this.player.y);
  }

  private canMoveTo(x: number, y: number): boolean {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);

    if (tileX < 0 || tileX >= this.dungeonMap.width || tileY < 0 || tileY >= this.dungeonMap.height) {
      return false;
    }

    const tile = this.dungeonMap.tiles[tileY][tileX];
    if (tile.type === 'wall') return false;

    if (tile.type === 'corridor' && !this.doorOpen) {
      if (this.isExitDoor(tileX, tileY)) {
        return false;
      }
    }

    for (const guard of this.enemyAI.getGuards()) {
      const dist = Math.sqrt(Math.pow(x - guard.x, 2) + Math.pow(y - guard.y, 2));
      if (dist < 0.8) return false;
    }

    return true;
  }

  private isExitDoor(x: number, y: number): boolean {
    const endRoom = this.dungeonMap.endRoom;
    const distToEnd = Math.sqrt(
      Math.pow(x - endRoom.centerX, 2) + Math.pow(y - endRoom.centerY, 2)
    );
    return distToEnd < 2;
  }

  private checkExitCollision(): void {
    const endRoom = this.dungeonMap.endRoom;
    const distToEnd = Math.sqrt(
      Math.pow(this.player.x - endRoom.centerX, 2) +
      Math.pow(this.player.y - endRoom.centerY, 2)
    );

    if (distToEnd < 1.5 && this.doorAnimation >= 1) {
      this.goToNextArea();
    }
  }

  private goToNextArea(): void {
    if (this.transitioning) return;

    const currentAreaIndex = useGameStore.getState().areaIndex;

    if (currentAreaIndex >= AREA_NAMES.length - 1) {
      useGameStore.getState().setGameStatus('victory');
      return;
    }

    this.fadeOut(() => {
      useGameStore.getState().nextArea();
      const newAreaIndex = useGameStore.getState().areaIndex;
      const memory = MEMORY_FRAGMENTS[newAreaIndex - 1];
      if (memory) {
        this.showMemoryFragment(memory.text);
      }
      this.initGame();
    });
  }

  private onShardCollected(shard: EchoShard): void {
    useGameStore.getState().collectShard();
    this.spawnCollectParticles(shard.x, shard.y);
  }

  private onAllShardsCollected(): void {
    this.doorOpen = true;
  }

  private onPlayerCaught(guard: ShadowGuard): void {
    const invincible = useGameStore.getState().invincible;
    if (invincible) return;

    useGameStore.getState().takeDamage();
    this.player.hurtFlash = 0.5;

    const dx = this.player.x - guard.x;
    const dy = this.player.y - guard.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const knockbackDist = 3;

    this.player.knockback = {
      x: (dx / dist) * knockbackDist,
      y: (dy / dist) * knockbackDist,
      time: 0.3,
    };
  }

  private updateKnockback(deltaTime: number): void {
    if (this.player.knockback.time > 0) {
      const moveAmount = this.player.knockback.time > 0 ? deltaTime * 10 : 0;
      const kb = this.player.knockback;

      const newX = this.player.x + kb.x * (deltaTime / kb.time);
      const newY = this.player.y + kb.y * (deltaTime / kb.time);

      if (this.canMoveTo(newX, this.player.y)) {
        this.player.x = newX;
      }
      if (this.canMoveTo(this.player.x, newY)) {
        this.player.y = newY;
      }

      this.player.knockback.time -= deltaTime;
    }
  }

  private onGuardModeChange(guard: ShadowGuard, mode: 'patrol' | 'chase'): void {
  }

  private spawnCollectParticles(x: number, y: number): void {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const particle = this.getInactiveParticle();
      if (particle) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 5 + Math.random() * 10;
        particle.x = x;
        particle.y = y;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        particle.color = '#FFD700';
        particle.radius = 3;
        particle.life = 0.5;
        particle.maxLife = 0.5;
        particle.active = true;
      }
    }
  }

  private getInactiveParticle(): Particle | null {
    for (const p of this.particles) {
      if (!p.active) return p;
    }
    return null;
  }

  private updateParticles(deltaTime: number): void {
    for (const p of this.particles) {
      if (p.active) {
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= deltaTime;
        if (p.life <= 0) {
          p.active = false;
        }
      }
    }
  }

  private updateHurtFlash(deltaTime: number): void {
    if (this.player.hurtFlash > 0) {
      this.player.hurtFlash -= deltaTime;
    }
  }

  private updateCamera(): void {
    const targetX = this.player.x * TILE_SIZE - this.gameWidth / 2;
    const targetY = this.player.y * TILE_SIZE - this.gameHeight / 2;

    this.cameraOffset.x += (targetX - this.cameraOffset.x) * 0.1;
    this.cameraOffset.y += (targetY - this.cameraOffset.y) * 0.1;
  }

  private fadeIn(): void {
    this.fadeAlpha = 1;
    this.fadeDirection = -1;
    this.transitioning = true;
  }

  private fadeOut(callback?: () => void): void {
    this.fadeAlpha = 0;
    this.fadeDirection = 1;
    this.transitioning = true;
    (this as any).fadeCallback = callback || null;
  }

  private updateFade(deltaTime: number): void {
    this.fadeAlpha += this.fadeDirection * deltaTime * 2;

    if (this.fadeDirection < 0 && this.fadeAlpha <= 0) {
      this.fadeAlpha = 0;
      this.transitioning = false;
      this.fadeDirection = 0;
    } else if (this.fadeDirection > 0 && this.fadeAlpha >= 1) {
      this.fadeAlpha = 1;
      this.transitioning = false;
      this.fadeDirection = 0;
      const callback = (this as any).fadeCallback;
      if (callback) {
        (this as any).fadeCallback = null;
        callback();
      }
    }

    this.render();
  }

  private showMemoryFragment(text: string): void {
    this.memoryText.setText(text);
    this.memoryText.setVisible(true);
    this.memoryBg.setVisible(true);
    this.memoryVisible = true;
    this.memoryTimer = 3;

    this.memoryText.setAlpha(0);
    this.memoryBg.setAlpha(0);
  }

  private updateMemoryText(deltaTime: number): void {
    if (!this.memoryVisible) return;

    this.memoryTimer -= deltaTime;

    if (this.memoryTimer > 2.5) {
      const t = (3 - this.memoryTimer) / 0.5;
      this.memoryText.setAlpha(t);
      this.memoryBg.setAlpha(t);
    } else if (this.memoryTimer < 0.5 && this.memoryTimer > 0) {
      const t = this.memoryTimer / 0.5;
      this.memoryText.setAlpha(t);
      this.memoryBg.setAlpha(t);
    } else if (this.memoryTimer <= 0) {
      this.memoryText.setVisible(false);
      this.memoryBg.setVisible(false);
      this.memoryVisible = false;
    }

    if (this.memoryVisible) {
      this.memoryBg.clear();
      const textWidth = Math.min(this.memoryText.width + 40, 600);
      const textHeight = this.memoryText.height + 30;
      this.memoryBg.fillStyle(0x000000, 0.5);
      this.memoryBg.fillRoundedRect(
        this.gameWidth / 2 - textWidth / 2,
        this.gameHeight / 2 - textHeight / 2,
        textWidth,
        textHeight,
        10
      );
    }
  }

  private render(): void {
    this.graphics.clear();
    this.shardGraphics.clear();
    this.guardGraphics.clear();
    this.playerGraphics.clear();
    this.particleGraphics.clear();
    this.overlayGraphics.clear();

    this.renderDungeon();
    this.renderShards();
    this.renderGuards();
    this.renderPlayer();
    this.renderParticles();
    this.renderFadeOverlay();
  }

  private renderDungeon(): void {
    const { x: offsetX, y: offsetY } = this.cameraOffset;

    for (let y = 0; y < this.dungeonMap.height; y++) {
      for (let x = 0; x < this.dungeonMap.width; x++) {
        const tile = this.dungeonMap.tiles[y][x];
        const screenX = x * TILE_SIZE - offsetX;
        const screenY = y * TILE_SIZE - offsetY;

        if (screenX < -TILE_SIZE || screenX > this.gameWidth + TILE_SIZE ||
            screenY < -TILE_SIZE || screenY > this.gameHeight + TILE_SIZE) {
          continue;
        }

        if (tile.type === 'wall') {
          this.graphics.fillStyle(0x2C2C2C, 1);
          this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

          this.graphics.lineStyle(1, 0x757575, 0.3);
          this.graphics.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        } else if (tile.type === 'floor') {
          this.graphics.fillStyle(0x3E2723, 1);
          this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        } else if (tile.type === 'corridor') {
          this.graphics.fillStyle(0x4E342E, 1);
          this.graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    this.renderDoor();
  }

  private renderDoor(): void {
    const endRoom = this.dungeonMap.endRoom;
    const { x: offsetX, y: offsetY } = this.cameraOffset;

    const doorX = endRoom.centerX * TILE_SIZE - offsetX;
    const doorY = endRoom.centerY * TILE_SIZE - offsetY;

    if (this.doorAnimation < 1) {
      const alpha = 1 - this.doorAnimation;
      const doorHeight = TILE_SIZE * 1.5 * (1 - this.doorAnimation);

      this.graphics.fillStyle(0x4E342E, alpha);
      this.graphics.fillRect(
        doorX - TILE_SIZE / 2,
        doorY - doorHeight / 2,
        TILE_SIZE,
        doorHeight
      );

      if (alpha > 0.3) {
        this.graphics.fillStyle(0xFFD700, alpha * 0.6);
        this.graphics.fillRect(doorX - 3, doorY - doorHeight / 3, 6, 4);
        this.graphics.fillRect(doorX - 8, doorY - 4, 4, 4);
        this.graphics.fillRect(doorX + 4, doorY + 4, 4, 4);
      }
    }
  }

  private renderShards(): void {
    const { x: offsetX, y: offsetY } = this.cameraOffset;

    for (const shard of this.echoCollector.getShards()) {
      if (shard.collected) continue;

      const screenX = shard.x * TILE_SIZE - offsetX;
      const screenY = shard.y * TILE_SIZE - offsetY;

      const flickerIntensity = 0.5 + Math.sin(shard.flickerTimer) * 0.3;
      const alpha = 0.8 * flickerIntensity;

      const glowRadius = 15;
      const glow = this.shardGraphics;
      glow.fillStyle(0xFFD700, 0.2 * flickerIntensity);
      glow.fillCircle(screenX, screenY, glowRadius);

      glow.save();
      glow.translate(screenX, screenY);
      glow.rotate(shard.rotation);

      glow.fillStyle(0xFFD700, alpha);
      glow.beginPath();
      glow.moveTo(0, -SHARD_HEIGHT);
      glow.lineTo(SHARD_WIDTH, 0);
      glow.lineTo(0, SHARD_HEIGHT);
      glow.lineTo(-SHARD_WIDTH, 0);
      glow.closePath();
      glow.fillPath();

      glow.fillStyle(0xFFFFFF, alpha * 0.5);
      glow.beginPath();
      glow.moveTo(0, -SHARD_HEIGHT);
      glow.lineTo(SHARD_WIDTH / 2, -SHARD_HEIGHT / 2);
      glow.lineTo(-SHARD_WIDTH / 2, -SHARD_HEIGHT / 2);
      glow.closePath();
      glow.fillPath();

      glow.restore();
    }
  }

  private renderGuards(): void {
    const { x: offsetX, y: offsetY } = this.cameraOffset;

    for (const guard of this.enemyAI.getGuards()) {
      for (let i = guard.trail.length - 1; i >= 0; i--) {
        const trail = guard.trail[i];
        const screenX = trail.x * TILE_SIZE - offsetX;
        const screenY = trail.y * TILE_SIZE - offsetY;

        const trailColor = guard.mode === 'chase' ? 0xFF1744 : 0x6A1B9A;
        this.guardGraphics.fillStyle(trailColor, trail.alpha * 0.5);
        this.guardGraphics.fillCircle(screenX, screenY, GUARD_SIZE * (1 - i * 0.1));
      }

      const screenX = guard.x * TILE_SIZE - offsetX;
      const screenY = guard.y * TILE_SIZE - offsetY;

      const bodyColor = guard.mode === 'chase' ? 0xFF1744 : 0x6A1B9A;
      this.guardGraphics.fillStyle(bodyColor, 0.8);
      this.guardGraphics.fillCircle(screenX, screenY, GUARD_SIZE);

      this.guardGraphics.fillStyle(0xFFFFFF, 0.6);
      this.guardGraphics.fillCircle(screenX - 3, screenY - 2, 2);
      this.guardGraphics.fillCircle(screenX + 3, screenY - 2, 2);

      if (guard.stunTimer > 0) {
        this.guardGraphics.lineStyle(2, 0xFFFF00, 0.8);
        this.guardGraphics.strokeCircle(screenX, screenY, GUARD_SIZE + 3);
      }
    }
  }

  private renderPlayer(): void {
    const { x: offsetX, y: offsetY } = this.cameraOffset;
    const screenX = this.player.x * TILE_SIZE - offsetX;
    const screenY = this.player.y * TILE_SIZE - offsetY;

    const glowRadius = 20;
    const playerColor = this.player.hurtFlash > 0 && Math.floor(this.player.hurtFlash * 10) % 2 === 0
      ? 0xFF0000
      : 0x00E5FF;

    this.playerGraphics.fillStyle(0xFFFFFF, 0.3);
    this.playerGraphics.fillCircle(screenX, screenY, glowRadius);

    this.playerGraphics.fillStyle(playerColor, 1);
    this.playerGraphics.fillCircle(screenX, screenY, PLAYER_SIZE);

    this.playerGraphics.fillStyle(0xFFFFFF, 0.6);
    this.playerGraphics.fillCircle(screenX - 3, screenY - 3, 4);
  }

  private renderParticles(): void {
    const { x: offsetX, y: offsetY } = this.cameraOffset;

    for (const p of this.particles) {
      if (p.active) {
        const screenX = p.x * TILE_SIZE - offsetX;
        const screenY = p.y * TILE_SIZE - offsetY;
        const alpha = p.life / p.maxLife;

        const color = Phaser.Display.Color.HexStringToColor(p.color).color;
        this.particleGraphics.fillStyle(color, alpha);
        this.particleGraphics.fillCircle(screenX, screenY, p.radius * alpha);
      }
    }
  }

  private renderFadeOverlay(): void {
    if (this.fadeAlpha > 0) {
      this.overlayGraphics.fillStyle(0x000000, this.fadeAlpha);
      this.overlayGraphics.fillRect(0, 0, this.gameWidth, this.gameHeight);
    }
  }

  private handleResize = (): void => {
    if (this.cameras?.main) {
      this.gameWidth = this.cameras.main.width;
      this.gameHeight = this.cameras.main.height;

      if (this.memoryText) {
        this.memoryText.setPosition(this.gameWidth / 2, this.gameHeight / 2);
      }
    }
  };

  public restart(): void {
    useGameStore.getState().resetGame();
    this.initGame();
  }
}
