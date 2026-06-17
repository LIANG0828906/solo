import { Engine } from './engine';
import { Renderer } from './renderer';
import { UI } from './ui';

const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;display:block;';
document.body.appendChild(canvas);

const engine = new Engine();
const renderer = new Renderer(canvas);
const ui = new UI(engine, renderer);

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  renderer.resize(w, h);
  engine.resize(w, h);
}

resize();
window.addEventListener('resize', resize);

engine.init(canvas.width, canvas.height, 2000);
ui.createPanel();
ui.bindEvents(canvas);

let lastTime = performance.now();
let frameCount = 0;
let fps = 60;
let fpsAccum = 0;
let autoReducing = false;

function loop(now: number): void {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  engine.step(dt);
  renderer.render(engine);

  frameCount++;
  fpsAccum += dt;
  if (fpsAccum >= 0.5) {
    fps = frameCount / fpsAccum;
    frameCount = 0;
    fpsAccum = 0;
    ui.updateFPS(fps);

    if (fps < 30) {
      autoReducing = true;
      ui.showFPSWarning(true);
      const currentCount = engine.particles.length;
      const newCount = Math.max(500, currentCount - 50);
      engine.setParticleCount(newCount);

      const slider = document.getElementById('pf-particleCount') as HTMLInputElement;
      const valSpan = slider?.previousElementSibling as HTMLSpanElement;
      if (slider) {
        slider.value = String(newCount);
        if (valSpan) valSpan.textContent = String(newCount);
      }
    } else if (fps >= 45 && autoReducing) {
      autoReducing = false;
      ui.showFPSWarning(false);
    }
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
