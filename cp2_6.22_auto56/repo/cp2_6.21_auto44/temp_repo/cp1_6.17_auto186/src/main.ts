import { SceneManager } from './SceneManager';
import { OceanData } from './OceanData';
import { eventBus, APP_READY, SIMULATION_UPDATE, HEATMAP_UPDATE, FISH_CLICKED } from './EventBus';

let sceneManager: SceneManager | null = null;
let oceanData: OceanData | null = null;

function init(): void {
  sceneManager = new SceneManager('scene-container');
  oceanData = new OceanData();

  eventBus.on(APP_READY, () => {
    if (sceneManager && oceanData) {
      sceneManager.createFishes(oceanData.getFishes());
      sceneManager.start();

      setTimeout(() => {
        const container = document.getElementById('scene-container');
        const loading = document.getElementById('loading');
        if (container) {
          container.classList.add('ready');
        }
        if (loading) {
          loading.classList.add('hidden');
          setTimeout(() => {
            loading.remove();
          }, 500);
        }
      }, 300);
    }
  });

  setupUIControls();

  oceanData.start();
}

function setupUIControls(): void {
  const heatmapBtn = document.getElementById('heatmap-btn');
  if (heatmapBtn) {
    heatmapBtn.addEventListener('click', () => {
      if (sceneManager) {
        sceneManager.toggleHeatmap();
      }
    });
  }

  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (sceneManager) {
        sceneManager.resetCamera();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('beforeunload', () => {
  if (oceanData) {
    oceanData.stop();
  }
  if (sceneManager) {
    sceneManager.destroy();
  }
});
