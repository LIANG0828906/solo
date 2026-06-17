import { initScene, getScene, getCamera, getRenderer, getControls } from './scene';
import { initCityBuilder, setOnBuildingClick } from './cityBuilder';
import { initUI, showInfoCard, hideInfoCard } from './ui';

const container = document.getElementById('app');
if (!container) {
  throw new Error('App container not found');
}

const { scene, camera, renderer, controls } = initScene(container);

initCityBuilder(scene);

setOnBuildingClick((building) => {
  showInfoCard(building);
});

renderer.domElement.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  if (target.closest('#control-panel') || target.closest('#playback-bar') || target.closest('.info-card')) {
    return;
  }
});

initUI();

function animate(): void {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
