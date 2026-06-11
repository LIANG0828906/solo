import { Player, Particle, GameConfig } from './entities';
import { BulletManager, AsteroidManager } from './managers';

const CONFIG: GameConfig = {
  canvasWidth: 800,
  canvasHeight: 600
};

const DIFFICULTY_INTERVAL = 30000;
const MAX_DIFFICULTY_LEVEL = 5;

enum GameState {
  PLAYING,
  GAME_OVER
}

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const overlay = document.getElementById('gameOverOverlay') as HTMLDivElement;
const finalScoreEl = document.getElementById('finalScore') as HTMLDivElement;
const restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;

const player = new Player();
const bulletManager = new BulletManager();
const asteroidManager = new AsteroidManager();

let gameState: GameState = GameState.PLAYING;
let score: number = 0;
let lastTime: number = 0;
let gameTime: number = 0;
let lastDifficultyTime: number = 0;
let lastShootTime: number = 0;
const SHOOT_COOLDOWN = 150;

let particles: Particle[] = [];
const MAX_PARTICLES = 100;

let mouseX: number = CONFIG.canvasWidth * 0.3;
let mouseY: number = CONFIG.canvasHeight * 0.5;
let spacePressed: boolean = false;
let isPointerLocked: boolean = false;

function init(): void {
  setupEventListeners();
  resetGame();
  requestAnimationFrame(gameLoop);
}

function setupEventListeners(): void {
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  restartBtn.addEventListener('click', handleRestart);
  canvas.addEventListener('mouseenter', () => {
    isPointerLocked = true;
  });
  canvas.addEventListener('mouseleave', () => {
    isPointerLocked = false;
  });
}

function handleMouseMove(e: MouseEvent): void {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  mouseX = (e.clientX - rect.left) * scaleX;
  mouseY = (e.clientY - rect.top) * scaleY;
}

function handleClick(): void {
  if (gameState === GameState.PLAYING) {
    shoot();
  }
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.code === 'Space') {
    e.preventDefault();
    spacePressed = true;
    if (gameState === GameState.PLAYING) {
      shoot();
    }
  }
}

function handleKeyUp(e: KeyboardEvent): void {
  if (e.code === 'Space') {
    spacePressed = false;
  }
}

function handleRestart(): void {
  overlay.classList.remove('active');
  resetGame();
  gameState = GameState.PLAYING;
}

function shoot(): void {
  const now = Date.now();
  if (now - lastShootTime < SHOOT_COOLDOWN) return;
  lastShootTime = now;
  bulletManager.fire(player.x + player.width / 2, player.y);
}

function resetGame(): void {
  player.reset();
  bulletManager.reset();
  asteroidManager.reset();
  score = 0;
  gameTime = 0;
  lastDifficultyTime = 0;
  particles = [];
  mouseX = CONFIG.canvasWidth * 0.3;
  mouseY = CONFIG.canvasHeight * 0.5;
}

function addScore(points: number): void {
  score += points;
}

function spawnGlowParticle(): void {
  if (particles.length >= MAX_PARTICLES) return;

  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const colorValue = Math.random();
    const color = colorValue > 0.5 ? '#FFFFFF' : '#87CEEB';

    particles.push({
      x: Math.random() * CONFIG.canvasWidth,
      y: -5,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.5 + Math.random() * 1,
      life: 0,
      maxLife: 180 + Math.random() * 120,
      size: 1 + Math.random() * 2,
      color
    });
  }
}

function updateParticles(): void {
  spawnGlowParticle();

  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life++;
    return p.life < p.maxLife && p.y < CONFIG.canvasHeight + 10;
  });
}

function renderParticles(ctx: CanvasRenderingContext2D): void {
  particles.forEach(p => {
    const alpha = 1 - (p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function renderBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createRadialGradient(
    CONFIG.canvasWidth / 2,
    CONFIG.canvasHeight / 2,
    0,
    CONFIG.canvasWidth / 2,
    CONFIG.canvasHeight / 2,
    CONFIG.canvasWidth * 0.7
  );
  gradient.addColorStop(0, '#0B0D2E');
  gradient.addColorStop(1, '#000000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < 50; i++) {
    const x = (i * 137.5) % CONFIG.canvasWidth;
    const y = (i * 89.3) % CONFIG.canvasHeight;
    const size = (i % 3) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderHUD(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.font = "bold 16px 'Orbitron', sans-serif";

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(15, 15, 200, 100, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 191, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#00BFFF';
  ctx.fillText('得分', 30, 42);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 22px 'Orbitron', sans-serif";
  ctx.fillText(score.toString(), 90, 44);

  ctx.font = "bold 14px 'Orbitron', sans-serif";
  ctx.fillStyle = '#00BFFF';
  ctx.fillText('连击', 30, 70);
  ctx.fillStyle = '#FFD700';
  const comboCount = asteroidManager.getComboCount();
  if (comboCount > 0) {
    ctx.fillText(`${comboCount}x`, 85, 70);
  } else {
    ctx.fillStyle = '#666';
    ctx.fillText('--', 85, 70);
  }

  ctx.fillStyle = '#00BFFF';
  ctx.fillText('难度', 30, 95);
  ctx.fillStyle = '#FF6347';
  ctx.fillText(`Lv.${asteroidManager.difficultyLevel}`, 90, 95);

  ctx.fillStyle = '#00BFFF';
  ctx.fillText('生命', 130, 70);
  for (let i = 0; i < 3; i++) {
    drawStar(ctx, 200 + i * 25, 65, i < player.lives);
  }

  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, filled: boolean): void {
  const spikes = 5;
  const outerRadius = 8 * 0.8;
  const innerRadius = 4 * 0.8;

  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();

  if (filled) {
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 5;
    ctx.fill();
  } else {
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function renderMinimap(ctx: CanvasRenderingContext2D): void {
  const mapWidth = 150;
  const mapHeight = 100;
  const mapX = CONFIG.canvasWidth - mapWidth - 15;
  const mapY = 15;
  const scaleX = mapWidth / CONFIG.canvasWidth;
  const scaleY = mapHeight / CONFIG.canvasHeight;

  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(mapX, mapY, mapWidth, mapHeight, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 191, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const activeAsteroids = asteroidManager.getActiveAsteroids();
  ctx.fillStyle = '#FFFFFF';
  activeAsteroids.forEach(asteroid => {
    const px = mapX + asteroid.x * scaleX;
    const py = mapY + asteroid.y * scaleY;
    const size = asteroid.size === 2 ? 1 : asteroid.size === 1 ? 2 : 3;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#00FF00';
  ctx.shadowColor = '#00FF00';
  ctx.shadowBlur = 4;
  const playerMapX = mapX + player.x * scaleX;
  const playerMapY = mapY + player.y * scaleY;
  ctx.beginPath();
  ctx.arc(playerMapX, playerMapY, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderGameOver(): void {
  overlay.classList.add('active');
  finalScoreEl.innerHTML = '';

  const scoreStr = score.toString();
  scoreStr.split('').forEach((digit, index) => {
    const span = document.createElement('span');
    span.className = 'score-digit';
    span.textContent = digit;
    span.style.animationDelay = `${index * 0.1}s`;
    finalScoreEl.appendChild(span);
  });
}

function updateDifficulty(_deltaTime: number): void {
  if (asteroidManager.difficultyLevel < MAX_DIFFICULTY_LEVEL) {
    if (gameTime - lastDifficultyTime >= DIFFICULTY_INTERVAL) {
      asteroidManager.increaseDifficulty();
      lastDifficultyTime = gameTime;
    }
  }
}

function gameLoop(currentTime: number): void {
  const deltaTime = lastTime ? currentTime - lastTime : 16;
  lastTime = currentTime;

  if (gameState === GameState.PLAYING) {
    gameTime += deltaTime;

    player.setTarget(mouseX, mouseY);
    player.update(deltaTime);

    if (spacePressed) {
      shoot();
    }

    bulletManager.update();
    asteroidManager.update();
    updateParticles();

    asteroidManager.checkBulletCollisions(bulletManager.getActiveBullets(), addScore);

    const alive = asteroidManager.checkPlayerCollision(player);
    if (!alive) {
      gameState = GameState.GAME_OVER;
      renderGameOver();
    }

    updateDifficulty(deltaTime);
  }

  ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

  renderBackground(ctx);
  renderParticles(ctx);

  asteroidManager.render(ctx);
  bulletManager.render(ctx);
  player.render(ctx);

  renderHUD(ctx);
  renderMinimap(ctx);

  if (isPointerLocked && gameState === GameState.PLAYING) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 191, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mouseX - 15, mouseY);
    ctx.lineTo(mouseX - 5, mouseY);
    ctx.moveTo(mouseX + 5, mouseY);
    ctx.lineTo(mouseX + 15, mouseY);
    ctx.moveTo(mouseX, mouseY - 15);
    ctx.lineTo(mouseX, mouseY - 5);
    ctx.moveTo(mouseX, mouseY + 5);
    ctx.lineTo(mouseX, mouseY + 15);
    ctx.stroke();
    ctx.restore();
  }

  requestAnimationFrame(gameLoop);
}

if (!ctx.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x: number, y: number, w: number, h: number, r: number
  ) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

init();
