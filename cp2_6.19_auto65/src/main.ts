import { GameEngine } from './gameEngine';

const CANVAS_W = 800;
const CANVAS_H = 600;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

let lastTime = 0;
let accumulator = 0;
let rafId = 0;
let fpsFrames = 0;
let fpsTimer = 0;
let currentFPS = 60;

const gameCanvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const vortexCanvas = document.getElementById('vortex-overlay') as HTMLCanvasElement;
const startScreen = document.getElementById('start-screen') as HTMLDivElement;
const gameOverScreen = document.getElementById('game-over-screen') as HTMLDivElement;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
const finalScoreEl = document.getElementById('final-score') as HTMLDivElement;
const blackScreen = document.getElementById('black-screen') as HTMLDivElement;
const damageFlash = document.getElementById('damage-flash') as HTMLDivElement;
const upgradePopup = document.getElementById('upgrade-popup') as HTMLDivElement;

if (!gameCanvas || !vortexCanvas || !startScreen || !gameOverScreen ||
    !startBtn || !restartBtn || !finalScoreEl || !blackScreen || !damageFlash || !upgradePopup) {
  throw new Error('Critical DOM elements missing');
}

const engine = new GameEngine(gameCanvas, vortexCanvas);

const handleKeyDown = (e: KeyboardEvent): void => {
  engine.keys.add(e.code);
  if (e.code === 'KeyE' && !e.repeat) {
    engine.tryCollectOre();
  }
  if (e.code === 'KeyM' && !e.repeat) {
    engine.toggleMute();
  }
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
};

const handleKeyUp = (e: KeyboardEvent): void => {
  engine.keys.delete(e.code);
};

const handleMouseMove = (e: MouseEvent): void => {
  engine.setMouse(e.clientX, e.clientY);
};

const handleMouseDown = (e: MouseEvent): void => {
  if (e.button === 0) {
    engine.fireBullet();
  }
};

const attachInput = (): void => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  gameCanvas.addEventListener('mousemove', handleMouseMove);
  gameCanvas.addEventListener('mousedown', handleMouseDown);
};

const detachInput = (): void => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  gameCanvas.removeEventListener('mousemove', handleMouseMove);
  gameCanvas.removeEventListener('mousedown', handleMouseDown);
};

const startGame = (): void => {
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  engine.reset();
  engine.sound.resume();
  attachInput();
  lastTime = performance.now();
  accumulator = 0;
  cancelAnimationFrame(rafId);
  gameLoop(lastTime);
};

const showGameOver = (): void => {
  detachInput();
  finalScoreEl.textContent = `最终分数: ${engine.score}`;
  gameOverScreen.classList.remove('hidden');
  cancelAnimationFrame(rafId);
};

engine.onGameOver(showGameOver);

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

const updateOverlayEffects = (): void => {
  const bsAlpha = engine.getBlackScreenAlpha();
  blackScreen.style.opacity = bsAlpha.toFixed(3);

  const dfAlpha = engine.getDamageFlashAlpha();
  if (dfAlpha > 0) {
    const px = Math.floor(60 * dfAlpha);
    damageFlash.style.boxShadow = `inset 0 0 ${px + 40}px ${px}px rgba(255, 40, 40, ${dfAlpha.toFixed(3)})`;
  } else {
    damageFlash.style.boxShadow = 'inset 0 0 0 0 rgba(255, 50, 50, 0)';
  }

  const bh = engine.blackHole;
  const bhOverlayEl = document.getElementById('vortex-overlay') as HTMLCanvasElement;
  if (bh.active && (bh.phase === 0 || bh.phase === 1)) {
    const alpha = bh.phase === 0 ? bh.progress * 0.9 : Math.max(0, (1 - bh.progress) * 0.9);
    bhOverlayEl.style.opacity = alpha.toFixed(3);
  } else {
    bhOverlayEl.style.opacity = '0';
  }
};

const gameLoop = (timestamp: number): void => {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  accumulator += delta;

  while (accumulator >= FRAME_TIME) {
    engine.update();
    accumulator -= FRAME_TIME;
  }

  fpsFrames++;
  fpsTimer += delta;
  if (fpsTimer >= 1000) {
    currentFPS = Math.round((fpsFrames * 1000) / fpsTimer);
    fpsFrames = 0;
    fpsTimer = 0;
    (window as unknown as { __debugFPS?: number }).__debugFPS = currentFPS;
  }

  engine.render();
  updateOverlayEffects();

  rafId = requestAnimationFrame(gameLoop);
};

const idleRender = (): void => {
  engine.renderer.updateStars();
  engine.renderer.clear();
  engine.renderer.drawBackground();
};

const idleLoop = (): void => {
  idleRender();
  rafId = requestAnimationFrame(idleLoop);
};

idleLoop();
