import * as THREE from 'three';
import { PhysicsEngine } from './game/engine';
import { GameRenderer } from './game/renderer';
import { SceneManager } from './editor/sceneManager';
import { EditorUI } from './editor/ui';
import level1 from './levels/level1.json';

const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') === 'editor' ? 'editor' : 'game';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const gameHud = document.getElementById('gameHud') as HTMLElement;
const editorUIEl = document.getElementById('editorUI') as HTMLElement;
const gameOverOverlay = document.getElementById('gameOverOverlay') as HTMLElement;
const launchHint = document.getElementById('launchHint') as HTMLElement;

const renderer = new GameRenderer(canvas);
const engine = new PhysicsEngine();

let sceneManager: SceneManager | null = null;
let editorUIController: EditorUI | null = null;

let scoreDisplay: HTMLElement;
let livesDisplay: HTMLElement;
let finalScore: HTMLElement;

function setupUI(): void {
  scoreDisplay = document.getElementById('scoreDisplay')!;
  livesDisplay = document.getElementById('livesDisplay')!;
  finalScore = document.getElementById('finalScore')!;

  document.getElementById('modeSwitchGame')!.addEventListener('click', () => {
    window.location.search = '?mode=editor';
  });
  document.getElementById('modeSwitchEditor')!.addEventListener('click', () => {
    window.location.search = '?mode=game';
  });
  document.getElementById('restartBtn')!.addEventListener('click', () => {
    gameOverOverlay.style.display = 'none';
    engine.restart(level1.bricks);
    updateHUD();
  });
}

function updateHUD(): void {
  if (scoreDisplay) scoreDisplay.textContent = engine.score.toString();
  if (livesDisplay) {
    livesDisplay.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart' + (i >= engine.lives ? ' lost' : '');
      heart.textContent = '♥';
      livesDisplay.appendChild(heart);
    }
  }
}

function initGameMode(): void {
  engine.restart(level1.bricks);
  gameHud.style.display = 'flex';
  editorUIEl.style.display = 'none';
  updateHUD();

  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('click', handleLaunch);
  canvas.addEventListener('touchstart', handleLaunchTouch, { passive: false });
}

function initEditorMode(): void {
  sceneManager = new SceneManager(renderer);
  editorUIController = new EditorUI(sceneManager);
  sceneManager.init();
  editorUIController.init();

  gameHud.style.display = 'none';
  editorUIEl.style.display = 'block';
}

function handleMouseMove(e: MouseEvent): void {
  const { gx } = renderer.screenToGame(e.clientX, e.clientY);
  engine.paddleX = Math.max(engine.paddleWidth / 2,
    Math.min(engine.fieldWidth - engine.paddleWidth / 2, gx));
}

function handleTouchMove(e: TouchEvent): void {
  e.preventDefault();
  if (e.touches.length > 0) {
    const t = e.touches[0];
    const { gx } = renderer.screenToGame(t.clientX, t.clientY);
    engine.paddleX = Math.max(engine.paddleWidth / 2,
      Math.min(engine.fieldWidth - engine.paddleWidth / 2, gx));
  }
}

function handleLaunch(): void {
  if (!engine.ballLaunched) {
    engine.launchBall();
    if (launchHint) launchHint.style.display = 'none';
  }
}

function handleLaunchTouch(e: TouchEvent): void {
  e.preventDefault();
  handleLaunch();
}

let lastTime = performance.now();
const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);

  const now = performance.now();
  let dt = (now - lastTime) / 1000;
  lastTime = now;

  if (dt > 1 / 30) dt = 1 / 30;

  if (mode === 'game') {
    engine.update(dt);
    renderer.updateFromEngine(engine);
    updateHUD();

    if (launchHint && !engine.ballLaunched && !engine.gameOver) {
      launchHint.style.display = 'block';
    } else if (launchHint) {
      launchHint.style.display = 'none';
    }

    if (engine.gameOver && gameOverOverlay.style.display === 'none') {
      gameOverOverlay.style.display = 'flex';
      finalScore.textContent = engine.score.toString();
    }
  }

  renderer.updateParticles(dt);
  renderer.render();
}

setupUI();

if (mode === 'game') {
  initGameMode();
} else {
  initEditorMode();
}

animate();
