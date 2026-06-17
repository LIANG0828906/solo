import {
  generateLevel,
  LevelData,
  GRID_SIZE,
  TILE_SIZE,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  TileType,
  gridToPixel,
} from './levelGenerator';
import { PlayerState, createPlayer, updatePlayer, getPlayerRenderPos, handleMovementInput } from './player';
import { Guard, createGuards, updateGuard, getGuardRenderPos, areAdjacent, stunGuard, isInVisionCone } from './guard';

type GameState = 'start' | 'playing' | 'win' | 'lose';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface StunMinigame {
  active: boolean;
  targetGuard: Guard | null;
  progress: number;
  clicks: number;
  requiredClicks: number;
  duration: number;
  timeLeft: number;
}

const CANVAS_W = 800;
const CANVAS_H = 600;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

let gameState: GameState = 'start';
let currentFloor = 1;
let keys = new Set<string>();
let lastTime = 0;
let alertLevel = { value: 0 };
let alertBlinkTimer = 0;
let particles: Particle[] = [];
let treasureLastBlinkState = false;

let level: LevelData;
let player: PlayerState;
let guards: Guard[] = [];
let stunMinigame: StunMinigame = {
  active: false,
  targetGuard: null,
  progress: 0,
  clicks: 0,
  requiredClicks: 3,
  duration: 1.5,
  timeLeft: 1.5,
};

let retryButtonRect = { x: 350, y: 350, w: 100, h: 40 };

function init(): void {
  canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Cannot get 2d context');
  ctx = c;

  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') e.preventDefault();
    keys.add(e.key);

    if (gameState === 'playing') {
      if (e.key === ' ' && !e.repeat) {
        handleSpacePress();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.key);
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (gameState === 'lose') {
      if (
        mx >= retryButtonRect.x &&
        mx <= retryButtonRect.x + retryButtonRect.w &&
        my >= retryButtonRect.y &&
        my <= retryButtonRect.y + retryButtonRect.h
      ) {
        startNewGame();
      }
    } else if (gameState === 'start' || gameState === 'win') {
      startNewGame();
    }
  });

  requestAnimationFrame(gameLoop);
}

function handleSpacePress(): void {
  if (stunMinigame.active) {
    stunMinigame.clicks++;
    stunMinigame.progress = stunMinigame.clicks / stunMinigame.requiredClicks;
    if (stunMinigame.clicks >= stunMinigame.requiredClicks) {
      if (stunMinigame.targetGuard) {
        stunGuard(stunMinigame.targetGuard);
      }
      stunMinigame.active = false;
      stunMinigame.targetGuard = null;
    }
    return;
  }

  for (const guard of guards) {
    if (guard.state !== 'stunned' && areAdjacent(player.x, player.y, guard.x, guard.y)) {
      const playerSeen = isInVisionCone(guard, player.x, player.y, level, player.isSneaking);
      if (!playerSeen) {
        stunMinigame.active = true;
        stunMinigame.targetGuard = guard;
        stunMinigame.progress = 0;
        stunMinigame.clicks = 0;
        stunMinigame.timeLeft = stunMinigame.duration;
        break;
      }
    }
  }
}

function startNewGame(): void {
  currentFloor = 1;
  initFloor();
  gameState = 'playing';
}

function initFloor(): void {
  level = generateLevel(currentFloor);
  player = createPlayer(level);
  guards = createGuards(level);
  alertLevel.value = 0;
  alertBlinkTimer = 0;
  particles = [];
  stunMinigame.active = false;
  stunMinigame.targetGuard = null;
  treasureLastBlinkState = false;
}

function gameLoop(timestamp: number): void {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

function update(dt: number): void {
  if (gameState !== 'playing') return;

  if (stunMinigame.active) {
    stunMinigame.timeLeft -= dt;
    if (stunMinigame.timeLeft <= 0) {
      stunMinigame.active = false;
      stunMinigame.targetGuard = null;
    }
  }

  handleMovementInput(player, keys, level, dt);
  updatePlayer(player, dt, keys);

  for (const guard of guards) {
    updateGuard(guard, dt, player, level, alertLevel);
  }

  if (!level.treasure.collected && player.x === level.treasure.x && player.y === level.treasure.y) {
    level.treasure.collected = true;
    player.score += 100;
  }

  level.treasure.blinkTimer += dt;
  const blinkOn = Math.floor(level.treasure.blinkTimer / 0.2) % 2 === 0;
  if (blinkOn && !treasureLastBlinkState && !level.treasure.collected) {
    spawnTreasureParticles();
  }
  treasureLastBlinkState = blinkOn;

  if (!level.treasure.collected && player.x === level.exit.x && player.y === level.exit.y) {
  } else if (level.treasure.collected && player.x === level.exit.x && player.y === level.exit.y) {
    gameState = 'win';
  }

  alertBlinkTimer += dt;

  for (const guard of guards) {
    if (guard.state !== 'stunned' && player.x === guard.x && player.y === guard.y) {
      gameState = 'lose';
      return;
    }
  }

  if (alertLevel.value >= 5) {
    gameState = 'lose';
    return;
  }

  updateParticles(dt);
}

function spawnTreasureParticles(): void {
  const pos = gridToPixel(level.treasure.x, level.treasure.y);
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 40;
    particles.push({
      x: pos.px,
      y: pos.py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5,
      maxLife: 0.5,
      color: '#FFFFFF',
      size: 2 + Math.random() * 2,
    });
  }
}

function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function render(): void {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (gameState === 'start') {
    renderStartScreen();
    return;
  }

  renderLevel();
  renderGlows();
  renderTreasure();
  renderExit();
  renderGuards();
  renderGuardVision();
  renderPlayer();
  renderParticles();
  renderGridLines();
  renderUI();
  renderStunMinigame();
  renderAlertEffect();

  if (gameState === 'win') {
    renderWinScreen();
  } else if (gameState === 'lose') {
    renderLoseScreen();
  }
}

function renderStartScreen(): void {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('像素小偷', CANVAS_W / 2, 200);

  ctx.font = '18px monospace';
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText('方向键/WASD 移动  |  空格 潜行/开锁', CANVAS_W / 2, 280);
  ctx.fillText('偷取宝物后从出口逃脱', CANVAS_W / 2, 310);
  ctx.fillText('避免被守卫发现', CANVAS_W / 2, 340);

  ctx.fillStyle = '#4A9EFF';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('点击任意位置开始游戏', CANVAS_W / 2, 420);
  ctx.textAlign = 'left';
}

function renderLevel(): void {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile: TileType = level.grid[y][x];
      const px = GRID_OFFSET_X + x * TILE_SIZE;
      const py = GRID_OFFSET_Y + y * TILE_SIZE;

      switch (tile) {
        case 'wall':
          ctx.fillStyle = '#2D2D44';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          break;
        case 'room':
          ctx.fillStyle = '#4A4A6A';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          break;
        case 'corridor':
          ctx.fillStyle = '#3A3A5A';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          break;
        case 'door':
          ctx.fillStyle = '#8B5E3C';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          break;
      }
    }
  }
}

function renderGridLines(): void {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= GRID_SIZE; x++) {
    ctx.beginPath();
    ctx.moveTo(GRID_OFFSET_X + x * TILE_SIZE, GRID_OFFSET_Y);
    ctx.lineTo(GRID_OFFSET_X + x * TILE_SIZE, GRID_OFFSET_Y + GRID_SIZE * TILE_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID_SIZE; y++) {
    ctx.beginPath();
    ctx.moveTo(GRID_OFFSET_X, GRID_OFFSET_Y + y * TILE_SIZE);
    ctx.lineTo(GRID_OFFSET_X + GRID_SIZE * TILE_SIZE, GRID_OFFSET_Y + y * TILE_SIZE);
    ctx.stroke();
  }
}

function renderGlows(): void {
  const playerPos = getPlayerRenderPos(player);
  const g = ctx.createRadialGradient(playerPos.px, playerPos.py, 0, playerPos.px, playerPos.py, TILE_SIZE * 2);
  g.addColorStop(0, 'rgba(255, 255, 180, 0.3)');
  g.addColorStop(1, 'rgba(255, 255, 180, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(GRID_OFFSET_X, GRID_OFFSET_Y, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);

  for (const guard of guards) {
    if (guard.state === 'stunned') continue;
    const gPos = getGuardRenderPos(guard);
    const gg = ctx.createRadialGradient(gPos.px, gPos.py, 0, gPos.px, gPos.py, TILE_SIZE * 3);
    gg.addColorStop(0, 'rgba(255, 80, 80, 0.2)');
    gg.addColorStop(1, 'rgba(255, 80, 80, 0)');
    ctx.fillStyle = gg;
    ctx.fillRect(GRID_OFFSET_X, GRID_OFFSET_Y, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);
  }
}

function renderTreasure(): void {
  if (level.treasure.collected) return;
  const pos = gridToPixel(level.treasure.x, level.treasure.y);
  const blinkOn = Math.floor(level.treasure.blinkTimer / 0.2) % 2 === 0;
  if (blinkOn) {
    ctx.fillStyle = '#FFD700';
  } else {
    ctx.fillStyle = '#B8860B';
  }
  ctx.fillRect(pos.px - 8, pos.py - 8, 16, 16);
  ctx.strokeStyle = '#FFFF00';
  ctx.lineWidth = 1;
  ctx.strokeRect(pos.px - 8, pos.py - 8, 16, 16);
}

function renderExit(): void {
  const pos = gridToPixel(level.exit.x, level.exit.y);
  ctx.fillStyle = level.treasure.collected ? '#00FF00' : '#00AA00';
  ctx.beginPath();
  ctx.moveTo(pos.px + 8, pos.py);
  ctx.lineTo(pos.px - 4, pos.py - 7);
  ctx.lineTo(pos.px - 4, pos.py + 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#00FF88';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function renderPlayer(): void {
  const pos = getPlayerRenderPos(player);
  ctx.fillStyle = player.isSneaking ? '#666666' : '#AAAAAA';
  ctx.fillRect(pos.px - 10, pos.py - 10, 20, 20);
  ctx.fillStyle = '#000000';
  ctx.fillRect(pos.px - 6, pos.py - 4, 4, 4);
  ctx.fillRect(pos.px + 2, pos.py - 4, 4, 4);
  ctx.fillStyle = '#333333';
  ctx.fillRect(pos.px - 8, pos.py + 4, 16, 3);
}

function renderGuards(): void {
  for (const guard of guards) {
    const pos = getGuardRenderPos(guard);

    if (guard.state === 'stunned') {
      ctx.fillStyle = '#555555';
    } else if (guard.state === 'chase') {
      ctx.fillStyle = '#FF3333';
    } else {
      ctx.fillStyle = '#0066FF';
    }

    ctx.fillRect(pos.px - 10, pos.py - 10, 20, 20);

    if (guard.state !== 'stunned') {
      ctx.fillStyle = '#FFFFFF';
      let ex = 0, ey = 0;
      switch (guard.facing) {
        case 0: ey = -3; break;
        case 1: ex = 3; break;
        case 2: ey = 3; break;
        case 3: ex = -3; break;
      }
      ctx.fillRect(pos.px - 4 + ex, pos.py - 4 + ey, 3, 3);
      ctx.fillRect(pos.px + 1 + ex, pos.py - 4 + ey, 3, 3);
    } else {
      ctx.fillStyle = '#FFFF00';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★', pos.px, pos.py + 5);
      ctx.textAlign = 'left';
    }
  }
}

function renderGuardVision(): void {
  for (const guard of guards) {
    if (guard.state === 'stunned') continue;

    const pos = getGuardRenderPos(guard);
    const radius = (player.isSneaking ? 2 : 4) * TILE_SIZE;
    let angle = 0;
    switch (guard.facing) {
      case 0: angle = -Math.PI / 2; break;
      case 1: angle = 0; break;
      case 2: angle = Math.PI / 2; break;
      case 3: angle = Math.PI; break;
    }

    const halfCone = Math.PI / 4;
    ctx.fillStyle = guard.state === 'chase' ? 'rgba(255, 50, 50, 0.15)' : 'rgba(255, 200, 100, 0.1)';
    ctx.beginPath();
    ctx.moveTo(pos.px, pos.py);
    ctx.arc(pos.px, pos.py, radius, angle - halfCone, angle + halfCone);
    ctx.closePath();
    ctx.fill();
  }
}

function renderParticles(): void {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
}

function renderUI(): void {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`得分: ${player.score}`, 20, 30);
  ctx.fillText(`楼层: ${currentFloor}`, 20, 55);

  if (alertLevel.value > 0) {
    ctx.fillStyle = '#FF6666';
    ctx.fillText(`警戒: ${Math.ceil(alertLevel.value)}/5`, 20, 80);
  }

  if (level.treasure.collected) {
    ctx.fillStyle = '#00FF88';
    ctx.fillText('已获取宝物，前往出口！', 20, 105);
  }
  ctx.textAlign = 'left';
}

function renderAlertEffect(): void {
  if (alertLevel.value < 0.5) return;
  const blinkOn = Math.floor(alertBlinkTimer / 0.1) % 2 === 0;
  if (!blinkOn) return;

  const intensity = Math.min(1, alertLevel.value / 5);
  const borderWidth = 10 + intensity * 10;
  ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 * intensity})`;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(0, 0, CANVAS_W, CANVAS_H);
}

function renderStunMinigame(): void {
  if (!stunMinigame.active) return;

  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2 - 50;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(cx - 150, cy - 60, 300, 120);

  ctx.strokeStyle = '#FFDD00';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 150, cy - 60, 300, 120);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('开锁中！快速按空格3次', cx, cy - 25);

  const barW = 200;
  const barH = 16;
  ctx.fillStyle = '#333333';
  ctx.fillRect(cx - barW / 2, cy, barW, barH);
  ctx.fillStyle = '#FFDD00';
  ctx.fillRect(cx - barW / 2, cy, barW * stunMinigame.progress, barH);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - barW / 2, cy, barW, barH);

  const timeRatio = stunMinigame.timeLeft / stunMinigame.duration;
  ctx.fillStyle = timeRatio > 0.3 ? '#88FF88' : '#FF6666';
  ctx.fillText(`时间: ${stunMinigame.timeLeft.toFixed(1)}s  次数: ${stunMinigame.clicks}/${stunMinigame.requiredClicks}`, cx, cy + 35);
  ctx.textAlign = 'left';
}

function renderWinScreen(): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#00FF88';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('任务成功！', CANVAS_W / 2, 250);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px monospace';
  ctx.fillText(`最终得分: ${player.score}`, CANVAS_W / 2, 310);

  ctx.fillStyle = '#4A9EFF';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('点击任意位置再玩一次', CANVAS_W / 2, 380);
  ctx.textAlign = 'left';
}

function renderLoseScreen(): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('任务失败', CANVAS_W / 2, 280);

  ctx.fillStyle = '#AAAAAA';
  ctx.font = '20px monospace';
  ctx.fillText(`得分: ${player.score}`, CANVAS_W / 2, 320);

  retryButtonRect = { x: CANVAS_W / 2 - 50, y: 350, w: 100, h: 40 };
  ctx.fillStyle = '#4A9EFF';
  ctx.fillRect(retryButtonRect.x, retryButtonRect.y, retryButtonRect.w, retryButtonRect.h);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('重新开始', CANVAS_W / 2, retryButtonRect.y + 27);
  ctx.textAlign = 'left';
}

init();
