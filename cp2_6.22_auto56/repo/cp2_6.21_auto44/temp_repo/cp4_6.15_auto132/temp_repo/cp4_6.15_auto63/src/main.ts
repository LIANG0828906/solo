import { MazeRenderer } from './renderer';
import { Controls } from './controls';
import { state } from './state';
import { events } from './events';

const container = document.getElementById('canvas-container')!;

const renderer = new MazeRenderer(container);
const controls = new Controls(container);

const debugObj: Record<string, unknown> = {
  renderer,
  controls,
  state,
  frameCount: 0
};
// @ts-ignore
window._debug = debugObj;

let lastTime = performance.now();
let gameStarted = false;

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  state.startGame();
}

controls.setOnRotationChange(() => {
  if (!gameStarted) {
    startGame();
  }
});

function animate() {
  try {
    // @ts-ignore
    window._debug.frameCount = (window._debug.frameCount || 0) + 1;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    const { collided } = controls.update(deltaTime);

    if (controls.isMoving() && !gameStarted) {
      startGame();
    }

    const gameState = state.getState();
    const collisionCells: { x: number; z: number }[] = [];

    if (collided) {
      const playerCellX = Math.floor(gameState.player.x / 2);
      const playerCellZ = Math.floor(gameState.player.z / 2);
      collisionCells.push({ x: playerCellX, z: playerCellZ });
    }

    renderer.setCollisionCells(collisionCells);

    renderer.update(
      deltaTime,
      controls.getYaw(),
      controls.getPitch(),
      controls.isMoving(),
      collided
    );
  } catch (err) {
    console.error('animate error:', err);
  }

  requestAnimationFrame(animate);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(key) >= 0) {
    if (!gameStarted) {
      startGame();
    }
  }
});

container.addEventListener('click', () => {
  if (!gameStarted) {
    startGame();
  }
});

events.on('gameReset', () => {
  gameStarted = false;
  lastTime = performance.now();
  controls.reset();
});

// 延迟启动动画循环，确保 DOM 和 Three.js 完全初始化
requestAnimationFrame(animate);

window.addEventListener('beforeunload', () => {
  controls.dispose();
  renderer.dispose();
});
