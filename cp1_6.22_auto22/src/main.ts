import { GameState, GamePhase, GAME_WIDTH, GAME_HEIGHT, PADDLE_BASE_WIDTH } from './GameState';
import { PhysicsEngine } from './PhysicsEngine';
import { Renderer } from './Renderer';
import { InputHandler } from './InputHandler';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const wrapper = document.getElementById('game-wrapper') as HTMLDivElement;

const renderer = new Renderer(canvas);
const physics = new PhysicsEngine();
const input = new InputHandler(canvas);
const state = new GameState();

let lastTime = 0;
let running = true;

let startButton: HTMLButtonElement | null = null;
let restartButton: HTMLButtonElement | null = null;

function createButton(text: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'arcade-btn';
  btn.textContent = text;
  btn.addEventListener('click', onClick);
  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    onClick();
  });
  return btn;
}

function showStartButton(): void {
  removeButtons();
  startButton = createButton('START GAME', () => {
    removeButtons();
    state.startGame();
    renderer.playSound(600, 0.1, 'sine', 0.1);
  });
  styleButtonOverlay(startButton);
  wrapper.appendChild(startButton);
}

function showRestartButton(): void {
  removeButtons();
  restartButton = createButton('RESTART', () => {
    removeButtons();
    state.startGame();
    renderer.playSound(600, 0.1, 'sine', 0.1);
  });
  styleButtonOverlay(restartButton);
  wrapper.appendChild(restartButton);
}

function styleButtonOverlay(btn: HTMLButtonElement): void {
  btn.style.position = 'absolute';
  btn.style.left = '50%';
  btn.style.transform = 'translate(-50%, -50%)';
  btn.style.zIndex = '10';
  if (state.phase === GamePhase.MENU) {
    btn.style.top = `${(GAME_HEIGHT / 2 + 90) * (canvas.height / GAME_HEIGHT)}px`;
  } else {
    btn.style.top = `${(GAME_HEIGHT / 2 + 90) * (canvas.height / GAME_HEIGHT)}px`;
  }
}

function removeButtons(): void {
  if (startButton && startButton.parentNode) {
    startButton.parentNode.removeChild(startButton);
    startButton = null;
  }
  if (restartButton && restartButton.parentNode) {
    restartButton.parentNode.removeChild(restartButton);
    restartButton = null;
  }
}

function resize(): void {
  const maxW = window.innerWidth - 40;
  const maxH = window.innerHeight - 40;
  const aspect = GAME_WIDTH / GAME_HEIGHT;

  let w: number;
  let h: number;

  if (maxW / maxH > aspect) {
    h = maxH;
    w = h * aspect;
  } else {
    w = maxW;
    h = w / aspect;
  }

  w = Math.floor(w);
  h = Math.floor(h);

  const scaleRatio = w / GAME_WIDTH;

  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  renderer.resize(GAME_WIDTH, GAME_HEIGHT);

  input.updateTransform(scaleRatio, 0);

  if (startButton) styleButtonOverlay(startButton);
  if (restartButton) styleButtonOverlay(restartButton);
}

let prevBallCount = 0;
let prevBrickAlive = 0;

function gameLoop(timestamp: number): void {
  if (!running) return;

  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  // Input
  if (state.phase === GamePhase.PLAYING) {
    const paddleTarget = input.getTargetPaddleX(state.paddle.width);
    if (paddleTarget !== null) {
      state.paddle.targetX = paddleTarget;
    }

    const keyboardSpeed = 500;
    if (input.isLeftPressed()) {
      state.paddle.targetX = state.paddle.x - keyboardSpeed * dt;
    }
    if (input.isRightPressed()) {
      state.paddle.targetX = state.paddle.x + keyboardSpeed * dt;
    }

    state.paddle.targetX = Math.max(0, Math.min(GAME_WIDTH - state.paddle.width, state.paddle.targetX));
  }

  if (state.phase === GamePhase.MENU) {
    if (input.consumeAction()) {
      removeButtons();
      state.startGame();
    }
  }

  if (state.phase === GamePhase.GAME_OVER) {
    if (!restartButton) showRestartButton();
  }

  // Physics
  if (state.phase === GamePhase.PLAYING) {
    const aliveBefore = state.bricks.filter(b => b.alive).length;
    physics.update(state, dt);
    const aliveAfter = state.bricks.filter(b => b.alive).length;

    if (aliveBefore > aliveAfter) {
      const destroyed = aliveBefore - aliveAfter;
      for (let i = 0; i < destroyed; i++) {
        renderer.playBrickDestroySound();
      }
      const hitButNotDead = aliveBefore - aliveAfter < (prevBrickAlive - aliveAfter);
      if (!hitButNotDead && destroyed === 0 && aliveBefore !== aliveAfter) {
        // partial hit
        renderer.playBrickHitSound();
      }
    }

    // detect any brick that was hit but not destroyed (flickering started)
    for (const brick of state.bricks) {
      if (brick.flickering && brick.flickerTimer > 0.13) {
        renderer.playBrickHitSound();
      }
    }

    // ball-paddle bounce sound
    const currentBallCount = state.balls.length;
    for (const ball of state.balls) {
      if (ball.vy < 0 && ball.y <= state.paddle.y + 2) {
        // ball is moving up and near paddle - detected bounce
      }
    }

    prevBrickAlive = state.bricks.filter(b => b.alive).length;
  }

  // State update
  state.update(dt);

  // Detect phase transitions for sounds
  if (state.phase === GamePhase.WIN) {
    // Only play once
    if (state.winAnimationTimer < dt * 2) {
      renderer.playWinSound();
      removeButtons();
      setTimeout(() => showRestartButton(), 3000);
    }
  }

  if (state.phase === GamePhase.GAME_OVER) {
    // Only play once
  }

  // Render
  renderer.render(state);

  requestAnimationFrame(gameLoop);
}

// Handle ball-paddle sound with a simple approach
let lastBallAbovePaddle = true;

function enhancedGameLoop(timestamp: number): void {
  if (!running) return;

  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (state.phase === GamePhase.PLAYING) {
    const paddleTarget = input.getTargetPaddleX(state.paddle.width);
    if (paddleTarget !== null) {
      state.paddle.targetX = paddleTarget;
    }

    const keyboardSpeed = 500;
    if (input.isLeftPressed()) {
      state.paddle.targetX = state.paddle.x - keyboardSpeed * dt;
    }
    if (input.isRightPressed()) {
      state.paddle.targetX = state.paddle.x + keyboardSpeed * dt;
    }

    state.paddle.targetX = Math.max(0, Math.min(GAME_WIDTH - state.paddle.width, state.paddle.targetX));
  }

  if (state.phase === GamePhase.MENU) {
    if (input.consumeAction()) {
      removeButtons();
      state.startGame();
    }
  }

  if (state.phase === GamePhase.GAME_OVER) {
    if (!restartButton) showRestartButton();
  }

  if (state.phase === GamePhase.PLAYING) {
    const bricksAliveBefore = state.bricks.filter(b => b.alive).length;
    let ballsAbovePaddle = false;
    for (const ball of state.balls) {
      if (ball.y < state.paddle.y) ballsAbovePaddle = true;
    }

    physics.update(state, dt);

    const bricksAliveAfter = state.bricks.filter(b => b.alive).length;
    const bricksDestroyed = bricksAliveBefore - bricksAliveAfter;

    if (bricksDestroyed > 0) {
      for (let i = 0; i < bricksDestroyed; i++) {
        renderer.playBrickDestroySound();
      }
    }

    for (const brick of state.bricks) {
      if (brick.flickering && brick.flickerTimer > 0.12 && brick.flickerTimer < 0.15) {
        renderer.playBrickHitSound();
      }
    }

    let ballsAbovePaddleNow = false;
    for (const ball of state.balls) {
      if (ball.y < state.paddle.y) ballsAbovePaddleNow = true;
    }
    if (lastBallAbovePaddle && !ballsAbovePaddleNow) {
      renderer.playPaddleBounceSound();
    }
    lastBallAbovePaddle = ballsAbovePaddleNow;

    if (state.lives < Math.ceil(bricksAliveBefore) && state.phase === GamePhase.GAME_OVER) {
      renderer.playLoseLifeSound();
    }
  }

  state.update(dt);

  if (state.phase === GamePhase.WIN && state.winAnimationTimer < dt * 2) {
    renderer.playWinSound();
    removeButtons();
    setTimeout(() => showRestartButton(), 3000);
  }

  if (state.phase === GamePhase.GAME_OVER) {
    if (!restartButton) showRestartButton();
  }

  renderer.render(state);
  requestAnimationFrame(enhancedGameLoop);
}

window.addEventListener('resize', resize);
resize();

showStartButton();

lastTime = performance.now();
requestAnimationFrame(enhancedGameLoop);
