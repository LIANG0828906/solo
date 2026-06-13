import { Player, Particle } from './Player';
import { Enemy } from './Enemy';
import { Bullet } from './Bullet';
import { Renderer } from './Renderer';
import { Spawner, PowerUp } from './Spawner';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let player: Player;
let enemies: Enemy[];
let bullets: Bullet[];
let particles: Particle[];
let powerUps: PowerUp[];
let spawner: Spawner;
let renderer: Renderer;

let score: number;
let gameOver: boolean;
let gameOverStartTime: number;
let gameTime: number;
let lastTime: number;

const keys = new Set<string>();

function resize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (renderer) renderer.resize(canvas.width, canvas.height);
}

function init(): void {
  resize();
  player = new Player(canvas.width, canvas.height);
  enemies = [];
  bullets = [];
  particles = [];
  powerUps = [];
  spawner = new Spawner();
  renderer = new Renderer(ctx, canvas.width, canvas.height);
  score = 0;
  gameOver = false;
  gameOverStartTime = 0;
  gameTime = 0;
  lastTime = performance.now();
}

function circleCollision(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number,
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy < (r1 + r2) * (r1 + r2);
}

function createExplosion(x: number, y: number, color: string, count: number): void {
  if (particles.length > 470) return;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const speed = 80 + Math.random() * 160;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.4,
      maxLife: 0.8,
      color,
      size: 2 + Math.random() * 4,
    });
  }
}

function update(dt: number): void {
  if (gameOver) return;

  gameTime += dt;

  player.update(dt, keys, canvas.width, canvas.height);

  if (keys.has(' ') && player.canShoot()) {
    player.shoot();
    bullets.push(new Bullet(player.x, player.y - player.height / 2, player.powerUpActive));
  }

  spawner.update(dt, enemies, powerUps, canvas.width);

  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update(dt);
    if (enemies[i].isOffScreen(canvas.height)) {
      enemies.splice(i, 1);
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update(dt);
    if (bullets[i].isOffScreen()) {
      bullets.splice(i, 1);
    }
  }

  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].update(dt);
    if (powerUps[i].isOffScreen(canvas.height)) {
      powerUps.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  if (particles.length > 500) {
    particles.splice(0, particles.length - 500);
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (!b) continue;
    let bulletConsumed = false;

    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (!e) continue;

      if (circleCollision(b.x, b.y, b.getRadius(), e.x, e.y, e.getRadius())) {
        const killed = e.hit(1);
        if (!b.piercing) {
          bulletConsumed = true;
        }

        if (killed) {
          score += e.score;
          createExplosion(e.x, e.y, e.color, 10 + Math.floor(Math.random() * 6));

          const splashRadius = 65;
          const toRemove: number[] = [];
          for (let k = 0; k < enemies.length; k++) {
            if (k === j || !enemies[k]) continue;
            const other = enemies[k];
            const dx = other.x - e.x;
            const dy = other.y - e.y;
            if (Math.sqrt(dx * dx + dy * dy) < splashRadius + other.size) {
              const splashKilled = other.hit(0.5);
              if (splashKilled) {
                score += other.score;
                createExplosion(other.x, other.y, other.color, 10);
                toRemove.push(k);
              }
            }
          }

          toRemove.sort((a, b2) => b2 - a);
          for (const idx of toRemove) {
            enemies.splice(idx, 1);
          }

          enemies.splice(j, 1);
        }

        if (bulletConsumed) {
          bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (circleCollision(player.x, player.y, player.getRadius(), e.x, e.y, e.getRadius())) {
      player.hit();
      createExplosion(e.x, e.y, e.color, 12);
      enemies.splice(i, 1);

      if (player.lives <= 0) {
        gameOver = true;
        gameOverStartTime = gameTime;
      }
    }
  }

  for (let i = powerUps.length - 1; i >= 0; i--) {
    const pu = powerUps[i];
    if (circleCollision(player.x, player.y, player.getRadius(), pu.x, pu.y, pu.getRadius())) {
      player.activatePowerUp();
      powerUps.splice(i, 1);
    }
  }
}

function render(dt: number): void {
  renderer.clear();
  renderer.drawStars(gameTime, dt);
  renderer.drawParticles(particles);
  renderer.drawPowerUps(powerUps, gameTime);
  renderer.drawBullets(bullets);
  renderer.drawEnemies(enemies);
  renderer.drawPlayer(player, gameTime);
  renderer.drawHUD(score, player.lives, gameTime, player.powerUpActive);

  if (gameOver) {
    renderer.drawGameOver(score, gameTime - gameOverStartTime);
  }
}

function gameLoop(timestamp: number): void {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(dt);
  render(dt);

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e: KeyboardEvent) => {
  keys.add(e.key);
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e: KeyboardEvent) => {
  keys.delete(e.key);
});

window.addEventListener('resize', resize);

canvas.addEventListener('click', (e: MouseEvent) => {
  if (!gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const btn = renderer.getRestartButtonBounds();
  if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
    init();
  }
});

init();
requestAnimationFrame(gameLoop);
