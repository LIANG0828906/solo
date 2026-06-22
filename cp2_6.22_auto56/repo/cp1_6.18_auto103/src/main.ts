import { Ship, Laser } from './ship';
import { Particle, createExplosion } from './particle';
import { GameState, Star, createInitialState } from './gameState';
import { distance, random, clamp } from './utils';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let state: GameState;
let lastTime = 0;
let canvasWidth = 0;
let canvasHeight = 0;
let scale = 1;
let gameOverPanel: HTMLDivElement | null = null;
let restartButton: HTMLButtonElement | null = null;
let resultText: HTMLHeadingElement | null = null;
let timeText: HTMLParagraphElement | null = null;

function resizeCanvas(): void {
  const dpr = window.devicePixelRatio || 1;
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';
  ctx.scale(dpr, dpr);

  scale = canvasWidth < 480 ? 0.7 : 1;
}

function initGame(): void {
  resizeCanvas();
  state = createInitialState(canvasWidth, canvasHeight, scale);
  state.isFadingIn = true;
  state.fadeAlpha = 1;
  createUI();
}

function createUI(): void {
  if (gameOverPanel) {
    gameOverPanel.remove();
  }

  gameOverPanel = document.createElement('div');
  gameOverPanel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 360px;
    max-width: 90vw;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 40px 30px;
    text-align: center;
    color: #66FCF1;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    border: 1px solid rgba(102, 252, 241, 0.3);
    box-shadow: 0 0 40px rgba(102, 252, 241, 0.2);
    z-index: 100;
  `;

  resultText = document.createElement('h2');
  resultText.style.cssText = `
    font-size: 32px;
    margin-bottom: 20px;
    letter-spacing: 2px;
    text-shadow: 0 0 20px currentColor;
  `;
  gameOverPanel.appendChild(resultText);

  timeText = document.createElement('p');
  timeText.style.cssText = `
    font-size: 16px;
    color: #C5C6C7;
    margin-bottom: 30px;
  `;
  gameOverPanel.appendChild(timeText);

  restartButton = document.createElement('button');
  restartButton.textContent = '重新开始';
  restartButton.style.cssText = `
    background: linear-gradient(135deg, #45A29E, #66FCF1);
    color: #0B0C10;
    border: none;
    padding: 12px 40px;
    font-size: 16px;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    letter-spacing: 1px;
  `;
  restartButton.addEventListener('mouseenter', () => {
    if (restartButton) {
      restartButton.style.transform = 'scale(1.05)';
      restartButton.style.boxShadow = '0 0 20px rgba(102, 252, 241, 0.5)';
    }
  });
  restartButton.addEventListener('mouseleave', () => {
    if (restartButton) {
      restartButton.style.transform = 'scale(1)';
      restartButton.style.boxShadow = 'none';
    }
  });
  restartButton.addEventListener('click', restartGame);
  gameOverPanel.appendChild(restartButton);

  document.body.appendChild(gameOverPanel);
}

function showGameOver(playerWon: boolean): void {
  if (!gameOverPanel || !resultText || !timeText) return;

  state.isGameOver = true;
  state.playerWon = playerWon;

  resultText.textContent = playerWon ? '胜利！' : '失败...';
  resultText.style.color = playerWon ? '#66FCF1' : '#C3073F';

  const minutes = Math.floor(state.battleTime / 60);
  const seconds = Math.floor(state.battleTime % 60);
  timeText.textContent = `战斗时长: ${minutes}分${seconds}秒`;

  gameOverPanel.style.opacity = '1';
  gameOverPanel.style.pointerEvents = 'auto';
}

function restartGame(): void {
  if (!gameOverPanel) return;

  gameOverPanel.style.opacity = '0';
  gameOverPanel.style.pointerEvents = 'none';

  state.isFading = true;
  state.fadeAlpha = 0;
  state.isFadingIn = true;

  setTimeout(() => {
    state = createInitialState(canvasWidth, canvasHeight, scale);
    state.isFadingIn = true;
    state.fadeAlpha = 1;
  }, 150);
}

function renderBackground(time: number): void {
  const gradient = ctx.createRadialGradient(
    canvasWidth / 2,
    canvasHeight / 2,
    0,
    canvasWidth / 2,
    canvasHeight / 2,
    Math.max(canvasWidth, canvasHeight) * 0.7
  );
  gradient.addColorStop(0, '#1F2833');
  gradient.addColorStop(1, '#0B0C10');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  state.stars.forEach((star: Star) => {
    const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
    const alpha = star.baseAlpha + twinkle * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, alpha)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderLaser(laser: Laser): void {
  ctx.save();
  ctx.translate(laser.x, laser.y);
  ctx.rotate(laser.angle);

  const gradient = ctx.createLinearGradient(-laser.length, 0, 0, 0);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(0.3, laser.color + '44');
  gradient.addColorStop(1, laser.color);

  ctx.shadowColor = laser.color;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = gradient;
  ctx.lineWidth = laser.width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-laser.length, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, 0, laser.width * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function updateLasers(deltaTime: number): void {
  state.lasers = state.lasers.filter((laser: Laser) => {
    laser.x += Math.cos(laser.angle) * laser.speed * deltaTime;
    laser.y += Math.sin(laser.angle) * laser.speed * deltaTime;

    if (
      laser.x < -laser.length ||
      laser.x > canvasWidth + laser.length ||
      laser.y < -laser.length ||
      laser.y > canvasHeight + laser.length
    ) {
      return false;
    }

    const targetShip = laser.isPlayer ? state.enemyShip : state.playerShip;
    const dist = distance(laser.x, laser.y, targetShip.x, targetShip.y);

    if (dist < targetShip.size) {
      const destroyed = targetShip.takeDamage(laser.damage);

      if (state.particles.length < 50) {
        const explosionParticles = createExplosion(
          laser.x,
          laser.y,
          15,
          laser.color
        );
        state.particles.push(...explosionParticles.slice(0, 50 - state.particles.length));
      }

      state.screenShake = 5;
      state.screenShakeDuration = 0.1;

      if (destroyed) {
        const bigExplosion = createExplosion(
          targetShip.x,
          targetShip.y,
          30,
          targetShip.color
        );
        state.particles.push(...bigExplosion.slice(0, 50 - state.particles.length));
        showGameOver(laser.isPlayer);
      }

      return false;
    }

    return true;
  });
}

function updateParticles(deltaTime: number): void {
  state.particles = state.particles.filter((p: Particle) => p.update(deltaTime));
}

function updateEnemyAI(deltaTime: number): void {
  if (state.isGameOver) return;

  const enemy = state.enemyShip;
  const player = state.playerShip;

  if (!enemy.isFiring) {
    enemy.startFiring(player);
  }

  if (!enemy.isMoving && Math.random() < 0.01) {
    const targetX = canvasWidth * 0.55 + random(-canvasWidth * 0.1, canvasWidth * 0.1);
    const targetY = random(canvasHeight * 0.2, canvasHeight * 0.8);
    enemy.moveTo(targetX, targetY);
  }

  if (enemy.isMoving) {
    return;
  }

  const dy = player.y - enemy.y;
  if (Math.abs(dy) > 50) {
    const moveY = clamp(dy * 0.5, -80, 80);
    enemy.moveTo(enemy.x, enemy.y + moveY);
  }
}

function updateScreenShake(deltaTime: number): void {
  if (state.screenShakeDuration > 0) {
    state.screenShakeDuration -= deltaTime;
    if (state.screenShakeDuration <= 0) {
      state.screenShake = 0;
    }
  }
}

function updateFade(deltaTime: number): void {
  if (state.isFadingIn) {
    state.fadeAlpha -= deltaTime / state.fadeDuration;
    if (state.fadeAlpha <= 0) {
      state.fadeAlpha = 0;
      state.isFadingIn = false;
    }
  }
  if (state.isFading) {
    state.fadeAlpha += deltaTime / state.fadeDuration;
    if (state.fadeAlpha >= 1) {
      state.fadeAlpha = 1;
      state.isFading = false;
    }
  }
}

function update(deltaTime: number): void {
  if (!state.isGameOver) {
    state.battleTime += deltaTime;

    const playerLaser = state.playerShip.update(deltaTime, canvasWidth, canvasHeight);
    if (playerLaser) {
      state.lasers.push(playerLaser);
    }

    updateEnemyAI(deltaTime);
    const enemyLaser = state.enemyShip.update(deltaTime, canvasWidth, canvasHeight);
    if (enemyLaser) {
      state.lasers.push(enemyLaser);
    }

    updateLasers(deltaTime);
  }

  updateParticles(deltaTime);
  updateScreenShake(deltaTime);
  updateFade(deltaTime);
}

function render(time: number): void {
  ctx.save();

  let shakeX = 0;
  let shakeY = 0;
  if (state.screenShakeDuration > 0) {
    shakeX = (Math.random() - 0.5) * state.screenShake * 2;
    shakeY = (Math.random() - 0.5) * state.screenShake * 2;
  }
  ctx.translate(shakeX, shakeY);

  renderBackground(time);

  state.lasers.forEach(renderLaser);

  state.playerShip.render(ctx);
  state.enemyShip.render(ctx);

  state.particles.forEach((p: Particle) => p.render(ctx));

  ctx.restore();

  if (state.fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${state.fadeAlpha})`;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
}

function gameLoop(timestamp: number): void {
  const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  update(deltaTime);
  render(timestamp / 1000);

  requestAnimationFrame(gameLoop);
}

function getCanvasCoordinates(e: MouseEvent | TouchEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  let clientX: number;
  let clientY: number;

  if ('touches' in e) {
    clientX = e.touches[0]?.clientX || e.changedTouches[0]?.clientX || 0;
    clientY = e.touches[0]?.clientY || e.changedTouches[0]?.clientY || 0;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function handleMouseDown(e: MouseEvent): void {
  if (state.isGameOver) return;

  const { x, y } = getCanvasCoordinates(e);

  if (e.button === 0) {
    state.playerShip.moveTo(x, y);
  } else if (e.button === 2) {
    if (state.enemyShip.containsPoint(x, y)) {
      state.playerShip.startFiring(state.enemyShip);
    }
  }
}

function handleMouseUp(e: MouseEvent): void {
  if (e.button === 2) {
    state.playerShip.stopFiring();
  }
}

function handleContextMenu(e: MouseEvent): void {
  e.preventDefault();
}

function handleTouchStart(e: TouchEvent): void {
  if (state.isGameOver) return;
  e.preventDefault();

  const { x, y } = getCanvasCoordinates(e);

  if (state.enemyShip.containsPoint(x, y)) {
    state.playerShip.startFiring(state.enemyShip);
  } else {
    state.playerShip.moveTo(x, y);
  }
}

function handleTouchEnd(e: TouchEvent): void {
  e.preventDefault();
  state.playerShip.stopFiring();
}

function handleTouchMove(e: TouchEvent): void {
  if (state.isGameOver) return;
  e.preventDefault();

  const { x, y } = getCanvasCoordinates(e);

  if (state.enemyShip.containsPoint(x, y)) {
    if (!state.playerShip.isFiring) {
      state.playerShip.startFiring(state.enemyShip);
    }
  }
}

function init(): void {
  initGame();

  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('contextmenu', handleContextMenu);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('resize', () => {
    resizeCanvas();
    state = createInitialState(canvasWidth, canvasHeight, scale);
    state.isFadingIn = true;
    state.fadeAlpha = 1;
    if (gameOverPanel) {
      gameOverPanel.style.opacity = '0';
      gameOverPanel.style.pointerEvents = 'none';
    }
  });

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

init();
