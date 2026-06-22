import './styles.css';

import { EventBus } from './EventBus.js';
import { ClimateDataSimulator } from './ClimateDataSimulator.js';
import { SceneManager } from './SceneManager.js';
import { UIManager } from './UIManager.js';

interface AppContext {
  bus: EventBus;
  simulator: ClimateDataSimulator;
  scene: SceneManager;
  ui: UIManager;
  dispose: () => void;
}

function bootstrap(): AppContext {
  const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement | null;
  const uiRoot = document.getElementById('ui-root') as HTMLElement | null;

  if (!canvas) {
    throw new Error('Cannot find #scene-canvas element');
  }
  if (!uiRoot) {
    throw new Error('Cannot find #ui-root element');
  }

  const bus = new EventBus();
  const simulator = new ClimateDataSimulator();
  const scene = new SceneManager(canvas, bus, simulator);
  const ui = new UIManager(uiRoot, bus);

  ui.init();
  scene.init();

  const dispose = () => {
    scene.dispose();
    ui.dispose();
  };

  (window as unknown as { __climateApp?: AppContext }).__climateApp = {
    bus,
    simulator,
    scene,
    ui,
    dispose,
  };

  return { bus, simulator, scene, ui, dispose };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
