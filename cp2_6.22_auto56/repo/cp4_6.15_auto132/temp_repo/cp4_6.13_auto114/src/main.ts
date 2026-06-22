import { Particle } from './physics/Particle';
import { SPHSolver, SPHParams } from './physics/SPHSolver';
import { CollisionSystem, Polygon, createDefaultPolygons } from './physics/CollisionSystem';
import { Renderer } from './rendering/Renderer';
import { UIHandler } from './rendering/UIHandler';

const MAX_PARTICLES = 4000;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

function resizeCanvas(): { width: number; height: number } {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: w, height: h };
}

let bounds = resizeCanvas();

const initialParams: SPHParams & { emitRate: number } = {
  gravity: 30,
  viscosity: 50,
  particleRadius: 4,
  emitRate: 8,
};

const particles: Particle[] = [];
const polygons: Polygon[] = createDefaultPolygons(bounds.width, bounds.height);

const sphSolver = new SPHSolver({
  gravity: initialParams.gravity,
  viscosity: initialParams.viscosity,
  particleRadius: initialParams.particleRadius,
});
sphSolver.setParticles(particles);

const collision = new CollisionSystem();
collision.setParticles(particles);
collision.setPolygons(polygons);

const renderer = new Renderer(canvas, {
  particleRadius: initialParams.particleRadius,
  bounds,
});

const ui = new UIHandler(canvas, initialParams);

ui.onHitTest = (x, y) => collision.hitTestPolygon(x, y);
ui.onGetPolygonCenter = (i) => polygons[i].center;
ui.onPolygonDragStart = (i) => {
  polygons[i].dragging = true;
};
ui.onPolygonDragMove = (i, pos) => {
  collision.movePolygon(i, pos);
};
ui.onPolygonDragEnd = (i) => {
  polygons[i].dragging = false;
};

window.addEventListener('resize', () => {
  bounds = resizeCanvas();
  renderer.setState({ bounds });
  const oldPolys = polygons.length;
  if (oldPolys === 0) {
    const newPolys = createDefaultPolygons(bounds.width, bounds.height);
    for (const p of newPolys) polygons.push(p);
    collision.setPolygons(polygons);
  }
});

let lastTime = performance.now();
const fixedDt = 1 / 60;
let accumulator = 0;

function loop(now: number): void {
  const frameDt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  accumulator += frameDt;

  sphSolver.params.gravity = ui.params.gravity;
  sphSolver.params.viscosity = ui.params.viscosity;
  sphSolver.params.particleRadius = ui.params.particleRadius;
  renderer.setState({ particleRadius: ui.params.particleRadius, bounds });

  const newParticles = ui.tick();
  for (const p of newParticles) {
    if (particles.length < MAX_PARTICLES) {
      particles.push(p);
    }
  }

  let steps = 0;
  while (accumulator >= fixedDt && steps < 3) {
    sphSolver.step(fixedDt, bounds);
    collision.resolve();
    const splashes = collision.getSplashParticles();
    for (const s of splashes) {
      if (particles.length < MAX_PARTICLES) particles.push(s);
    }
    collision.resetPolygonVelocity();
    accumulator -= fixedDt;
    steps++;
  }

  const stats = renderer.render(particles, polygons, frameDt);
  ui.updateHUD(stats.particleCount, stats.fps);

  while (particles.length > MAX_PARTICLES) {
    particles.shift();
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
