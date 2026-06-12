import { SceneManager } from './scene/SceneManager';
import { ControlPanel } from './ui/ControlPanel';
import './styles/global.css';

function initApp(): void {
  const sceneContainer = document.getElementById('scene-container');
  if (!sceneContainer) {
    console.error('Scene container not found');
    return;
  }

  const brandTitle = document.createElement('div');
  brandTitle.className = 'brand-title';
  brandTitle.innerHTML = 'Molecule <span>3D</span> Visualizer';
  document.getElementById('ui-layer')?.appendChild(brandTitle);

  const sceneManager = new SceneManager(sceneContainer);
  sceneManager.showMolecule('H2O');

  const controlPanel = new ControlPanel(sceneManager);

  window.addEventListener('beforeunload', () => {
    sceneManager.dispose();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
