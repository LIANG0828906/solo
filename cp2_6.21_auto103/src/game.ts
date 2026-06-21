import { Player, PlayerState } from './player';
import { ObstaclePool } from './obstacle';
import { Renderer } from './renderer';

enum GameScene {
  Playing = 'playing',
  GameOver = 'gameOver'
}

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private player: Player;
  private pool: ObstaclePool;
  private scene: GameScene = GameScene.Playing;
  private cameraX: number = 0;
  private highScore: number = 0;
  private gameOverAnimTimer: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedDt: number = 1000 / 60;
  private keys: Set<string> = new Set();
  private running: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.player = new Player();
    this.pool = new ObstaclePool();

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    canvas.addEventListener('click', (e) => this.handleClick(e));

    this.startGame();
  }

  private handleResize(): void {
    this.renderer.resize(window.innerWidth, window.innerHeight);
  }

  private startGame(): void {
    this.cameraX = 0;
    this.scene = GameScene.Playing;
    this.gameOverAnimTimer = 0;
    const groundY = this.canvas.height - 120;
    this.player.reset(groundY);
    this.pool.reset(this.canvas.width, this.canvas.height);
  }

  private handleClick(e: MouseEvent): void {
    if (this.scene === GameScene.GameOver) {
      const btn = this.renderer.getRestartBtn();
      if (btn) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
          this.startGame();
        }
      }
    }
  }

  start(): void {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop(timestamp: number): void {
    if (!this.running) return;

    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.accumulator += Math.min(delta, 100);

    while (this.accumulator >= this.fixedDt) {
      this.update();
      this.accumulator -= this.fixedDt;
    }

    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }

  private update(): void {
    if (this.scene === GameScene.GameOver) {
      this.gameOverAnimTimer += 1 / 30;
      return;
    }

    if (this.keys.has('Space')) {
      this.player.jump();
      this.keys.delete('Space');
    }
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) {
      this.player.slide();
      this.keys.delete('ShiftLeft');
      this.keys.delete('ShiftRight');
    }
    if (this.keys.has('KeyE')) {
      this.player.flip();
      this.keys.delete('KeyE');
    }

    const scrollSpeed = this.player.speed;
    this.cameraX += scrollSpeed;

    const groundY = this.pool.getGroundYAt(this.player.x + this.player.width / 2, this.canvas.height);

    if (groundY !== null) {
      this.player.grounded = true;
      this.player.update(groundY);
    } else {
      this.player.grounded = false;
      this.player.update(this.canvas.height + 200);
    }

    this.pool.update(scrollSpeed, this.canvas.width, this.canvas.height, this.cameraX);

    this.checkCollisions();

    if (this.renderer.getParticleCount() > 150) {
      this.renderer.trimParticles(100);
    }
  }

  private checkCollisions(): void {
    const hit = this.player.hitbox;
    const obstacles = this.pool.getActiveObstacles();
    const collectibles = this.pool.getActiveCollectibles();

    for (const obs of obstacles) {
      if (this.aabb(hit.x, hit.y, hit.w, hit.h, obs.x, obs.y, obs.width, obs.height)) {
        const isSmall = obs.type === 'crate' || obs.type === 'plant';
        if (this.player.state === PlayerState.Boosting && isSmall) {
          this.renderer.addParticle(obs.x + obs.width / 2, obs.y + obs.height / 2, '#00f0ff', 6);
          obs.active = false;
          continue;
        }

        if (obs.type === 'vent' && this.player.state === PlayerState.Sliding) {
          continue;
        }

        if (this.player.takeDamage()) {
          this.renderer.flashScreen('red');
          this.renderer.addParticle(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#e74c3c', 8);

          if (this.player.health <= 0) {
            this.scene = GameScene.GameOver;
            this.gameOverAnimTimer = 0;
            if (this.player.score > this.highScore) {
              this.highScore = this.player.score;
            }
          }
        }
      }
    }

    for (const col of collectibles) {
      if (col.collected) continue;
      const colHit = { x: col.x - col.size, y: col.y - col.size, w: col.size * 2, h: col.size * 2 };
      if (this.aabb(hit.x, hit.y, hit.w, hit.h, colHit.x, colHit.y, colHit.w, colHit.h)) {
        col.collected = true;

        if (col.type === 'energy') {
          this.player.score += 100;
          this.renderer.addParticle(col.x, col.y, '#f1c40f', 6);
        } else {
          this.player.activateBoost();
          this.renderer.addParticle(col.x, col.y, '#e74c3c', 8);
        }
      }
    }
  }

  private aabb(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  private draw(): void {
    this.renderer.clear();
    this.renderer.drawBuildings(this.pool.getBuildings(), this.cameraX);
    this.renderer.drawObstacles(this.pool.getActiveObstacles(), this.cameraX);
    this.renderer.drawCollectibles(this.pool.getActiveCollectibles(), this.cameraX);
    this.player.draw(this.canvas.getContext('2d')!, this.cameraX);
    this.renderer.updateAndDrawParticles();
    this.renderer.drawScreenEffects();
    this.renderer.drawUI(this.player.score, this.player.health, this.highScore);

    if (this.scene === GameScene.GameOver) {
      this.renderer.drawGameOver(this.player.score, this.highScore, this.gameOverAnimTimer, () => this.startGame());
    }
  }
}

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);
game.start();
