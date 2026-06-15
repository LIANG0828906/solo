import './styles.css';
import * as THREE from 'three';
import { SceneManager } from './scene.js';
import { UIManager } from './ui.js';
import * as api from './api.js';
import type { GrowthStage } from './types.js';

const scene = new SceneManager();
const ui = new UIManager(scene, api);

let resizeTimeout: number | null = null;

const debouncedResize = () => {
  if (resizeTimeout !== null) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = window.setTimeout(() => {
    scene.resize();
    resizeTimeout = null;
  }, 150);
};

const onPlantDoubleClick = (
  plantId: string | null,
  _worldPoint: THREE.Vector3,
  screenX: number,
  screenY: number
) => {
  if (!plantId) {
    ui.hideInfoCard();
    return;
  }
  void ui.showInfoCard(plantId, screenX, screenY);
};

const onLoadProgress = (_progress: number) => {
  // progress tracking
};

const bootstrap = async () => {
  scene.init('canvas-container', onPlantDoubleClick, onLoadProgress);

  ui.onPlantSelected = async (plantId: string) => {
    ui.showLoading();
    try {
      ui.setSelectedPlant(plantId);
      await scene.loadPlant(plantId);
    } catch (e) {
      console.error('Failed to load selected plant:', e);
    } finally {
      ui.hideLoading();
    }
  };

  ui.onStageChanged = async (stage: GrowthStage) => {
    await scene.setGrowthStage(stage);
  };

  ui.onLightAngleChanged = (azimuth: number, elevation: number) => {
    scene.setLightAngle(azimuth, elevation);
  };

  try {
    await ui.initialize();

    const defaultPlant = ui.getDefaultPlantId();
    ui.setSelectedPlant(defaultPlant);
    ui.showLoading();
    try {
      await scene.loadPlant(defaultPlant);
    } finally {
      ui.hideLoading();
    }
  } catch (e) {
    console.error('UI initialization failed:', e);
    ui.hideLoading();
  }

  window.addEventListener('resize', debouncedResize);
  window.addEventListener('beforeunload', () => {
    scene.dispose();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  void bootstrap();
}
