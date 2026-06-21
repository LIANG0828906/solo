import { Application } from '@pixi/app';
import { Renderer } from '@pixi/renderer';
import { ParticleEmitter } from './core/ParticleEmitter';
import { ParticleRenderer } from './core/ParticleRenderer';
import { ControlPanel } from './ui/ControlPanel';
import type { ParticleConfig } from './types';

const CANVAS_BG = 0x16213e;

async function main(): Promise<void> {
  const canvasContainer = document.getElementById('canvas-container')!;
  const controlPanelEl = document.getElementById('control-panel')!;
  const cardsContainer = document.getElementById('cards-container')!;
  const presetSelect = document.getElementById('preset-select') as HTMLSelectElement;
  const importBtn = document.getElementById('import-btn')!;
  const exportBtn = document.getElementById('export-btn')!;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const modeToggle = document.getElementById('mode-toggle')!;
  const particleCountEl = document.getElementById('particle-count')!;
  const fpsDisplayEl = document.getElementById('fps-display')!;

  const app = new Application({
    width: canvasContainer.clientWidth,
    height: canvasContainer.clientHeight,
    backgroundColor: CANVAS_BG,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  canvasContainer.insertBefore(app.view as HTMLCanvasElement, canvasContainer.firstChild);

  const defaultConfig: ParticleConfig = {
    emissionRate: 80,
    initialSpeed: 120,
    lifetime: 1.2,
    size: 8,
    spreadAngle: 30,
    startColor: '#ff6600',
    endColor: '#ff0044',
  };

  const emitter = new ParticleEmitter(defaultConfig);
  const renderer = new ParticleRenderer(canvasContainer.clientWidth, canvasContainer.clientHeight);

  app.stage.addChild(renderer.getDisplayObject());
  app.stage.sortableChildren = true;

  emitter.setCenter(canvasContainer.clientWidth / 2, canvasContainer.clientHeight / 2);

  const controlPanel = new ControlPanel(controlPanelEl, cardsContainer, presetSelect);

  controlPanel.setOnConfigChange((config: ParticleConfig) => {
    emitter.setConfig(config);
  });

  let isPlayMode = false;

  modeToggle.addEventListener('click', () => {
    isPlayMode = !isPlayMode;
    const editIcon = modeToggle.querySelector('.edit-icon') as SVGElement;
    const playIcon = modeToggle.querySelector('.play-icon') as SVGElement;

    if (isPlayMode) {
      modeToggle.classList.add('playing');
      editIcon.style.display = 'none';
      playIcon.style.display = 'block';
      controlPanel.lock();
    } else {
      modeToggle.classList.remove('playing');
      editIcon.style.display = 'block';
      playIcon.style.display = 'none';
      controlPanel.unlock();
    }
  });

  const presetManager = controlPanel.getPresetManager();

  exportBtn.addEventListener('click', () => {
    presetManager.exportConfig(controlPanel.getConfig());
  });

  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) {
      presetManager.importConfig(file, (config) => {
        controlPanel.setConfig(config, true);
      });
    }
    fileInput.value = '';
  });

  window.addEventListener('resize', () => {
    const w = canvasContainer.clientWidth;
    const h = canvasContainer.clientHeight;
    app.renderer.resize(w, h);
    renderer.resize(w, h);
    emitter.setCenter(w / 2, h / 2);
  });

  let lastTime = performance.now();
  let frameCount = 0;
  let fpsAccumulator = 0;
  let currentFps = 60;

  app.ticker.add(() => {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    frameCount++;
    fpsAccumulator += dt;
    if (fpsAccumulator >= 0.5) {
      currentFps = Math.round(frameCount / fpsAccumulator);
      fpsDisplayEl.textContent = String(currentFps);
      frameCount = 0;
      fpsAccumulator = 0;
    }

    emitter.update(dt);

    const particles = emitter.getActiveParticles();
    renderer.render(particles);

    particleCountEl.textContent = String(emitter.getActiveCount());
  });
}

main().catch(console.error);
