import type { GameScene, InputState, Camera, TouchButton, UIButton } from './types';
import { Player } from './player';
import { Platform, PlatformGenerator } from './platform';
import { Star, GoalRing } from './star';
import { ParticlePool, lerp, lerpColor, easeOutBounce } from './utils';
import confetti from 'canvas-confetti';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
let dpr = window.devicePixelRatio || 1;

const input: InputState = {
  left: false,
  right: false,
  jump: false,
};

const camera: Camera = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
};

let currentScene: GameScene = 'menu';
let showInstructions = false;

let player: Player;
let platforms: Platform[] = [];
let stars: Star[] = [];
let goalRing: GoalRing | null = null;
let platformGenerator: PlatformGenerator;

let particlePool: ParticlePool;

let lives = 3;
let collectedStars = 0;
let totalStars = 0;
let displayStars = 0;
let starCountAnimation = 0;
let gameTime = 0;
let heartBreakAnimation = 0;
let heartBreakIndex = -1;

let touchButtons: TouchButton[] = [];
let isMobile = false;

let menuButtons: UIButton[] = [];
let victoryButtons: UIButton[] = [];

let lastTime = 0;
let accumulator = 0;
const fixedStep = 1 / 60;

let animationId: number;

function resizeCanvas(): void {
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
  dpr = window.devicePixelRatio || 1;
  
  canvas.width = screenWidth * dpr;
  canvas.height = screenHeight * dpr;
  canvas.style.width = screenWidth + 'px';
  canvas.style.height = screenHeight + 'px';
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = false;
  
  if (platformGenerator) {
    platformGenerator.resize(screenWidth, screenHeight);
  }
  
  initTouchButtons();
  initMenuButtons();
  initVictoryButtons();
}

function initTouchButtons(): void {
  const buttonRadius = Math.min(40, screenWidth * 0.08);
  const margin = 30;
  const bottomY = screenHeight - margin - buttonRadius;

  touchButtons = [
    { x: margin + buttonRadius, y: bottomY, radius: buttonRadius, active: false, label: '◀' },
    { x: margin + buttonRadius * 3 + 20, y: bottomY, radius: buttonRadius, active: false, label: '▶' },
    { x: screenWidth - margin - buttonRadius, y: bottomY, radius: buttonRadius * 1.2, active: false, label: '⤒' },
  ];
}

function initMenuButtons(): void {
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  const btnWidth = 200;
  const btnHeight = 50;
  const spacing = 20;

  menuButtons = [
    {
      x: centerX - btnWidth / 2,
      y: centerY - btnHeight - spacing / 2,
      width: btnWidth,
      height: btnHeight,
      label: '开始游戏',
      hovered: false,
      onClick: startGame,
    },
    {
      x: centerX - btnWidth / 2,
      y: centerY + spacing / 2,
      width: btnWidth,
      height: btnHeight,
      label: '操作说明',
      hovered: false,
      onClick: () => { showInstructions = true; },
    },
  ];
}

function initVictoryButtons(): void {
  const centerX = screenWidth / 2;
  
  victoryButtons = [
    {
      x: centerX - 100,
      y: screenHeight / 2 + 100,
      width: 200,
      height: 50,
      label: '再来一次',
      hovered: false,
      onClick: restartGame,
    },
  ];
}

function checkMobile(): void {
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || ('ontouchstart' in window);
}

function initGame(): void {
  resizeCanvas();
  checkMobile();
  
  platformGenerator = new PlatformGenerator(screenWidth, screenHeight);
  particlePool = new ParticlePool(150);
  
  player = new Player(150, screenHeight - 150);
  
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function startGame(): void {
  currentScene = 'playing';
  lives = 3;
  collectedStars = 0;
  displayStars = 0;
  gameTime = 0;
  heartBreakAnimation = 0;
  heartBreakIndex = -1;
  
  generateLevel();
}

function generateLevel(): void {
  particlePool.clear();
  
  const { platforms: newPlatforms, goalX, goalY } = platformGenerator.generate(20);
  platforms = newPlatforms;
  
  const starPositions = platformGenerator.generateStars(platforms, 15);
  totalStars = starPositions.length;
  stars = starPositions.map(pos => new Star(pos.x, pos.y));
  
  goalRing = new GoalRing(goalX, goalY);
  
  player.x = 150;
  player.y = screenHeight - 150;
  player.vx = 0;
  player.vy = 0;
  
  camera.x = 0;
  camera.y = 0;
  camera.targetX = 0;
  camera.targetY = 0;
}

function restartGame(): void {
  startGame();
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = true;
  if (e.code === 'Space') {
    e.preventDefault();
    input.jump = true;
  }
  if (e.code === 'Escape') {
    if (showInstructions) showInstructions = false;
  }
}

function handleKeyUp(e: KeyboardEvent): void {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = false;
  if (e.code === 'Space') input.jump = false;
}

function handleMouseMove(e: MouseEvent): void {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  for (const btn of menuButtons) {
    btn.hovered = x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height;
  }
  for (const btn of victoryButtons) {
    btn.hovered = x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height;
  }
}

function handleClick(e: MouseEvent): void {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (showInstructions) {
    const closeBtnX = screenWidth / 2 + 180;
    const closeBtnY = screenHeight / 2 - 150;
    if (Math.hypot(x - closeBtnX, y - closeBtnY) < 20) {
      showInstructions = false;
      return;
    }
  }
  
  if (currentScene === 'menu' && !showInstructions) {
    for (const btn of menuButtons) {
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        btn.onClick();
        return;
      }
    }
  }
  
  if (currentScene === 'victory') {
    for (const btn of victoryButtons) {
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        btn.onClick();
        return;
      }
    }
  }
}

function handleTouchStart(e: TouchEvent): void {
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  
  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    for (const btn of touchButtons) {
      const dist = Math.hypot(x - btn.x, y - btn.y);
      if (dist <= btn.radius) {
        btn.active = true;
        if (navigator.vibrate) navigator.vibrate(10);
      }
    }
  }
  
  updateTouchInput();
  
  if (currentScene === 'menu' && !showInstructions) {
    for (const btn of menuButtons) {
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        btn.onClick();
        return;
      }
    }
  }
}

function handleTouchMove(e: TouchEvent): void {
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  
  for (const btn of touchButtons) {
    btn.active = false;
  }
  
  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    for (const btn of touchButtons) {
      const dist = Math.hypot(x - btn.x, y - btn.y);
      if (dist <= btn.radius) {
        btn.active = true;
      }
    }
  }
  
  updateTouchInput();
}

function handleTouchEnd(e: TouchEvent): void {
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  
  for (const btn of touchButtons) {
    btn.active = false;
  }
  
  updateTouchInput();
  
  if (showInstructions) {
    const touch = e.changedTouches[0];
    if (touch) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const closeBtnX = screenWidth / 2 + 180;
      const closeBtnY = screenHeight / 2 - 150;
      if (Math.hypot(x - closeBtnX, y - closeBtnY) < 20) {
        showInstructions = false;
        return;
      }
    }
  }
  
  if (currentScene === 'victory') {
    const touch = e.changedTouches[0];
    if (touch) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      for (const btn of victoryButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
          btn.onClick();
          return;
        }
      }
    }
  }
}

function updateTouchInput(): void {
  input.left = touchButtons[0]?.active || false;
  input.right = touchButtons[1]?.active || false;
  input.jump = touchButtons[2]?.active || false;
}

function update(dt: number): void {
  if (currentScene === 'playing') {
    gameTime += dt;
    
    player.update(dt, input, platforms, particlePool);
    
    for (const platform of platforms) {
      platform.update(dt, particlePool);
    }
    
    for (const star of stars) {
      star.update(dt);
      if (star.checkCollision(player.getAABB())) {
        star.collect(particlePool);
        collectedStars++;
      }
    }
    
    stars = stars.filter(s => !s.isCollectAnimationDone());
    
    if (goalRing) {
      goalRing.update(dt);
      if (goalRing.checkCollision(player.getAABB())) {
        triggerVictory();
      }
    }
    
    if (displayStars < collectedStars) {
      starCountAnimation += dt * 5;
      if (starCountAnimation >= 1) {
        displayStars = Math.min(displayStars + 1, collectedStars);
        starCountAnimation = 0;
      }
    }
    
    particlePool.update(dt, 400);
    
    camera.targetX = player.x + player.width / 2 - screenWidth / 2;
    camera.targetY = player.y + player.height / 2 - screenHeight / 2;
    
    camera.x = lerp(camera.x, camera.targetX, 0.1);
    camera.y = lerp(camera.y, camera.targetY, 0.1);
    
    camera.x = Math.max(0, camera.x);
    camera.y = Math.min(0, camera.y);
    
    if (player.isBelowScreen(screenHeight, camera.y)) {
      handlePlayerFall();
    }
    
    if (heartBreakAnimation > 0) {
      heartBreakAnimation -= dt;
    }
  }
}

function handlePlayerFall(): void {
  lives--;
  heartBreakAnimation = 0.5;
  heartBreakIndex = lives;
  
  if (lives <= 0) {
    currentScene = 'menu';
    return;
  }
  
  const nearestPlatform = platformGenerator.findNearestSafePlatform(
    platforms,
    player.x + player.width / 2,
    player.y
  );
  
  if (nearestPlatform) {
    const respawnX = nearestPlatform.x + nearestPlatform.width / 2 - player.width / 2;
    const respawnY = nearestPlatform.y - player.height - 10;
    player.respawn(respawnX, respawnY);
    
    camera.targetX = respawnX + player.width / 2 - screenWidth / 2;
    camera.targetY = respawnY + player.height / 2 - screenHeight / 2;
    camera.x = camera.targetX;
    camera.y = camera.targetY;
  }
}

function triggerVictory(): void {
  currentScene = 'victory';
  
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4A90D9', '#7B59C4', '#F5A623', '#FFD700']
  });
  
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#4A90D9', '#F5A623']
    });
  }, 200);
  
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#7B59C4', '#FFD700']
    });
  }, 400);
}

function render(): void {
  ctx.clearRect(0, 0, screenWidth, screenHeight);
  
  if (currentScene === 'menu') {
    renderMenuBackground();
    renderMenu();
    if (showInstructions) {
      renderInstructions();
    }
  } else if (currentScene === 'playing') {
    renderGameBackground();
    renderGame();
    renderGameUI();
    if (isMobile) {
      renderTouchButtons();
    }
  } else if (currentScene === 'victory') {
    renderGameBackground();
    renderGame();
    renderVictory();
  }
}

function renderMenuBackground(): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, screenHeight);
  gradient.addColorStop(0, '#4A90D9');
  gradient.addColorStop(1, '#7B59C4');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  
  const time = Date.now() / 1000;
  
  ctx.fillStyle = 'rgba(74, 144, 217, 0.3)';
  drawHill(0, screenHeight * 0.7, screenWidth * 0.5, screenHeight * 0.4);
  
  ctx.fillStyle = 'rgba(123, 89, 196, 0.3)';
  drawHill(screenWidth * 0.3, screenHeight * 0.75, screenWidth * 0.6, screenHeight * 0.35);
  
  for (let i = 0; i < 50; i++) {
    const x = (i * 73 + time * 10) % screenWidth;
    const y = screenHeight * 0.3 + Math.sin(time + i) * 20;
    const size = 1 + Math.sin(time * 2 + i) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 3 + i) * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHill(x: number, y: number, w: number, h: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + w / 2, y - h, x + w, y);
  ctx.lineTo(x + w, screenHeight);
  ctx.lineTo(x, screenHeight);
  ctx.closePath();
  ctx.fill();
}

function renderMenu(): void {
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  
  ctx.save();
  
  const cardX = centerX - 200;
  const cardY = centerY - 180;
  const cardW = 400;
  const cardH = 300;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 20);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  const titleY = cardY + 70;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('星空跳跃', centerX, titleY);
  
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('收集星星，到达终点！', centerX, titleY + 35);
  
  for (const btn of menuButtons) {
    renderButton(btn);
  }
  
  ctx.restore();
}

function renderInstructions(): void {
  ctx.save();
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  const cardW = 400;
  const cardH = 300;
  const cardX = centerX - cardW / 2;
  const cardY = centerY - cardH / 2;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 20);
  ctx.fill();
  
  const closeX = cardX + cardW - 30;
  const closeY = cardY + 30;
  ctx.fillStyle = '#7B59C4';
  ctx.font = '24px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.beginPath();
  ctx.arc(closeX, closeY, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('×', closeX, closeY + 8);
  
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 24px "Segoe UI", sans-serif';
  ctx.fillText('操作说明', centerX, cardY + 60);
  
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  
  const contentX = cardX + 40;
  let contentY = cardY + 110;
  
  ctx.fillStyle = '#4A90D9';
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.fillText('键盘操作：', contentX, contentY);
  contentY += 25;
  
  ctx.fillStyle = '#333333';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillText('• A / ← ：向左移动', contentX + 20, contentY);
  contentY += 25;
  ctx.fillText('• D / → ：向右移动', contentX + 20, contentY);
  contentY += 25;
  ctx.fillText('• 空格 ：跳跃', contentX + 20, contentY);
  contentY += 35;
  
  ctx.fillStyle = '#7B59C4';
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.fillText('触控操作：', contentX, contentY);
  contentY += 25;
  
  ctx.fillStyle = '#333333';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillText('• 左侧按钮 ：控制左右移动', contentX + 20, contentY);
  contentY += 25;
  ctx.fillText('• 右侧按钮 ：跳跃', contentX + 20, contentY);
  contentY += 25;
  ctx.fillText('• 游戏目标：收集星星，到达终点光环', contentX + 20, contentY);
  
  ctx.restore();
}

function renderGameBackground(): void {
  const playerHeightFactor = clamp(-camera.y / 1000, 0, 1);
  
  const skyTop = lerpColor('#4A90D9', '#2C1654', playerHeightFactor);
  const skyBottom = lerpColor('#7B59C4', '#1A0A2E', playerHeightFactor);
  
  const gradient = ctx.createLinearGradient(0, 0, 0, screenHeight);
  gradient.addColorStop(0, skyTop);
  gradient.addColorStop(1, skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  
  const parallaxOffset = camera.x * 0.1;
  const hillBaseY = screenHeight * 0.6;
  
  ctx.fillStyle = 'rgba(50, 30, 80, 0.4)';
  drawParallaxHill(parallaxOffset, hillBaseY, screenWidth * 0.8, screenHeight * 0.5);
  
  ctx.fillStyle = 'rgba(70, 40, 100, 0.5)';
  drawParallaxHill(parallaxOffset * 1.5, hillBaseY + 30, screenWidth * 0.7, screenHeight * 0.4);
  
  ctx.fillStyle = 'rgba(90, 50, 120, 0.6)';
  drawParallaxHill(parallaxOffset * 2, hillBaseY + 60, screenWidth * 0.6, screenHeight * 0.3);
  
  const time = Date.now() / 1000;
  for (let i = 0; i < 30; i++) {
    const x = (i * 97 + time * 5) % screenWidth;
    const y = 50 + (i * 37) % (screenHeight * 0.4);
    const size = 1 + Math.sin(time * 2 + i) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(time * 3 + i) * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParallaxHill(offset: number, y: number, w: number, h: number): void {
  const startX = -offset % screenWidth - screenWidth;
  for (let x = startX; x < screenWidth * 2; x += w * 0.8) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w / 2, y - h, x + w, y);
    ctx.lineTo(x + w, screenHeight);
    ctx.lineTo(x, screenHeight);
    ctx.closePath();
    ctx.fill();
  }
}

function renderGame(): void {
  for (const platform of platforms) {
    if (platform.isOnScreen(camera.x, camera.y, screenWidth, screenHeight)) {
      platform.render(ctx, camera.x, camera.y);
    }
  }
  
  for (const star of stars) {
    if (star.isOnScreen(camera.x, camera.y, screenWidth, screenHeight)) {
      star.render(ctx, camera.x, camera.y);
    }
  }
  
  if (goalRing) {
    goalRing.render(ctx, camera.x, camera.y);
  }
  
  particlePool.render(ctx, camera.x, camera.y);
  
  player.render(ctx, camera.x, camera.y);
}

function renderGameUI(): void {
  ctx.save();
  
  const displayValue = Math.floor(displayStars + (collectedStars - displayStars) * easeOutBounce(starCountAnimation));
  
  const starIconX = 25;
  const starIconY = 30;
  drawStarIcon(starIconX, starIconY, 15, '#F5A623');
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${displayValue} / ${totalStars}`, starIconX + 30, starIconY + 8);
  
  const heartX = screenWidth - 30;
  const heartY = 30;
  const heartSpacing = 35;
  
  for (let i = 0; i < 3; i++) {
    const hx = heartX - i * heartSpacing;
    const isBroken = i >= lives;
    const isBreaking = i === heartBreakIndex && heartBreakAnimation > 0;
    drawHeart(hx, heartY, isBroken, isBreaking ? heartBreakAnimation / 0.5 : 0);
  }
  
  const minutes = Math.floor(gameTime / 60);
  const seconds = Math.floor(gameTime % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(timeStr, screenWidth / 2, 45);
  
  ctx.restore();
}

function drawStarIcon(cx: number, cy: number, r: number, color: string): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawHeart(cx: number, cy: number, broken: boolean, breakProgress: number): void {
  ctx.save();
  
  if (breakProgress > 0) {
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(breakProgress * Math.PI * 5) * breakProgress * 0.3);
    ctx.translate(-cx, -cy);
  }
  
  const size = 12;
  
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx - size, cy - size * 0.5, cx - size * 1.5, cy + size * 0.3, cx, cy + size);
  ctx.bezierCurveTo(cx + size * 1.5, cy + size * 0.3, cx + size, cy - size * 0.5, cx, cy + size * 0.3);
  ctx.closePath();
  
  if (broken) {
    ctx.fillStyle = '#666666';
  } else if (breakProgress > 0) {
    const r = Math.round(255 - breakProgress * 100);
    ctx.fillStyle = `rgb(${r}, ${Math.round(50 + breakProgress * 205)}, 50)`;
  } else {
    ctx.fillStyle = '#FF6B6B';
  }
  ctx.fill();
  
  if (!broken && breakProgress <= 0) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  if (broken || breakProgress > 0) {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - 2);
    ctx.lineTo(cx + 2, cy + 5);
    ctx.lineTo(cx - 1, cy + 8);
    ctx.stroke();
  }
  
  ctx.restore();
}

function renderTouchButtons(): void {
  ctx.save();
  
  for (const btn of touchButtons) {
    const scale = btn.active ? 1.2 : 1;
    const alpha = btn.active ? 0.6 : 0.3;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = btn.active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(btn.x, btn.y, btn.radius * scale, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${btn.radius * 0.8}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(btn.label, btn.x, btn.y + btn.radius * 0.3);
    
    ctx.restore();
  }
  
  ctx.restore();
}

function renderVictory(): void {
  ctx.save();
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 56px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 恭喜通关！', centerX, centerY - 80);
  
  const cardW = 350;
  const cardH = 200;
  const cardX = centerX - cardW / 2;
  const cardY = centerY - cardH / 2;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 20);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  const minutes = Math.floor(gameTime / 60);
  const seconds = Math.floor(gameTime % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  ctx.fillStyle = '#F5A623';
  ctx.font = 'bold 32px "Segoe UI", sans-serif';
  ctx.fillText(`⏱ ${timeStr}`, centerX, cardY + 60);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px "Segoe UI", sans-serif';
  ctx.fillText(`⭐ ${collectedStars} / ${totalStars}`, centerX, cardY + 105);
  
  for (const btn of victoryButtons) {
    renderButton(btn);
  }
  
  ctx.restore();
}

function renderButton(btn: UIButton): void {
  ctx.save();
  
  const scale = btn.hovered ? 1.05 : 1;
  const centerX = btn.x + btn.width / 2;
  const centerY = btn.y + btn.height / 2;
  
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  
  if (btn.hovered) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
  }
  
  const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
  gradient.addColorStop(0, '#4A90D9');
  gradient.addColorStop(1, '#7B59C4');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 12);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.shadowColor = 'transparent';
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(btn.label, centerX, centerY + 7);
  
  ctx.restore();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function gameLoop(currentTime: number): void {
  if (currentTime === 0) {
    lastTime = currentTime;
  }
  
  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;
  
  accumulator += dt;
  
  while (accumulator >= fixedStep) {
    update(fixedStep);
    accumulator -= fixedStep;
  }
  
  render();
  
  animationId = requestAnimationFrame(gameLoop);
}

initGame();
animationId = requestAnimationFrame(gameLoop);
