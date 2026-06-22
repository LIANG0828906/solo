import { GameEngine } from './engine';
import { SpriteManager } from './sprites';
import { UIRenderer } from './ui';

const CANVAS_ID = 'gameCanvas';
const UI_CONTAINER_ID = 'uiContainer';

interface AppState {
  engine: GameEngine;
  spriteManager: SpriteManager;
  renderer: UIRenderer;
  renderLoop: number;
}

let state: AppState | null = null;

function bootstrap(): void {
  if (state) return;

  const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement | null;
  const uiContainer = document.getElementById(UI_CONTAINER_ID) as HTMLElement | null;

  if (!canvas) {
    console.error(`[BrainwaveSync] Canvas element #${CANVAS_ID} not found`);
    return;
  }
  if (!uiContainer) {
    console.error(`[BrainwaveSync] UI container #${UI_CONTAINER_ID} not found`);
    return;
  }

  const engine = new GameEngine();
  const spriteManager = new SpriteManager();
  const renderer = new UIRenderer(engine, spriteManager, canvas, uiContainer);

  state = {
    engine,
    spriteManager,
    renderer,
    renderLoop: 0,
  };

  setupFragmentCollectPipeline(engine, spriteManager);
  setupKeyboardHandlers(engine, renderer);
  setupUIButtons(engine, renderer);

  state.renderLoop = requestAnimationFrame(renderFrame);

  console.info('[BrainwaveSync] Brainwave Sync Trainer initialized');
}

function setupFragmentCollectPipeline(engine: GameEngine, spriteManager: SpriteManager): void {
  engine.on('fragmentCollect', (count: number) => {
    if (count <= 0) {
      spriteManager.initFragments();
      return;
    }
    const total = spriteManager.getTotalFragments();
    const current = spriteManager.getCollectedCount();
    if (count > current && count <= total) {
      for (let i = current; i < count; i++) {
        const { w, h } = state!.renderer.getLogicalSize();
        spriteManager.collectFragment(i, w, h);
      }
    }
  });
}

function setupKeyboardHandlers(engine: GameEngine, renderer: UIRenderer): void {
  const keyListener = (e: KeyboardEvent): void => {
    if (e.repeat) return;

    const key = e.key;
    const upper = key.toUpperCase();

    if (upper === ' ' || upper === 'ENTER') {
      e.preventDefault();
      if (!engine.isRunning() && !state?.engine.isPaused()) {
        const startOverlay = document.getElementById('startOverlay');
        if (startOverlay && !startOverlay.classList.contains('hidden')) {
          startOverlay.classList.add('hidden');
          engine.start();
        }
      } else if (engine.isRunning()) {
        const paused = !engine.isPaused();
        if (paused) {
          engine.pause();
          const pauseBtn = document.getElementById('pauseBtn');
          if (pauseBtn) pauseBtn.textContent = '继 续';
        } else {
          engine.resume();
          const pauseBtn = document.getElementById('pauseBtn');
          if (pauseBtn) pauseBtn.textContent = '暂 停';
        }
      }
      return;
    }

    if (upper === 'ESCAPE') {
      if (engine.isRunning()) {
        const paused = !engine.isPaused();
        if (paused) {
          engine.pause();
          const pauseBtn = document.getElementById('pauseBtn');
          if (pauseBtn) pauseBtn.textContent = '继 续';
        } else {
          engine.resume();
          const pauseBtn = document.getElementById('pauseBtn');
          if (pauseBtn) pauseBtn.textContent = '暂 停';
        }
      }
      return;
    }

    const result = engine.handleKeyPress(key);
    renderer.handleKeyDown(key);

    if (result) {
      e.preventDefault();
    }
  };

  const keyUpListener = (e: KeyboardEvent): void => {
    const key = e.key;
    engine.handleKeyRelease(key);
    renderer.handleKeyUp(key);
  };

  window.addEventListener('keydown', keyListener);
  window.addEventListener('keyup', keyUpListener);
}

function setupUIButtons(engine: GameEngine, renderer: UIRenderer): void {
  renderer.onStartClick(() => {
    renderer.resetForRestart();
    engine.start();
  });

  renderer.onRestartClick(() => {
    renderer.resetForRestart();
    engine.start();
  });

  renderer.onPauseClick((_paused: boolean) => {
    // pause state handled inside UIRenderer callback
  });
}

function renderFrame(now: number): void {
  if (!state) return;
  state.renderLoop = requestAnimationFrame(renderFrame);
  try {
    state.renderer.render();
  } catch (err) {
    console.error('[BrainwaveSync] Render error:', err);
  }
  void now;
}

function teardown(): void {
  if (!state) return;
  cancelAnimationFrame(state.renderLoop);
  state.engine.stop();
  state.renderer.destroy();
  state = null;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}

declare global {
  interface ImportMeta {
    hot?: {
      accept(): void;
      accept(deps: string[], callback: () => void): void;
      dispose(callback: () => void): void;
    };
  }
}

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    teardown();
  });
}
