import { ParticleEngine } from './particleEngine';
import { SceneManager } from './sceneManager';
import { UIController } from './uiController';

const PARTICLE_COUNT = 3000;
const SPHERE_RADIUS = 50;

const engine = new ParticleEngine(PARTICLE_COUNT, SPHERE_RADIUS);
const container = document.getElementById('app')!;
const scene = new SceneManager(engine, container);
const ui = new UIController();

ui.setParamChangeCallback((params) => {
  engine.setTargetParams(params);
});

let lastTime = performance.now();
let frameCount = 0;
let fpsAccum = 0;
let displayFps = 0;

function loop() {
  requestAnimationFrame(loop);

  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  const events = engine.update(dt);
  if (events.length > 0) {
    ui.appendCollisionEvents(events);
  }

  scene.update();

  frameCount++;
  fpsAccum += dt;
  if (fpsAccum >= 0.5) {
    displayFps = Math.round(frameCount / fpsAccum);
    ui.updateFPS(displayFps);
    frameCount = 0;
    fpsAccum = 0;
  }
}

loop();
