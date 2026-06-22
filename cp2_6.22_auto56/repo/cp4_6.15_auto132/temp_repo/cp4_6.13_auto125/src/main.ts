import './style.css';
import { LightSource } from './lightSource';
import { Mirror } from './mirror';
import { Renderer, RendererSettings } from './renderer';
import { UIController } from './uiController';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const defaultLights: LightSource[] = [
  new LightSource(150, 180, 15, 30, { r: 255, g: 60, b: 80 }, true, '红色光源'),
  new LightSource(150, 320, 0, 30, { r: 60, g: 255, b: 100 }, true, '绿色光源'),
  new LightSource(150, 460, -15, 30, { r: 60, g: 140, b: 255 }, true, '蓝色光源')
];

const defaultMirrors: Mirror[] = [
  new Mirror(450, 180, 140, 14, 25, 'rectangle'),
  new Mirror(500, 400, 140, 14, -20, 'rectangle'),
  new Mirror(650, 300, 110, 80, 180, 'triangle')
];

for (const m of defaultMirrors) m.opacity = 0.7;

const lights: LightSource[] = defaultLights;
const mirrors: Mirror[] = defaultMirrors;

const settings: RendererSettings = {
  showRayPaths: false,
  mirrorOpacity: 0.7
};

const renderer = new Renderer(canvas, lights, mirrors, settings);
const ui = new UIController(lights, mirrors, renderer, settings);

type DragMode = 'none' | 'light' | 'mirror' | 'rotateLight' | 'rotateMirror';

interface DragState {
  mode: DragMode;
  objectId: number | null;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origAngle: number;
}

const drag: DragState = {
  mode: 'none',
  objectId: null,
  startX: 0,
  startY: 0,
  origX: 0,
  origY: 0,
  origAngle: 0
};

let needsRender = true;
let lastFrameTime = performance.now();
let frameCount = 0;
let fpsAccum = 0;
let currentFPS = 60;
let fpsUpdateTimer = 0;

function markDirty(): void {
  needsRender = true;
}

ui.requestRender = markDirty;

function getCanvasPos(clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function findLightAt(x: number, y: number): LightSource | null {
  for (let i = lights.length - 1; i >= 0; i--) {
    if (lights[i].containsPoint(x, y)) return lights[i];
  }
  return null;
}

function findMirrorAt(x: number, y: number): Mirror | null {
  for (let i = mirrors.length - 1; i >= 0; i--) {
    if (mirrors[i].containsPoint(x, y)) return mirrors[i];
  }
  return null;
}

function findLightRotationHandle(x: number, y: number): LightSource | null {
  for (let i = lights.length - 1; i >= 0; i--) {
    if (lights[i].isOnRotationHandle(x, y)) return lights[i];
  }
  return null;
}

function findMirrorRotationHandle(x: number, y: number): Mirror | null {
  for (let i = mirrors.length - 1; i >= 0; i--) {
    if (mirrors[i].isOnRotationHandle(x, y)) return mirrors[i];
  }
  return null;
}

function updateCursorForPosition(cx: number, cy: number): void {
  if (drag.mode !== 'none') return;
  const pos = getCanvasPos(cx, cy);
  if (findLightRotationHandle(pos.x, pos.y) || findMirrorRotationHandle(pos.x, pos.y)) {
    canvas.style.cursor = 'grab';
    return;
  }
  const light = findLightAt(pos.x, pos.y);
  const mirror = findMirrorAt(pos.x, pos.y);
  if (light || mirror) {
    canvas.style.cursor = 'move';
  } else {
    canvas.style.cursor = 'crosshair';
  }
}

canvas.addEventListener('mousedown', (e: MouseEvent): void => {
  if (e.button !== 0) return;
  const pos = getCanvasPos(e.clientX, e.clientY);

  const rotLight = findLightRotationHandle(pos.x, pos.y);
  if (rotLight) {
    drag.mode = 'rotateLight';
    drag.objectId = rotLight.id;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.origAngle = rotLight.angle;
    drag.origX = rotLight.x;
    drag.origY = rotLight.y;
    renderer.selectedObjectId = rotLight.id;
    markDirty();
    return;
  }

  const rotMirror = findMirrorRotationHandle(pos.x, pos.y);
  if (rotMirror) {
    drag.mode = 'rotateMirror';
    drag.objectId = rotMirror.id;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.origAngle = rotMirror.angle;
    drag.origX = rotMirror.x;
    drag.origY = rotMirror.y;
    renderer.selectedObjectId = rotMirror.id;
    markDirty();
    return;
  }

  const light = findLightAt(pos.x, pos.y);
  if (light) {
    drag.mode = 'light';
    drag.objectId = light.id;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.origX = light.x;
    drag.origY = light.y;
    renderer.selectedObjectId = light.id;
    markDirty();
    return;
  }

  const mirror = findMirrorAt(pos.x, pos.y);
  if (mirror) {
    drag.mode = 'mirror';
    drag.objectId = mirror.id;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.origX = mirror.x;
    drag.origY = mirror.y;
    renderer.selectedObjectId = mirror.id;
    markDirty();
    return;
  }

  renderer.selectedObjectId = null;
  markDirty();
});

window.addEventListener('mousemove', (e: MouseEvent): void => {
  updateCursorForPosition(e.clientX, e.clientY);

  const rect = canvas.getBoundingClientRect();
  const onCanvas =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if (onCanvas) {
    const pos = getCanvasPos(e.clientX, e.clientY);
    renderer.hoveredObjectId = null;
    const hl = findLightAt(pos.x, pos.y);
    if (hl) renderer.hoveredObjectId = hl.id;
    const hm = findMirrorAt(pos.x, pos.y);
    if (hm) renderer.hoveredObjectId = hm.id;
    markDirty();

    ui.updateColorInfo(e.clientX, e.clientY, pos.x, pos.y);
  } else {
    ui.hideColorInfo();
  }

  if (drag.mode === 'none' || drag.objectId === null) return;

  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / canvasRect.width;
  const scaleY = CANVAS_HEIGHT / canvasRect.height;
  const ddx = (e.clientX - drag.startX) * scaleX;
  const ddy = (e.clientY - drag.startY) * scaleY;

  if (drag.mode === 'light') {
    const target = lights.find(l => l.id === drag.objectId);
    if (target) {
      target.x = Math.max(10, Math.min(CANVAS_WIDTH - 10, drag.origX + ddx));
      target.y = Math.max(10, Math.min(CANVAS_HEIGHT - 10, drag.origY + ddy));
      markDirty();
      syncLightAngleToUI(target);
    }
  } else if (drag.mode === 'mirror') {
    const target = mirrors.find(m => m.id === drag.objectId);
    if (target) {
      target.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, drag.origX + ddx));
      target.y = Math.max(20, Math.min(CANVAS_HEIGHT - 20, drag.origY + ddy));
      markDirty();
    }
  } else if (drag.mode === 'rotateLight') {
    const target = lights.find(l => l.id === drag.objectId);
    if (target) {
      const a1 = Math.atan2(drag.startY - canvasRect.top - drag.origY / scaleY, drag.startX - canvasRect.left - drag.origX / scaleX);
      const a2 = Math.atan2(e.clientY - canvasRect.top - drag.origY / scaleY, e.clientX - canvasRect.left - drag.origX / scaleX);
      const deg = drag.origAngle + ((a2 - a1) * 180) / Math.PI;
      target.angle = deg;
      markDirty();
      syncLightAngleToUI(target);
    }
  } else if (drag.mode === 'rotateMirror') {
    const target = mirrors.find(m => m.id === drag.objectId);
    if (target) {
      const a1 = Math.atan2(drag.startY - canvasRect.top - drag.origY / scaleY, drag.startX - canvasRect.left - drag.origX / scaleX);
      const a2 = Math.atan2(e.clientY - canvasRect.top - drag.origY / scaleY, e.clientX - canvasRect.left - drag.origX / scaleX);
      target.angle = drag.origAngle + ((a2 - a1) * 180) / Math.PI;
      markDirty();
    }
  }
});

window.addEventListener('mouseup', (): void => {
  drag.mode = 'none';
  drag.objectId = null;
});

canvas.addEventListener('mouseleave', (): void => {
  renderer.hoveredObjectId = null;
  ui.hideColorInfo();
  markDirty();
});

canvas.addEventListener('contextmenu', (e: Event): void => {
  e.preventDefault();
});

function syncLightAngleToUI(light: LightSource): void {
  const input = document.querySelector(`input[type="number"][data-angle-id="${light.id}"]`) as HTMLInputElement | null;
  if (input) {
    let display = light.angle % 360;
    if (display < 0) display += 360;
    input.value = Math.round(display).toString();
  }
}

function renderLoop(timestamp: number): void {
  const delta = timestamp - lastFrameTime;
  lastFrameTime = timestamp;
  frameCount++;
  fpsAccum += delta;
  fpsUpdateTimer += delta;

  if (fpsAccum >= 500) {
    currentFPS = (frameCount * 1000) / fpsAccum;
    frameCount = 0;
    fpsAccum = 0;
    if (fpsUpdateTimer >= 1000) {
      ui.updateFPS(currentFPS);
      fpsUpdateTimer = 0;
    }
  }

  if (needsRender) {
    renderer.render();
    needsRender = false;
  }

  requestAnimationFrame(renderLoop);
}

markDirty();
requestAnimationFrame(renderLoop);

setTimeout((): void => {
  if (lights.length < 3) return;
  const totalMirrorsNeeded = 8;
  const addl = totalMirrorsNeeded - mirrors.length;
  for (let i = 0; i < addl; i++) {
    const shape: 'rectangle' | 'triangle' = i % 3 === 2 ? 'triangle' : 'rectangle';
    const w = shape === 'rectangle' ? 100 + Math.random() * 60 : 80 + Math.random() * 40;
    const h = shape === 'rectangle' ? 12 + Math.random() * 6 : 50 + Math.random() * 30;
    const m = new Mirror(
      250 + Math.random() * 500,
      80 + Math.random() * 450,
      w, h,
      (Math.random() - 0.5) * 180,
      shape
    );
    m.opacity = settings.mirrorOpacity;
    mirrors.push(m);
  }
  markDirty();
}, 2000);

declare global {
  interface Window {
    opticsLab: {
      lights: LightSource[];
      mirrors: Mirror[];
      renderer: Renderer;
      ui: UIController;
      settings: RendererSettings;
      canvas: HTMLCanvasElement;
      markDirty: () => void;
      forceRender: () => void;
      benchmarkRender: (count?: number) => { totalMs: number; avgMs: number; fps: number };
    };
  }
}

window.opticsLab = {
  lights,
  mirrors,
  renderer,
  ui,
  settings,
  canvas,
  markDirty,
  forceRender: () => {
    renderer.render();
  },
  benchmarkRender: (count: number = 100) => {
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      renderer.render();
    }
    const elapsed = performance.now() - start;
    return {
      totalMs: elapsed,
      avgMs: elapsed / count,
      fps: 1000 / (elapsed / count)
    };
  }
};

export {
  lights,
  mirrors,
  renderer,
  ui,
  settings,
  canvas,
  drag,
  markDirty,
  getCanvasPos,
  findLightAt,
  findMirrorAt,
  syncLightAngleToUI,
  currentFPS
};
