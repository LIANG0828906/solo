import { MazeGenerator, type MazeData } from './MazeGenerator.js';
import { GameLogic } from './GameLogic.js';
import { Renderer } from './Renderer.js';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}

let maze: MazeData;
let logic: GameLogic;
let renderer: Renderer;
let lastTime = performance.now();
let frameCount = 0;
let fpsTimer = 0;
let fps = 60;
let running = true;

function init(): void {
  const genStart = performance.now();
  const generator = new MazeGenerator();
  maze = generator.generate();
  const genTime = performance.now() - genStart;
  console.log(`迷宫生成耗时: ${genTime.toFixed(2)}ms`);
  if (genTime > 200) {
    console.warn('迷宫生成超过200ms阈值!');
  }

  logic = new GameLogic(maze);
  renderer = new Renderer(canvas, logic);

  setupInput();
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function setupInput(): void {
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
         'e', 'q', 'b', 'tab'].includes(key)) {
      e.preventDefault();
      logic.handleKeyDown(e.key);
    }
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault();
      logic.handleKeyUp(e.key);
    }
  });

  window.addEventListener('blur', () => {
    logic.lastKeyPresses.clear();
    if (renderer.joystick) {
      renderer.joystick.active = false;
      renderer.joystick.dx = 0;
      renderer.joystick.dy = 0;
    }
  });
}

function applyJoystick(): void {
  const j = renderer.joystick;
  if (!j.active) {
    if (logic.lastKeyPresses.has('__joy_left__')) logic.handleKeyUp('a');
    if (logic.lastKeyPresses.has('__joy_right__')) logic.handleKeyUp('d');
    if (logic.lastKeyPresses.has('__joy_up__')) logic.handleKeyUp('w');
    if (logic.lastKeyPresses.has('__joy_down__')) logic.handleKeyUp('s');
    logic.lastKeyPresses.delete('__joy_left__');
    logic.lastKeyPresses.delete('__joy_right__');
    logic.lastKeyPresses.delete('__joy_up__');
    logic.lastKeyPresses.delete('__joy_down__');
    return;
  }
  const threshold = 0.25;
  const left = j.dx < -threshold;
  const right = j.dx > threshold;
  const up = j.dy < -threshold;
  const down = j.dy > threshold;

  if (left && !logic.lastKeyPresses.has('__joy_left__')) {
    logic.lastKeyPresses.add('__joy_left__');
    logic.handleKeyDown('a');
  } else if (!left && logic.lastKeyPresses.has('__joy_left__')) {
    logic.lastKeyPresses.delete('__joy_left__');
    logic.handleKeyUp('a');
  }

  if (right && !logic.lastKeyPresses.has('__joy_right__')) {
    logic.lastKeyPresses.add('__joy_right__');
    logic.handleKeyDown('d');
  } else if (!right && logic.lastKeyPresses.has('__joy_right__')) {
    logic.lastKeyPresses.delete('__joy_right__');
    logic.handleKeyUp('d');
  }

  if (up && !logic.lastKeyPresses.has('__joy_up__')) {
    logic.lastKeyPresses.add('__joy_up__');
    logic.handleKeyDown('w');
  } else if (!up && logic.lastKeyPresses.has('__joy_up__')) {
    logic.lastKeyPresses.delete('__joy_up__');
    logic.handleKeyUp('w');
  }

  if (down && !logic.lastKeyPresses.has('__joy_down__')) {
    logic.lastKeyPresses.add('__joy_down__');
    logic.handleKeyDown('s');
  } else if (!down && logic.lastKeyPresses.has('__joy_down__')) {
    logic.lastKeyPresses.delete('__joy_down__');
    logic.handleKeyUp('s');
  }
}

function gameLoop(now: number): void {
  if (!running) return;

  let delta = now - lastTime;
  if (delta > 100) delta = 100;
  lastTime = now;

  frameCount++;
  fpsTimer += delta;
  if (fpsTimer >= 1000) {
    fps = Math.round((frameCount * 1000) / fpsTimer);
    frameCount = 0;
    fpsTimer = 0;
  }

  const aiStart = performance.now();
  applyJoystick();
  logic.update(delta);
  const aiTime = performance.now() - aiStart;

  renderer.render(delta);

  if (aiTime > 10 && Math.random() < 0.05) {
    console.warn(`AI/逻辑更新耗时: ${aiTime.toFixed(2)}ms (超过10ms阈值)`);
  }

  requestAnimationFrame(gameLoop);
}

function handleVisibility(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      logic.lastKeyPresses.clear();
    } else {
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(gameLoop);
    }
  });
}

function showFps(): void {
  (window as unknown as { __getFps: () => number }).__getFps = () => fps;
}

init();
handleVisibility();
showFps();
