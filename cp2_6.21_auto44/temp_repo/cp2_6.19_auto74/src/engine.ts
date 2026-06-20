import { InputManager } from './input';
import { Renderer } from './renderer';
import { AudioManager } from './audioManager';
import {
  Tank,
  Bullet,
  Brick,
  PowerUp,
  Mine,
  Base,
  Particle,
  PickupText,
  Star,
  Direction,
  PowerUpType,
  GameState,
  MAP_WIDTH,
  MAP_HEIGHT,
  TANK_SIZE,
  BULLET_RADIUS,
  BRICK_WIDTH,
  BRICK_HEIGHT,
  POWERUP_SIZE,
  EXPLOSION_RADIUS,
  WIN_SCORE,
  circleCollision,
  rectVsCircleCollision
} from './entities';

const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: InputManager;

  private gameState: GameState = 'menu';
  private lastTime: number = 0;
  private accumulator: number = 0;
  private currentTime: number = 0;

  private tank1!: Tank;
  private tank2!: Tank;
  private bullets: Bullet[] = [];
  private bricks: Brick[] = [];
  private powerUps: PowerUp[] = [];
  private mines: Mine[] = [];
  private base1!: Base;
  private base2!: Base;
  private particles: Particle[] = [];
  private pickupTexts: PickupText[] = [];
  private stars: Star[] = [];

  private player1Score: number = 0;
  private player2Score: number = 0;
  private currentRound: number = 1;
  private roundWinner: 1 | 2 | null = null;
  private winnerFlash: 1 | 2 | null = null;
  private winnerFlashEndTime: number = 0;
  private finalWinner: 1 | 2 | null = null;

  private countdownNumber: number = 3;
  private countdownStartTime: number = 0;
  private roundEndStartTime: number = 0;
  private victoryStartTime: number = 0;
  private lastFireworkTime: number = 0;

  private audio: AudioManager = new AudioManager();

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('找不到Canvas元素');
    }
    this.renderer = new Renderer(this.canvas);
    this.input = new InputManager();
    this.initStars();
    this.setupVolumeControl();
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 5; i++) {
      this.stars.push(new Star(
        Math.random() * MAP_WIDTH,
        Math.random() * MAP_HEIGHT
      ));
    }
  }

  private setupVolumeControl(): void {
    const volumeSlider = document.getElementById('volume') as HTMLInputElement;
    if (volumeSlider) {
      this.audio.setVolume(parseInt(volumeSlider.value) / 100);
      volumeSlider.addEventListener('input', () => {
        this.audio.setVolume(parseInt(volumeSlider.value) / 100);
      });
    }

    const musicToggle = document.getElementById('musicToggle') as HTMLButtonElement;
    if (musicToggle) {
      musicToggle.addEventListener('click', () => {
        const enabled = !this.audio.isMusicEnabled();
        this.audio.toggleMusic(!enabled);
        musicToggle.textContent = !enabled ? '🎵 音乐:开' : '🎵 音乐:关';
      });
    }
  }

  private resetMatch(): void {
    this.player1Score = 0;
    this.player2Score = 0;
    this.currentRound = 1;
    this.finalWinner = null;
    this.initRound();
  }

  private initRound(): void {
    this.bullets = [];
    this.particles = [];
    this.pickupTexts = [];
    this.mines = [];
    this.winnerFlash = null;
    this.roundWinner = null;

    this.tank1 = new Tank(60, MAP_HEIGHT / 2 - TANK_SIZE / 2, 'right', '#00ff00', 1);
    this.tank2 = new Tank(MAP_WIDTH - 60 - TANK_SIZE, MAP_HEIGHT / 2 - TANK_SIZE / 2, 'left', '#00aaff', 2);

    this.base1 = new Base(30, MAP_HEIGHT / 2 - 20, 1);
    this.base2 = new Base(MAP_WIDTH - 30 - 40, MAP_HEIGHT / 2 - 20, 2);

    this.generateBricks();
    this.generatePowerUps();
  }

  private generateBricks(): void {
    this.bricks = [];
    const centerY = MAP_HEIGHT / 2;
    const startX = 150;
    const endX = MAP_WIDTH - 150 - BRICK_WIDTH;

    for (let x = startX; x <= endX; x += BRICK_WIDTH + 4) {
      const offset = Math.floor((x - startX) / (BRICK_WIDTH + 4)) % 2 === 0 ? -20 : 20;
      const y1 = centerY - BRICK_HEIGHT + offset;
      const y2 = centerY + offset;
      const y3 = centerY + BRICK_HEIGHT + offset;

      if (y1 > 60) this.bricks.push(new Brick(x, y1));
      this.bricks.push(new Brick(x, y2));
      if (y3 < MAP_HEIGHT - 20) this.bricks.push(new Brick(x, y3));
    }
  }

  private generatePowerUps(): void {
    this.powerUps = [];
    const types: PowerUpType[] = ['shield', 'speed', 'rapidFire', 'mine'];
    const now = performance.now();
    let attempts = 0;
    const maxAttempts = 500;

    while (this.powerUps.length < 10 && attempts < maxAttempts) {
      attempts++;
      const x = 80 + Math.random() * (MAP_WIDTH - 160 - POWERUP_SIZE);
      const y = 80 + Math.random() * (MAP_HEIGHT - 160 - POWERUP_SIZE);

      let valid = true;

      const tank1CX = this.tank1.getCenterX();
      const tank1CY = this.tank1.getCenterY();
      const tank2CX = this.tank2.getCenterX();
      const tank2CY = this.tank2.getCenterY();

      if (circleCollision(x + POWERUP_SIZE / 2, y + POWERUP_SIZE / 2, POWERUP_SIZE / 2,
        tank1CX, tank1CY, TANK_SIZE / 2 + 20)) {
        valid = false;
      }
      if (valid && circleCollision(x + POWERUP_SIZE / 2, y + POWERUP_SIZE / 2, POWERUP_SIZE / 2,
        tank2CX, tank2CY, TANK_SIZE / 2 + 20)) {
        valid = false;
      }

      if (valid) {
        for (const brick of this.bricks) {
          if (rectVsCircleCollision(brick.x, brick.y, brick.width, brick.height,
            x + POWERUP_SIZE / 2, y + POWERUP_SIZE / 2, POWERUP_SIZE / 2)) {
            valid = false;
            break;
          }
        }
      }

      if (valid) {
        for (const pu of this.powerUps) {
          if (circleCollision(x + POWERUP_SIZE / 2, y + POWERUP_SIZE / 2, POWERUP_SIZE / 2,
            pu.getCenterX(), pu.getCenterY(), POWERUP_SIZE)) {
            valid = false;
            break;
          }
        }
      }

      if (valid) {
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerUps.push(new PowerUp(x, y, type, now));
      }
    }
  }

  start(): void {
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private gameLoop(timestamp: number): void {
    if (this.lastTime === 0) {
      this.lastTime = timestamp;
    }

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.accumulator += deltaTime;
    this.currentTime = timestamp;

    while (this.accumulator >= FRAME_TIME) {
      this.update(FRAME_TIME);
      this.accumulator -= FRAME_TIME;
    }

    this.render();
    this.input.endFrame();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private update(deltaTime: number): void {
    for (const star of this.stars) {
      star.update(deltaTime);
    }

    switch (this.gameState) {
      case 'menu':
        this.updateMenu();
        break;
      case 'countdown':
        this.updateCountdown();
        break;
      case 'playing':
        this.updatePlaying(deltaTime);
        break;
      case 'roundEnd':
        this.updateRoundEnd();
        break;
      case 'victory':
        this.updateVictory(deltaTime);
        break;
    }
  }

  private updateMenu(): void {
    if (this.input.isSpacePressed()) {
      this.audio.init();
      this.audio.resume();
      this.resetMatch();
      this.startCountdown();
    }
  }

  private startCountdown(): void {
    this.gameState = 'countdown';
    this.countdownNumber = 3;
    this.countdownStartTime = this.currentTime;
  }

  private updateCountdown(): void {
    const elapsed = this.currentTime - this.countdownStartTime;
    const newNumber = 3 - Math.floor(elapsed / 1000);

    if (newNumber !== this.countdownNumber) {
      this.countdownNumber = newNumber;
    }

    if (elapsed >= 3000) {
      this.gameState = 'playing';
    }
  }

  private updatePlaying(deltaTime: number): void {
    this.tank1.updateTimers(this.currentTime);
    this.tank2.updateTimers(this.currentTime);

    this.handleTankInput(this.tank1, this.input.getPlayer1Input());
    this.handleTankInput(this.tank2, this.input.getPlayer2Input());

    for (const bullet of this.bullets) {
      bullet.update();
    }
    this.bullets = this.bullets.filter(b => !b.isOutOfBounds());

    for (const mine of this.mines) {
      mine.checkArmed(this.currentTime);
    }

    for (const particle of this.particles) {
      particle.update(deltaTime);
    }
    this.particles = this.particles.filter(p => p.life > 0);

    for (const text of this.pickupTexts) {
      text.update(deltaTime);
    }
    this.pickupTexts = this.pickupTexts.filter(t => t.life > 0);

    this.checkCollisions();
  }

  private handleTankInput(
    tank: Tank,
    input: { up: boolean; down: boolean; left: boolean; right: boolean; fire: boolean }
  ): void {
    if (tank.stunned) return;

    const speed = tank.getCurrentSpeed();

    if (input.up) {
      tank.direction = 'up';
      this.tryMoveTank(tank, 0, -speed);
    } else if (input.down) {
      tank.direction = 'down';
      this.tryMoveTank(tank, 0, speed);
    } else if (input.left) {
      tank.direction = 'left';
      this.tryMoveTank(tank, -speed, 0);
    } else if (input.right) {
      tank.direction = 'right';
      this.tryMoveTank(tank, speed, 0);
    }

    if (input.fire && tank.canFire(this.currentTime)) {
      this.fireBullet(tank);
    }
  }

  private tryMoveTank(tank: Tank, dx: number, dy: number): void {
    const newX = tank.x + dx;
    const newY = tank.y + dy;

    if (newX < 10 || newX + tank.width > MAP_WIDTH - 10 ||
        newY < 60 || newY + tank.height > MAP_HEIGHT - 10) {
      return;
    }

    for (const brick of this.bricks) {
      if (rectVsCircleCollision(
        brick.x, brick.y, brick.width, brick.height,
        newX + tank.width / 2, newY + tank.height / 2, tank.getRadius() - 2
      )) {
        return;
      }
    }

    const otherTank = tank.playerId === 1 ? this.tank2 : this.tank1;
    if (circleCollision(
      newX + tank.width / 2, newY + tank.height / 2, tank.getRadius() - 2,
      otherTank.x + otherTank.width / 2, otherTank.y + otherTank.height / 2, otherTank.getRadius() - 2
    )) {
      return;
    }

    tank.x = newX;
    tank.y = newY;
  }

  private fireBullet(tank: Tank): void {
    tank.lastFireTime = this.currentTime;
    let bx = tank.getCenterX();
    let by = tank.getCenterY();

    switch (tank.direction) {
      case 'up':
        by -= tank.height / 2 + BULLET_RADIUS;
        break;
      case 'down':
        by += tank.height / 2 + BULLET_RADIUS;
        break;
      case 'left':
        bx -= tank.width / 2 + BULLET_RADIUS;
        break;
      case 'right':
        bx += tank.width / 2 + BULLET_RADIUS;
        break;
    }

    this.bullets.push(new Bullet(bx, by, tank.direction, tank.playerId));
  }

  private checkCollisions(): void {
    const bulletsToRemove = new Set<number>();

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const brick = this.bricks[j];
        if (rectVsCircleCollision(
          brick.x, brick.y, brick.width, brick.height,
          bullet.x, bullet.y, bullet.radius
        )) {
          this.createBrickParticles(brick);
          this.bricks.splice(j, 1);
          bulletsToRemove.add(i);
          break;
        }
      }

      if (bulletsToRemove.has(i)) continue;

      const targetTank = bullet.ownerId === 1 ? this.tank2 : this.tank1;
      if (circleCollision(
        bullet.x, bullet.y, bullet.radius,
        targetTank.getCenterX(), targetTank.getCenterY(), targetTank.getRadius()
      )) {
        if (targetTank.shieldActive) {
          targetTank.shieldActive = false;
          this.createShieldBreakParticles(targetTank);
        } else {
          this.createExplosionParticles(targetTank.getCenterX(), targetTank.getCenterY());
          const winner: 1 | 2 = bullet.ownerId;
          this.endRound(winner);
          return;
        }
        bulletsToRemove.add(i);
        continue;
      }

      const targetBase = bullet.ownerId === 1 ? this.base2 : this.base1;
      if (circleCollision(
        bullet.x, bullet.y, bullet.radius,
        targetBase.getCenterX(), targetBase.getCenterY(), targetBase.getRadius()
      )) {
        this.createExplosionParticles(targetBase.getCenterX(), targetBase.getCenterY());
        const winner: 1 | 2 = bullet.ownerId;
        this.endRound(winner);
        return;
      }
    }

    this.bullets = this.bullets.filter((_, idx) => !bulletsToRemove.has(idx));

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      const tanks = [this.tank1, this.tank2];

      for (const tank of tanks) {
        if (circleCollision(
          pu.getCenterX(), pu.getCenterY(), pu.getRadius(),
          tank.getCenterX(), tank.getCenterY(), tank.getRadius()
        )) {
          this.collectPowerUp(pu, tank);
          this.powerUps.splice(i, 1);
          break;
        }
      }
    }

    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mine = this.mines[i];
      if (!mine.armed) continue;

      const targetTank = mine.ownerId === 1 ? this.tank2 : this.tank1;
      if (circleCollision(
        mine.x, mine.y, mine.radius,
        targetTank.getCenterX(), targetTank.getCenterY(), targetTank.getRadius()
      )) {
        this.explodeMine(mine, targetTank);
        this.mines.splice(i, 1);
      }
    }
  }

  private collectPowerUp(powerUp: PowerUp, tank: Tank): void {
    tank.triggerPickupAnimation();

    let text = '';
    let color = '#ffffff';

    switch (powerUp.type) {
      case 'shield':
        tank.activateShield(this.currentTime);
        text = '护盾!';
        color = '#ffd700';
        break;
      case 'speed':
        tank.activateSpeedBoost(this.currentTime);
        text = '加速!';
        color = '#00ffff';
        break;
      case 'rapidFire':
        tank.activateRapidFire(this.currentTime);
        text = '连发!';
        color = '#ff00ff';
        break;
      case 'mine':
        this.mines.push(new Mine(tank.getCenterX(), tank.getCenterY(), tank.playerId, this.currentTime));
        text = '地雷已放置!';
        color = '#ff6600';
        break;
    }

    this.pickupTexts.push(new PickupText(
      tank.getCenterX(),
      tank.y - 10,
      text,
      color
    ));
  }

  private explodeMine(mine: Mine, target: Tank): void {
    this.createExplosionParticles(mine.x, mine.y);

    const dx = target.getCenterX() - mine.x;
    const dy = target.getCenterY() - mine.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const pushForce = 40;

    const newX = target.x + (dx / dist) * pushForce;
    const newY = target.y + (dy / dist) * pushForce;
    target.x = Math.max(10, Math.min(MAP_WIDTH - target.width - 10, newX));
    target.y = Math.max(60, Math.min(MAP_HEIGHT - target.height - 10, newY));

    target.stun(this.currentTime);

    const otherTank = target.playerId === 1 ? this.tank2 : this.tank1;
    const odx = otherTank.getCenterX() - mine.x;
    const ody = otherTank.getCenterY() - mine.y;
    const odist = Math.sqrt(odx * odx + ody * ody);
    if (odist < EXPLOSION_RADIUS) {
      const opushForce = (1 - odist / EXPLOSION_RADIUS) * 30;
      otherTank.x = Math.max(10, Math.min(MAP_WIDTH - otherTank.width - 10,
        otherTank.x + (odx / (odist || 1)) * opushForce));
      otherTank.y = Math.max(60, Math.min(MAP_HEIGHT - otherTank.height - 10,
        otherTank.y + (ody / (odist || 1)) * opushForce));
    }
  }

  private createBrickParticles(brick: Brick): void {
    const colors = ['#cc3333', '#ff4444', '#aa2222', '#8b0000'];
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 2;
      this.particles.push(new Particle(
        brick.getCenterX(),
        brick.getCenterY(),
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        colors[i % colors.length],
        4 + Math.random() * 4,
        300
      ));
    }
  }

  private createExplosionParticles(x: number, y: number): void {
    const colors = ['#ff4400', '#ff8800', '#ffcc00', '#ffffff', '#ff0000'];
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 3 + Math.random() * 4;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        colors[i % colors.length],
        3 + Math.random() * 5,
        500 + Math.random() * 300
      ));
    }
  }

  private createShieldBreakParticles(tank: Tank): void {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 2;
      this.particles.push(new Particle(
        tank.getCenterX(),
        tank.getCenterY(),
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        '#ffd700',
        3 + Math.random() * 3,
        400
      ));
    }
  }

  private endRound(winner: 1 | 2): void {
    this.roundWinner = winner;
    if (winner === 1) {
      this.player1Score++;
    } else {
      this.player2Score++;
    }

    this.winnerFlash = winner;
    this.winnerFlashEndTime = this.currentTime + 1500;
    this.gameState = 'roundEnd';
    this.roundEndStartTime = this.currentTime;

    if (this.player1Score >= WIN_SCORE) {
      this.finalWinner = 1;
    } else if (this.player2Score >= WIN_SCORE) {
      this.finalWinner = 2;
    }
  }

  private updateRoundEnd(): void {
    if (this.currentTime > this.winnerFlashEndTime) {
      this.winnerFlash = null;
    }

    const elapsed = this.currentTime - this.roundEndStartTime;
    if (elapsed >= 2000) {
      if (this.finalWinner !== null) {
        this.gameState = 'victory';
        this.victoryStartTime = this.currentTime;
        this.lastFireworkTime = this.currentTime;
      } else {
        this.currentRound++;
        this.initRound();
        this.startCountdown();
      }
    }
  }

  private updateVictory(deltaTime: number): void {
    for (const particle of this.particles) {
      particle.update(deltaTime);
    }
    this.particles = this.particles.filter(p => p.life > 0);

    if (this.currentTime - this.lastFireworkTime > 200) {
      this.lastFireworkTime = this.currentTime;
      const winnerTank = this.finalWinner === 1 ? this.tank1 : this.tank2;
      this.spawnFirework(winnerTank.getCenterX(), winnerTank.getCenterY());
    }

    if (this.input.isSpacePressed()) {
      this.resetMatch();
      this.startCountdown();
    }
  }

  private spawnFirework(x: number, y: number): void {
    const colors = ['#ff0000', '#00ff00', '#00aaff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15 + Math.random() * 0.3;
      const speed = 3 + Math.random() * 4;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 1,
        colors[Math.floor(Math.random() * colors.length)],
        4 + Math.random() * 4,
        600 + Math.random() * 400
      ));
    }
  }

  private render(): void {
    this.renderer.clear();

    if (this.gameState === 'menu') {
      this.renderer.drawStars(this.stars);
      this.renderer.drawMenu(this.currentTime);
      return;
    }

    this.renderer.drawBorder();

    if (this.gameState !== 'victory') {
      for (const brick of this.bricks) {
        this.renderer.drawBrick(brick);
      }

      for (const powerUp of this.powerUps) {
        this.renderer.drawPowerUp(powerUp, this.currentTime);
      }

      for (const mine of this.mines) {
        this.renderer.drawMine(mine, this.currentTime);
      }

      this.renderer.drawBase(this.base1, this.currentTime);
      this.renderer.drawBase(this.base2, this.currentTime);

      this.renderer.drawTank(this.tank1, this.currentTime);
      this.renderer.drawTank(this.tank2, this.currentTime);

      for (const bullet of this.bullets) {
        this.renderer.drawBullet(bullet);
      }

      for (const particle of this.particles) {
        this.renderer.drawParticle(particle);
      }

      for (const text of this.pickupTexts) {
        this.renderer.drawPickupText(text);
      }
    }

    this.renderer.drawScoreboard(
      this.player1Score,
      this.player2Score,
      this.currentRound,
      this.winnerFlash,
      this.currentTime
    );

    if (this.gameState === 'countdown') {
      const elapsed = this.currentTime - this.countdownStartTime;
      const progress = (elapsed % 1000) / 1000;
      this.renderer.drawCountdown(Math.max(1, this.countdownNumber), progress);
    } else if (this.gameState === 'roundEnd' && this.roundWinner !== null) {
      this.renderer.drawRoundEnd(this.roundWinner);
    } else if (this.gameState === 'victory' && this.finalWinner !== null) {
      const elapsed = this.currentTime - this.victoryStartTime;
      const textProgress = Math.min(1, elapsed / 800);

      for (const particle of this.particles) {
        this.renderer.drawParticle(particle);
      }

      if (this.finalWinner !== null) {
        const winnerTank = this.finalWinner === 1 ? this.tank1 : this.tank2;
        this.renderer.drawVictoryTank(winnerTank, this.currentTime);
      }

      this.renderer.drawVictoryScreen(this.finalWinner, this.currentTime, textProgress);
    }
  }
}

window.addEventListener('load', () => {
  const game = new Game();
  game.start();
});
