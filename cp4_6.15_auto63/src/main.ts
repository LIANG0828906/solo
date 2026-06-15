import { MazeRenderer } from './renderer';
import { Controls } from './controls';
import { state } from './state';
import { events } from './events';

const container = document.getElementById('canvas-container')!;

const renderer = new MazeRenderer(container);
const controls = new Controls(container);

(window as any)._debug = {
  renderer,
  controls,
  state,
  frameCount: 0
};

let lastTime = performance.now();
let gameStarted = false;

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  state.startGame();
}

controls.setOnRotationChange((yaw, pitch) => {
  if (!gameStarted) {
    startGame();
  }
});

function animate() {
  requestAnimationFrame(animate);

  (window as any)._debug.frameCount++;

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
}

window.addEventListener('keydown', (e) => {
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
    if (!gameStarted) {
      startGame();
    }
  }
}, { once: false });

container.addEventListener('click', () => {
  if (!gameStarted) {
    startGame();
  }
});

events.on('gameReset', () => {
  gameStarted = false;
  lastTime = performance.now();
});

animate();

window.addEventListener('beforeunload', () => {
  controls.dispose();
  renderer.dispose();
});
