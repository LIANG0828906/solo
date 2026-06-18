import { Renderer } from './renderer';
import { FleetManager } from './fleet';
import { EventManager } from './events';
import { dataState } from './dataspace';

const VIRTUAL_WIDTH = 800;
const VIRTUAL_HEIGHT = 600;
const STAR_COUNT = 75;
const TOPBAR_HEIGHT = 40;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new Renderer(canvas, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
const fleetManager = new FleetManager();
const eventManager = new EventManager(fleetManager);

let lastTime = performance.now();
let isDragging = false;

function init(): void {
  dataState.initStars(STAR_COUNT, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  fleetManager.createInitialFleet(80, VIRTUAL_HEIGHT / 2);
  eventManager.generateNebulas(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  eventManager.generateWormholes(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  dataState.addLog('舰队已部署，等待跃迁命令...');

  window.addEventListener('resize', onResize);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);
  canvas.addEventListener('click', onClick);

  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);

  loop();
}

function onResize(): void {
  renderer.resize();
}

function getCanvasCoordinates(e: MouseEvent | Touch): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function handlePointerMove(screenX: number, screenY: number): void {
  const virtual = renderer.screenToVirtual(screenX, screenY);
  const clampedX = Math.max(10, Math.min(VIRTUAL_WIDTH - 10, virtual.x));
  const clampedY = Math.max(TOPBAR_HEIGHT + 10, Math.min(VIRTUAL_HEIGHT - 10, virtual.y));
  dataState.setGuidePosition(clampedX, clampedY);
}

function onMouseMove(e: MouseEvent): void {
  const coords = getCanvasCoordinates(e);

  const inWarpBtn = renderer.isPointInWarpButton(coords.x, coords.y);
  renderer.setButtonHovered(inWarpBtn && !renderer.isButtonPressed());

  if (isDragging || !renderer.isSmallScreen() || !renderer.getLogPanelCollapsed()) {
    if (!renderer.isPointInWarpButton(coords.x, coords.y) &&
        !renderer.isPointInLogIcon(coords.x, coords.y) &&
        !renderer.isPointInTopbarIcon(coords.x, coords.y)) {
      handlePointerMove(coords.x, coords.y);
    }
  }

  if (isDragging) {
    handlePointerMove(coords.x, coords.y);
  }
}

function onMouseDown(e: MouseEvent): void {
  const coords = getCanvasCoordinates(e);

  if (renderer.isPointInWarpButton(coords.x, coords.y)) {
    renderer.setButtonPressed(true);
    return;
  }

  isDragging = true;
}

function onMouseUp(e: MouseEvent): void {
  const coords = getCanvasCoordinates(e);

  if (renderer.isButtonPressed()) {
    if (renderer.isPointInWarpButton(coords.x, coords.y)) {
      triggerWarpExploration();
    }
    renderer.setButtonPressed(false);
  }

  isDragging = false;
}

function onClick(e: MouseEvent): void {
  const coords = getCanvasCoordinates(e);

  if (renderer.isPointInLogIcon(coords.x, coords.y)) {
    renderer.toggleLogPanel();
    return;
  }

  if (renderer.isPointInTopbarIcon(coords.x, coords.y)) {
    renderer.toggleTopbar();
    return;
  }
}

function onTouchMove(e: TouchEvent): void {
  if (e.touches.length > 0) {
    e.preventDefault();
    const touch = e.touches[0];
    const coords = getCanvasCoordinates(touch);
    handlePointerMove(coords.x, coords.y);
  }
}

function onTouchStart(e: TouchEvent): void {
  if (e.touches.length > 0) {
    e.preventDefault();
    const touch = e.touches[0];
    const coords = getCanvasCoordinates(touch);

    if (renderer.isPointInWarpButton(coords.x, coords.y)) {
      renderer.setButtonPressed(true);
      return;
    }

    if (renderer.isPointInLogIcon(coords.x, coords.y)) {
      renderer.toggleLogPanel();
      return;
    }

    if (renderer.isPointInTopbarIcon(coords.x, coords.y)) {
      renderer.toggleTopbar();
      return;
    }

    handlePointerMove(coords.x, coords.y);
  }
}

function onTouchEnd(e: TouchEvent): void {
  if (e.changedTouches.length > 0) {
    const touch = e.changedTouches[0];
    const coords = getCanvasCoordinates(touch);

    if (renderer.isButtonPressed()) {
      if (renderer.isPointInWarpButton(coords.x, coords.y)) {
        triggerWarpExploration();
      }
      renderer.setButtonPressed(false);
    }
  }
}

function triggerWarpExploration(): void {
  eventManager.generateNebulas(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  eventManager.generateWormholes(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  eventManager.resetSchedule();
  dataState.addLog('跃迁探索开始：新星域生成完毕');
}

function loop(): void {
  const currentTime = performance.now();
  let deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  if (deltaTime > 0.1) deltaTime = 0.1;

  eventManager.update(deltaTime, currentTime, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  fleetManager.update(deltaTime, currentTime);
  renderer.render(currentTime);

  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
