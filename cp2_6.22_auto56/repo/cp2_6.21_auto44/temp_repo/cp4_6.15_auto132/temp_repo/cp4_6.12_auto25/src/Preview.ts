import {
  LevelConfig,
  TileType,
  EnemyConfig,
  CoinConfig,
  HealthConfig
} from './types';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  health: number;
  maxHealth: number;
  coins: number;
  flashTimer: number;
}

interface EnemyState extends EnemyConfig {
  currentPathIndex: number;
  movingForward: boolean;
  x: number;
  y: number;
}

interface CoinState extends CoinConfig {
  x: number;
  y: number;
  collected: boolean;
}

interface HealthState extends HealthConfig {
  x: number;
  y: number;
  collected: boolean;
}

export class Preview {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private level: LevelConfig | null = null;
  private player: Player | null = null;
  private enemies: EnemyState[] = [];
  private coins: CoinState[] = [];
  private healthPickups: HealthState[] = [];
  private keys: Set<string> = new Set();
  private animationFrameId: number | null = null;
  private audioContext: AudioContext | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private animationTime: number = 0;

  private readonly GRAVITY = 0.6;
  private readonly MOVE_SPEED = 4;
  private readonly JUMP_FORCE = -12;
  private readonly ENEMY_SPEED = 1.5;
  private readonly MAX_HEALTH = 5;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
  }

  start(level: LevelConfig): void {
    this.level = level;
    this.canvas.width = level.width * level.tileSize;
    this.canvas.height = level.height * level.tileSize;

    this.initPlayer();
    this.initEntities();
    this.bindInput();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.unbindInput();
  }

  private initPlayer(): void {
    if (!this.level) return;
    const tileSize = this.level.tileSize;

    let startX = tileSize * 2;
    let startY = tileSize * 2;

    for (let y = this.level.height - 2; y >= 0; y--) {
      if (this.level.tiles[y + 1][0] !== TileType.EMPTY) {
        startX = tileSize * 0.5;
        startY = y * tileSize;
        break;
      }
    }

    this.player = {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      width: tileSize * 0.7,
      height: tileSize * 0.9,
      onGround: false,
      health: this.MAX_HEALTH,
      maxHealth: this.MAX_HEALTH,
      coins: 0,
      flashTimer: 0
    };
  }

  private initEntities(): void {
    if (!this.level) return;
    const tileSize = this.level.tileSize;

    this.enemies = this.level.enemies.map(e => ({
      ...e,
      path: e.path.map(p => ({ ...p })),
      currentPathIndex: 0,
      movingForward: true,
      x: e.gridX * tileSize + tileSize / 2,
      y: e.gridY * tileSize + tileSize / 2
    }));

    this.coins = this.level.coins.map(c => ({
      ...c,
      x: c.gridX * tileSize + tileSize / 2,
      y: c.gridY * tileSize + tileSize / 2,
      collected: false
    }));

    this.healthPickups = this.level.healthPickups.map(h => ({
      ...h,
      x: h.gridX * tileSize + tileSize / 2,
      y: h.gridY * tileSize + tileSize / 2,
      collected: false
    }));
  }

  private bindInput(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private unbindInput(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault();
    }
    this.keys.add(key);
    if (key === ' ') {
      this.tryJump();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
  };

  private tryJump(): void {
    if (this.player && this.player.onGround) {
      this.player.vy = this.JUMP_FORCE;
      this.player.onGround = false;
    }
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2);
    this.lastTime = currentTime;
    this.animationTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(dt: number): void {
    if (!this.player || !this.level) return;

    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.checkCollectibles();
    this.checkEnemyCollision();
  }

  private updatePlayer(dt: number): void {
    if (!this.player || !this.level) return;

    const p = this.player;

    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      p.vx = -this.MOVE_SPEED;
    } else if (this.keys.has('d') || this.keys.has('arrowright')) {
      p.vx = this.MOVE_SPEED;
    } else {
      p.vx *= 0.8;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }

    if ((this.keys.has('w') || this.keys.has('arrowup')) && p.onGround) {
      p.vy = this.JUMP_FORCE;
      p.onGround = false;
    }

    p.vy += this.GRAVITY * dt;
    if (p.vy > 15) p.vy = 15;

    this.movePlayerWithCollision(p, dt);

    if (p.flashTimer > 0) {
      p.flashTimer -= dt * 16.67;
    }

    if (p.y > this.level.height * this.level.tileSize) {
      p.health = 0;
    }
  }

  private movePlayerWithCollision(p: Player, dt: number): void {
    if (!this.level) return;
    const tileSize = this.level.tileSize;

    p.x += p.vx * dt;

    const leftTile = Math.floor(p.x / tileSize);
    const rightTile = Math.floor((p.x + p.width) / tileSize);
    const topTile = Math.floor(p.y / tileSize);
    const bottomTile = Math.floor((p.y + p.height - 1) / tileSize);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (this.isSolidTile(tx, ty)) {
          if (p.vx > 0) {
            p.x = tx * tileSize - p.width;
          } else if (p.vx < 0) {
            p.x = (tx + 1) * tileSize;
          }
          p.vx = 0;
        }
      }
    }

    p.y += p.vy * dt;
    p.onGround = false;

    const leftTile2 = Math.floor(p.x / tileSize);
    const rightTile2 = Math.floor((p.x + p.width - 1) / tileSize);
    const topTile2 = Math.floor(p.y / tileSize);
    const bottomTile2 = Math.floor((p.y + p.height) / tileSize);

    for (let ty = topTile2; ty <= bottomTile2; ty++) {
      for (let tx = leftTile2; tx <= rightTile2; tx++) {
        if (this.isSolidTile(tx, ty)) {
          if (p.vy > 0) {
            p.y = ty * tileSize - p.height;
            p.onGround = true;
          } else if (p.vy < 0) {
            p.y = (ty + 1) * tileSize;
          }
          p.vy = 0;
        }
      }
    }

    if (p.x < 0) { p.x = 0; p.vx = 0; }
    if (p.x + p.width > this.level.width * tileSize) {
      p.x = this.level.width * tileSize - p.width;
      p.vx = 0;
    }
  }

  private isSolidTile(tx: number, ty: number): boolean {
    if (!this.level) return false;
    if (tx < 0 || tx >= this.level.width || ty < 0 || ty >= this.level.height) return true;
    return this.level.tiles[ty][tx] !== TileType.EMPTY;
  }

  private updateEnemies(dt: number): void {
    if (!this.level) return;
    const tileSize = this.level.tileSize;

    this.enemies.forEach(enemy => {
      if (enemy.path.length < 2) return;

      let targetIndex = enemy.currentPathIndex + (enemy.movingForward ? 1 : -1);

      if (targetIndex >= enemy.path.length) {
        enemy.movingForward = false;
        targetIndex = enemy.path.length - 2;
      } else if (targetIndex < 0) {
        enemy.movingForward = true;
        targetIndex = 1;
      }

      const target = enemy.path[enemy.movingForward ? enemy.currentPathIndex + 1 : enemy.currentPathIndex - 1];
      if (!target) return;

      const targetX = target.x * tileSize + tileSize / 2;
      const targetY = target.y * tileSize + tileSize / 2;

      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.ENEMY_SPEED * dt) {
        enemy.x = targetX;
        enemy.y = targetY;
        if (enemy.movingForward) {
          enemy.currentPathIndex++;
          if (enemy.currentPathIndex >= enemy.path.length - 1) {
            enemy.movingForward = false;
          }
        } else {
          enemy.currentPathIndex--;
          if (enemy.currentPathIndex <= 0) {
            enemy.movingForward = true;
          }
        }
      } else {
        enemy.x += (dx / dist) * this.ENEMY_SPEED * dt;
        enemy.y += (dy / dist) * this.ENEMY_SPEED * dt;
      }
    });
  }

  private checkCollectibles(): void {
    if (!this.player) return;
    const p = this.player;

    this.coins.forEach(coin => {
      if (coin.collected) return;
      if (this.checkCircleRectCollision(coin.x, coin.y, 12, p.x, p.y, p.width, p.height)) {
        coin.collected = true;
        p.coins++;
        this.playCoinSound();
      }
    });

    this.healthPickups.forEach(health => {
      if (health.collected) return;
      if (this.checkCircleRectCollision(health.x, health.y, 14, p.x, p.y, p.width, p.height)) {
        health.collected = true;
        if (p.health < p.maxHealth) {
          p.health++;
        }
        this.playHealthSound();
      }
    });
  }

  private checkCircleRectCollision(
    cx: number, cy: number, radius: number,
    rx: number, ry: number, rw: number, rh: number
  ): boolean {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < radius * radius;
  }

  private checkEnemyCollision(): void {
    if (!this.player || this.player.flashTimer > 0) return;
    const p = this.player;

    this.enemies.forEach(enemy => {
      const enemyRadius = (this.level?.tileSize || 40) * 0.4;
      if (this.checkCircleRectCollision(enemy.x, enemy.y, enemyRadius, p.x, p.y, p.width, p.height)) {
        p.health--;
        p.flashTimer = 1000;
        this.playHurtSound();
      }
    });
  }

  private playCoinSound(): void {
    this.initAudio();
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  private playHealthSound(): void {
    this.initAudio();
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, this.audioContext.currentTime);
    osc.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);

    gain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);
  }

  private playHurtSound(): void {
    this.initAudio();
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  private initAudio(): void {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        // Audio not supported
      }
    }
  }

  private render(): void {
    if (!this.level || !this.player) return;

    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground();
    this.drawTiles();
    this.drawCollectibles();
    this.drawEnemies();
    this.drawPlayer();
    this.drawHUD();

    if (this.player.health <= 0) {
      this.drawGameOver();
    }
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1A1A2E');
    gradient.addColorStop(1, '#16213E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawTiles(): void {
    if (!this.level) return;
    const tiles = this.level.tiles;
    const tileSize = this.level.tileSize;

    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const tile = tiles[y][x];
        if (tile !== TileType.EMPTY) {
          this.drawTile(x, y, tile, tileSize);
        }
      }
    }
  }

  private drawTile(gridX: number, gridY: number, type: TileType, size: number): void {
    const ctx = this.ctx;
    const x = gridX * size;
    const y = gridY * size;

    let mainColor = '';
    let borderColor = '';
    let highlightColor = '';

    switch (type) {
      case TileType.GRASS:
        mainColor = '#4CAF50';
        borderColor = '#2E7D32';
        highlightColor = '#81C784';
        break;
      case TileType.DIRT:
        mainColor = '#8D6E63';
        borderColor = '#5D4037';
        highlightColor = '#A1887F';
        break;
      case TileType.STONE:
        mainColor = '#757575';
        borderColor = '#424242';
        highlightColor = '#9E9E9E';
        break;
    }

    ctx.fillStyle = mainColor;
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

    if (type === TileType.GRASS) {
      ctx.fillStyle = highlightColor;
      ctx.fillRect(x + 2, y + 2, size - 4, 6);
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x + size - 6, y + 2, 4, size - 4);
      ctx.globalAlpha = 1;
    }
  }

  private drawCollectibles(): void {
    const time = this.animationTime;

    this.coins.forEach(coin => {
      if (!coin.collected) {
        this.drawCoinAnim(coin.x, coin.y, time);
      }
    });

    this.healthPickups.forEach(health => {
      if (!health.collected) {
        this.drawHealthAnim(health.x, health.y, time);
      }
    });
  }

  private drawCoinAnim(x: number, y: number, time: number): void {
    const ctx = this.ctx;
    const radius = 12;

    const pulse = 0.5 + 0.5 * Math.sin((time / 1000) * (Math.PI * 2) / 0.6);
    const scale = 0.9 + pulse * 0.1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, 1);

    const gradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.7, '#FFA500');
    gradient.addColorStop(1, '#FF8C00');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawHealthAnim(x: number, y: number, time: number): void {
    const ctx = this.ctx;
    const hSize = 14;

    const pulse = 0.5 + 0.5 * Math.sin((time / 1000) * (Math.PI * 2) / 0.6);
    const scale = 0.9 + pulse * 0.1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.moveTo(0, hSize * 0.5);
    ctx.bezierCurveTo(-hSize, 0, -hSize, -hSize, 0, -hSize * 0.3);
    ctx.bezierCurveTo(hSize, -hSize, hSize, 0, 0, hSize * 0.5);
    ctx.fill();

    ctx.strokeStyle = '#B71C1C';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  private drawEnemies(): void {
    this.enemies.forEach(enemy => {
      this.drawMushroomEnemy(enemy.x, enemy.y, (this.level?.tileSize || 40) * 0.4);
    });
  }

  private drawMushroomEnemy(x: number, y: number, radius: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#E91E63';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#AD1457';
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.2, radius, radius * 0.6, 0, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.2, radius * 0.25, 0, Math.PI * 2);
    ctx.arc(x + radius * 0.3, y - radius * 0.2, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x - radius * 0.25, y - radius * 0.15, radius * 0.12, 0, Math.PI * 2);
    ctx.arc(x + radius * 0.35, y - radius * 0.15, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F48FB1';
    ctx.fillRect(x - radius * 0.5, y - radius, radius * 0.3, radius * 0.3);
    ctx.fillRect(x + radius * 0.2, y - radius, radius * 0.3, radius * 0.3);

    ctx.fillStyle = '#FCE4EC';
    ctx.fillRect(x - radius * 0.45, y - radius * 0.9, radius * 0.2, radius * 0.15);
    ctx.fillRect(x + radius * 0.25, y - radius * 0.9, radius * 0.2, radius * 0.15);
  }

  private drawPlayer(): void {
    if (!this.player) return;
    const p = this.player;

    if (p.flashTimer > 0 && Math.floor(p.flashTimer / 100) % 2 === 0) {
      return;
    }

    const ctx = this.ctx;

    ctx.fillStyle = p.flashTimer > 0 ? '#FF5252' : '#2196F3';
    ctx.fillRect(p.x, p.y, p.width, p.height);

    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x + 1, p.y + 1, p.width - 2, p.height - 2);

    const eyeY = p.y + p.height * 0.3;
    const eyeSize = p.width * 0.18;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(p.x + p.width * 0.3, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(p.x + p.width * 0.7, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    const lookDir = p.vx > 0 ? 1 : p.vx < 0 ? -1 : 0;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(p.x + p.width * 0.3 + lookDir * 3, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.arc(p.x + p.width * 0.7 + lookDir * 3, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x + p.width * 0.5, p.y + p.height * 0.55, p.width * 0.2, 0, Math.PI);
    ctx.stroke();
  }

  private drawHUD(): void {
    if (!this.player) return;
    const ctx = this.ctx;

    ctx.font = '18px monospace';
    ctx.textBaseline = 'top';

    let hearts = '';
    for (let i = 0; i < this.player.maxHealth; i++) {
      hearts += i < this.player.health ? '❤' : '🖤';
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(hearts, 16, 12);

    ctx.fillText(`🪙 ${this.player.coins}`, 16, 38);
  }

  private drawGameOver(): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#FF5252';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);

    ctx.font = '24px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`金币: ${this.player?.coins || 0}`, this.canvas.width / 2, this.canvas.height / 2 + 20);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
