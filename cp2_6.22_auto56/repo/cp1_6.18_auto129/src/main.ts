import { updateParticles, createParticle, wrapParticles } from './physics';
import { render } from './renderer';
import { initUI, updateStats } from './ui';
import type { Particle, ForceParams, SimulationStats, ParticleType } from './types';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let particles: Particle[] = [];
let forceParams: ForceParams = {
  gravityStrength: 0.5,
  repulsionRadius: 80,
  turbulenceAmplitude: 0.5,
};
let mouseX = 0;
let mouseY = 0;
let frameCount = 0;
let lastTime = 0;
let stats: SimulationStats = {
  splitsThisSecond: 0,
  eatsThisSecond: 0,
};
let splitRate = 0;
let eatRate = 0;
let lastStatUpdate = 0;
let currentSpawnType: ParticleType = 'producer';
let isMouseDown = false;
let spawnTimer = 0;

const INITIAL_PARTICLES = 200;
const MAX_PARTICLES = 500;

function init(): void {
  canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  mouseX = canvas.width / 2;
  mouseY = canvas.height / 2;

  createInitialParticles();

  initUI(forceParams, resetSimulation, (type) => {
    currentSpawnType = type;
  });

  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseUp);
  canvas.addEventListener('touchstart', handleTouchStart);
  canvas.addEventListener('touchmove', handleTouchMove);
  canvas.addEventListener('touchend', handleTouchEnd);

  lastTime = performance.now();
  lastStatUpdate = lastTime;
  requestAnimationFrame(gameLoop);
}

function resizeCanvas(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createInitialParticles(): void {
  particles = [];
  const types: ParticleType[] = ['producer', 'consumer', 'hunter'];
  const maxAttempts = INITIAL_PARTICLES * 20;
  let attempts = 0;

  while (particles.length < INITIAL_PARTICLES && attempts < maxAttempts) {
    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const newParticle = createParticle(x, y, type);

    let overlaps = false;
    for (const p of particles) {
      const dx = p.x - newParticle.x;
      const dy = p.y - newParticle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < p.radius + newParticle.radius + 2) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      particles.push(newParticle);
    }
    attempts++;
  }

  while (particles.length < INITIAL_PARTICLES) {
    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    particles.push(createParticle(x, y, type));
  }
}

function resetSimulation(): void {
  createInitialParticles();
  stats = { splitsThisSecond: 0, eatsThisSecond: 0 };
  splitRate = 0;
  eatRate = 0;
}

function handleMouseMove(e: MouseEvent): void {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
}

function handleMouseDown(e: MouseEvent): void {
  isMouseDown = true;
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  spawnParticle(mouseX, mouseY);
}

function handleMouseUp(): void {
  isMouseDown = false;
}

function handleTouchStart(e: TouchEvent): void {
  e.preventDefault();
  isMouseDown = true;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  mouseX = touch.clientX - rect.left;
  mouseY = touch.clientY - rect.top;
  spawnParticle(mouseX, mouseY);
}

function handleTouchMove(e: TouchEvent): void {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  mouseX = touch.clientX - rect.left;
  mouseY = touch.clientY - rect.top;
}

function handleTouchEnd(): void {
  isMouseDown = false;
}

function spawnParticle(x: number, y: number): void {
  if (particles.length < MAX_PARTICLES) {
    particles.push(createParticle(x, y, currentSpawnType));
  }
}

function gameLoop(currentTime: number): void {
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05);
  lastTime = currentTime;

  if (isMouseDown) {
    spawnTimer += deltaTime;
    if (spawnTimer > 0.05) {
      spawnTimer = 0;
      spawnParticle(mouseX, mouseY);
    }
  }

  particles = updateParticles(particles, mouseX, mouseY, forceParams, deltaTime, stats);
  wrapParticles(particles, canvas.width, canvas.height);

  render(ctx, particles, canvas.width, canvas.height, frameCount);

  if (currentTime - lastStatUpdate >= 1000) {
    splitRate = stats.splitsThisSecond;
    eatRate = stats.eatsThisSecond;
    stats.splitsThisSecond = 0;
    stats.eatsThisSecond = 0;
    lastStatUpdate = currentTime;
  }

  updateStats(particles, splitRate, eatRate);

  frameCount++;
  requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', init);
