import { EventType, ManeuverType, ScoreResult, eventBus } from './modules/EventBus.js';
import { UniverseManager, Planet } from './modules/UniverseManager.js';
import { SimulationEngine } from './modules/SimulationEngine.js';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const universe = new UniverseManager();
const engine = new SimulationEngine();

const $ = (id: string): HTMLElement => document.getElementById(id)!;
const statSpeed = $('stat-speed') as HTMLElement;
const statFuel = $('stat-fuel') as HTMLElement;
const statManeuver = $('stat-maneuver') as HTMLElement;
const statTrailLength = $('stat-traillength') as HTMLElement;
const addPlanetBtn = $('add-planet-btn') as HTMLButtonElement;
const planetTooltip = $('planet-tooltip') as HTMLElement;
const maneuverMenu = $('maneuver-menu') as HTMLElement;
const resultPanel = $('result-panel') as HTMLElement;
const resTrail = $('res-trail') as HTMLElement;
const resFuel = $('res-fuel') as HTMLElement;
const resManeuver = $('res-maneuver') as HTMLElement;
const resScore = $('res-score') as HTMLElement;
const restartBtn = $('restart-btn') as HTMLButtonElement;
const startHint = $('start-hint') as HTMLElement;

let viewportW = 0, viewportH = 0;
let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

function resizeCanvas(): void {
  viewportW = window.innerWidth;
  viewportH = window.innerHeight;
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(viewportW * dpr);
  canvas.height = Math.floor(viewportH * dpr);
  canvas.style.width = viewportW + 'px';
  canvas.style.height = viewportH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  universe.setViewport(viewportW, viewportH);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ---------- Drag state ----------
type DragState = 'none' | 'launch';
let dragState: DragState = 'none';
let dragStartX = 0, dragStartY = 0;
let dragCurX = 0, dragCurY = 0;
const DRAG_MAX_PX = 200;
const VEL_SCALE = 2.6;

// ---------- Game state ----------
let gameSettled = false;
let pendingManeuverPos: { x: number; y: number } | null = null;

// ---------- Init ----------
function initGame(): void {
  universe.reset();
  const start = universe.randomCraftStart();
  engine.reset(start.x, start.y);
  gameSettled = false;
  pendingManeuverPos = null;
  resultPanel.classList.remove('show');
  maneuverMenu.style.display = 'none';
  startHint.style.display = 'block';
  updateAddPlanetButton();
  updateStatusPanel({ speed: 0, fuel: 100, maneuverCount: 0, trailLength: 0 });
}

eventBus.on(EventType.CRAFT_STATE_UPDATED, (s) => {
  updateStatusPanel(s);
});
eventBus.on(EventType.FUEL_CHANGED, (f) => {
  statFuel.textContent = f.toFixed(0);
});
eventBus.on(EventType.TARGET_REACHED, (r: ScoreResult) => {
  onTargetReached(r);
});

function updateAddPlanetButton(): void {
  addPlanetBtn.disabled = universe.planets.length >= universe.maxPlanets;
}
addPlanetBtn.addEventListener('click', () => {
  if (universe.addPlanet()) {
    updateAddPlanetButton();
  }
});

function updateStatusPanel(s: { speed: number; fuel: number; maneuverCount: number; trailLength: number }): void {
  statSpeed.textContent = s.speed.toFixed(2);
  statFuel.textContent = s.fuel.toFixed(0);
  statManeuver.textContent = String(s.maneuverCount);
  statTrailLength.textContent = Math.round(s.trailLength).toString();
}

function onTargetReached(r: ScoreResult): void {
  gameSettled = true;
  resTrail.textContent = r.trailLength + ' px';
  resFuel.textContent = r.fuelRemaining + '%';
  resManeuver.textContent = String(r.maneuverCount);
  resScore.textContent = String(r.totalScore);
  resultPanel.classList.add('show');
}

restartBtn.addEventListener('click', initGame);

// ---------- Mouse handling ----------
function canvasCoords(e: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function distanceToCraft(x: number, y: number): number {
  return Math.hypot(x - engine.craft.x, y - engine.craft.y);
}

canvas.addEventListener('mousedown', (e) => {
  if (gameSettled) return;
  const { x, y } = canvasCoords(e);

  // Try maneuver menu
  if (engine.launched && !engine.settled) {
    const mp = findManeuverPointAt(x, y);
    if (mp) {
      activateManeuverPoint(mp.id, x, y);
      return;
    }
    const tp = engine.findNearestTrailPoint(x, y, 14);
    if (tp && engine.craft.fuel > 0) {
      const created = engine.addManeuverPoint(tp.x, tp.y);
      if (created) {
        activateManeuverPoint(created.id, tp.x, tp.y);
      }
      return;
    }
    hideManeuverMenu();
    engine.activeManeuverId = null;
  }

  // Try launch
  if (!engine.launched && distanceToCraft(x, y) < 30) {
    dragState = 'launch';
    dragStartX = engine.craft.x;
    dragStartY = engine.craft.y;
    dragCurX = x; dragCurY = y;
    startHint.style.display = 'none';
  }
});

canvas.addEventListener('mousemove', (e) => {
  const { x, y } = canvasCoords(e);

  if (dragState === 'launch') {
    dragCurX = x; dragCurY = y;
  }

  // Planet tooltip
  const planet = universe.findPlanetAt(x, y);
  if (planet) {
    universe.hoveredPlanetId = planet.id;
    showPlanetTooltip(planet, e.clientX, e.clientY);
  } else {
    universe.hoveredPlanetId = null;
    planetTooltip.style.display = 'none';
  }
});

canvas.addEventListener('mouseup', () => {
  if (dragState === 'launch') {
    dragState = 'none';
    let dx = dragCurX - dragStartX;
    let dy = dragCurY - dragStartY;
    const len = Math.hypot(dx, dy);
    if (len < 3) return;
    const clamped = Math.min(DRAG_MAX_PX, len);
    const scale = (clamped / len) * VEL_SCALE;
    engine.setInitialVelocity(dx * scale, dy * scale);
  }
});

canvas.addEventListener('mouseleave', () => {
  universe.hoveredPlanetId = null;
  planetTooltip.style.display = 'none';
});

document.addEventListener('mousedown', (e) => {
  // Click outside to close maneuver menu
  const target = e.target as HTMLElement;
  if (!maneuverMenu.contains(target) && target !== canvas) {
    // Still allow clicks on buttons/panels
    if (target.closest('#ui-layer')) {
      if (target.closest('#maneuver-menu') || target.closest('#result-panel')
        || target.closest('#add-planet-btn')) return;
    }
  }
});

// ---------- Planet tooltip ----------
function showPlanetTooltip(p: Planet, screenX: number, screenY: number): void {
  planetTooltip.innerHTML = `
    <div class="t-name">${p.name}</div>
    <div><span class="t-label">轨道半径:</span> ${Math.round(p.semiMajorAxis)} px</div>
    <div><span class="t-label">离心率:</span> ${p.eccentricity.toFixed(2)}</div>
    <div><span class="t-label">引力范围:</span> ${Math.round(p.influenceRadius)} px</div>
  `;
  const offset = 16;
  let left = screenX + offset;
  let top = screenY + offset;
  const rect = planetTooltip.getBoundingClientRect();
  const w = rect.width || 180, h = rect.height || 90;
  if (left + w > window.innerWidth) left = screenX - w - offset;
  if (top + h > window.innerHeight) top = screenY - h - offset;
  planetTooltip.style.left = left + 'px';
  planetTooltip.style.top = top + 'px';
  planetTooltip.style.display = 'block';
}

// ---------- Maneuver menu ----------
function findManeuverPointAt(x: number, y: number) {
  for (const mp of engine.maneuverPoints) {
    const dx = mp.x - x, dy = mp.y - y;
    if (dx * dx + dy * dy <= 14 * 14) return mp;
  }
  return null;
}

function activateManeuverPoint(id: string, x: number, y: number): void {
  if (engine.craft.fuel <= 0) return;
  engine.activeManeuverId = id;
  pendingManeuverPos = { x, y };
  maneuverMenu.style.display = 'block';
  maneuverMenu.style.left = x + 'px';
  maneuverMenu.style.top = y + 'px';
}

function hideManeuverMenu(): void {
  maneuverMenu.style.display = 'none';
  pendingManeuverPos = null;
}

maneuverMenu.querySelectorAll('.maneuver-sector').forEach(el => {
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const action = (el as HTMLElement).dataset.action as ManeuverType;
    if (!action || !engine.activeManeuverId) return;
    engine.executeManeuver(engine.activeManeuverId, action);
    engine.activeManeuverId = null;
    hideManeuverMenu();
  });
});

// ---------- Launch velocity arrow rendering ----------
function renderLaunchArrow(): void {
  if (dragState !== 'launch') return;
  const dx = dragCurX - dragStartX;
  const dy = dragCurY - dragStartY;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const clamped = Math.min(DRAG_MAX_PX, len);
  const ratio = clamped / DRAG_MAX_PX;
  const nx = dx / len, ny = dy / len;
  const ex = dragStartX + nx * clamped;
  const ey = dragStartY + ny * clamped;

  const grad = ctx.createLinearGradient(dragStartX, dragStartY, ex, ey);
  const r1 = parseInt('3A', 16), g1 = parseInt('86', 16), b1 = parseInt('FF', 16);
  const r2 = parseInt('FF', 16), g2 = parseInt('00', 16), b2 = parseInt('6E', 16);
  const mr = Math.round(r1 + (r2 - r1) * ratio);
  const mg = Math.round(g1 + (g2 - g1) * ratio);
  const mb = Math.round(b1 + (b2 - b1) * ratio);
  grad.addColorStop(0, `rgb(${r1},${g1},${b1})`);
  grad.addColorStop(1, `rgb(${mr},${mg},${mb})`);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3;
  ctx.shadowColor = `rgba(${mr},${mg},${mb},0.5)`;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(dragStartX, dragStartY);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  const ah = 10;
  const aw = 7;
  const perpX = -ny, perpY = nx;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - nx * ah + perpX * aw, ey - ny * ah + perpY * aw);
  ctx.lineTo(ex - nx * ah - perpX * aw, ey - ny * ah - perpY * aw);
  ctx.closePath();
  ctx.fillStyle = `rgb(${mr},${mg},${mb})`;
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.restore();

  const speedDisplay = (clamped * VEL_SCALE).toFixed(0);
  ctx.save();
  ctx.font = "12px 'Courier New', monospace";
  ctx.fillStyle = '#AADDAA';
  ctx.fillText(`v ≈ ${speedDisplay} px/s`, ex + 12, ey - 8);
  ctx.restore();
}

// ---------- Main loop ----------
let lastTime = performance.now();

function tick(now: number): void {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  universe.update(dt);
  const res = engine.update(
    dt,
    universe.getGravityField(),
    universe.getStarGravity(),
    { x: universe.target.x, y: universe.target.y, radius: universe.target.radius }
  );
  if (res) { /* handled via event */ }

  ctx.fillStyle = '#0A0A1A';
  ctx.fillRect(0, 0, viewportW, viewportH);

  drawStarfieldBackdrop();

  universe.render(ctx);
  engine.render(ctx);
  renderLaunchArrow();

  requestAnimationFrame(tick);
}

// Subtle star backdrop
function drawStarfieldBackdrop(): void {
  ctx.save();
  const n = 120;
  const w = viewportW, h = viewportH;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < n; i++) {
    const sx = pseudoRandom(i * 91.73) * w;
    const sy = pseudoRandom(i * 31.17 + 7) * h;
    const sz = 0.4 + pseudoRandom(i * 17.3 + 3) * 1.1;
    const a = 0.15 + pseudoRandom(i * 5.7 + 1) * 0.45;
    ctx.globalAlpha = a;
    ctx.fillRect(sx, sy, sz, sz);
  }
  ctx.restore();
}
function pseudoRandom(seed: number): number {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

// Kick off
initGame();
requestAnimationFrame(tick);

// Expose for debugging (optional)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__game = { universe, engine };
