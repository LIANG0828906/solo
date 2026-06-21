import { PathManager } from './PathManager';
import { MonsterAnimator } from './MonsterAnimator';
import { UIPanel } from './UIPanel';

interface Particle {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  startRadius: number;
  colorRgba: string;
  glowRgba: string;
}

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let canvasWidth: number = window.innerWidth;
let canvasHeight: number = window.innerHeight;

function resizeCanvas(): void {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
}
resizeCanvas();

const pathManager = new PathManager();
const monsterAnimator = new MonsterAnimator(pathManager);

const uiPanel = new UIPanel('controlPanel', 'infoPanel', {
  onSpeedChange: (speed: number) => monsterAnimator.setSpeed(speed),
  onProbabilityChange: (_prob: number) => {},
  onStart: () => monsterAnimator.start(),
  onStop: () => monsterAnimator.stop(),
  onReset: () => monsterAnimator.reset(),
  onClear: () => {
    pathManager.clear();
    monsterAnimator.reset();
  }
});

let selectedNodeId: number | null = null;
let draggingNodeId: number | null = null;
let particles: Particle[] = [];
let lastFrameTime: number = performance.now();
let particleLifetime: number = 0.3;

function setParticleLifetime(seconds: number): void {
  particleLifetime = seconds;
}

function spawnParticle(x: number, y: number, nodeId: number): void {
  const colors = pathManager.getNodeGlowColor(nodeId);
  particles.push({
    x,
    y,
    life: particleLifetime,
    maxLife: particleLifetime,
    startRadius: 8,
    colorRgba: colors.fill,
    glowRgba: colors.glow
  });
}

function updateParticles(deltaTime: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].life -= deltaTime;
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles(): void {
  for (const p of particles) {
    const t = p.life / p.maxLife;
    const radius = p.startRadius * t;
    const alpha = 0.8 * t;

    const baseColor = p.colorRgba.replace(/[\d.]+\)$/, `${alpha})`);
    const baseGlow = p.glowRgba.replace(/[\d.]+\)$/, `${Math.min(alpha * 1.2, 1)})`);

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = baseColor;
    ctx.shadowColor = baseGlow;
    ctx.shadowBlur = 10;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawBackground(): void {
  const gradient = ctx.createRadialGradient(
    canvasWidth / 2, canvasHeight / 2, 0,
    canvasWidth / 2, canvasHeight / 2, Math.max(canvasWidth, canvasHeight)
  );
  gradient.addColorStop(0, '#1a0e3a');
  gradient.addColorStop(0.5, '#0f0820');
  gradient.addColorStop(1, '#050210');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  for (let i = 0; i < 60; i++) {
    const sx = ((i * 137.5) % canvasWidth);
    const sy = ((i * 251.3) % canvasHeight);
    const sr = 0.5 + (i % 3) * 0.5;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(140, 80, 220, 0.06)';
  ctx.beginPath();
  ctx.arc(canvasWidth * 0.75, canvasHeight * 0.3, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(80, 140, 220, 0.05)';
  ctx.beginPath();
  ctx.arc(canvasWidth * 0.25, canvasHeight * 0.7, 250, 0, Math.PI * 2);
  ctx.fill();
}

function getCanvasCoords(e: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

canvas.addEventListener('mousedown', (e) => {
  const { x, y } = getCanvasCoords(e);
  const nodeId = pathManager.findNodeAt(x, y);

  if (nodeId !== null) {
    draggingNodeId = nodeId;
    selectedNodeId = nodeId;
  } else {
    if (selectedNodeId !== null) {
      pathManager.addNode(x, y, selectedNodeId);
    } else {
      const newId = pathManager.addNode(x, y);
      selectedNodeId = newId;
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const { x, y } = getCanvasCoords(e);

  if (draggingNodeId !== null) {
    pathManager.setNodePosition(draggingNodeId, x, y);
    spawnParticle(x, y, draggingNodeId);
  }
});

canvas.addEventListener('mouseup', () => {
  draggingNodeId = null;
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const { x, y } = getCanvasCoords(e);
  const nodeId = pathManager.findNodeAt(x, y);
  if (nodeId !== null) {
    pathManager.removeNode(nodeId);
    if (selectedNodeId === nodeId) {
      selectedNodeId = null;
    }
  }
});

window.addEventListener('resize', () => {
  resizeCanvas();
});

function frame(currentTime: number): void {
  const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.05);
  lastFrameTime = currentTime;

  pathManager.updateFlow(deltaTime);
  monsterAnimator.update(deltaTime);
  updateParticles(deltaTime);

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  drawBackground();
  pathManager.draw(ctx);
  drawParticles();
  monsterAnimator.draw(ctx);

  uiPanel.update(
    monsterAnimator.getState(),
    pathManager.getNodeCount(),
    monsterAnimator.isActive(),
    currentTime
  );

  requestAnimationFrame(frame);
}

if (pathManager.getNodeCount() === 0) {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const n1 = pathManager.addNode(cx - 250, cy);
  const n2 = pathManager.addNode(cx - 100, cy - 80, n1);
  const n3 = pathManager.addNode(cx + 50, cy, n2);
  pathManager.addNode(cx + 200, cy - 100, n3, 0.5);
  pathManager.addNode(cx + 200, cy + 100, n3, 0.5);
}

setParticleLifetime(0.3);

requestAnimationFrame(frame);
