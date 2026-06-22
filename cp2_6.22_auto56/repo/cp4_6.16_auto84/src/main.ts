import { StarScene } from './components/StarScene';
import { UIOverlay } from './components/UIOverlay';
import { useStarStore } from './stores/starStore';
import { constellations, StarData } from './utils/starData';

async function initApp() {
  const container = document.getElementById('app');
  if (!container) {
    console.error('Container #app not found');
    return;
  }

  const store = useStarStore;
  await store.getState().init();

  const starScene = new StarScene(container);
  const uiOverlay = new UIOverlay(container, starScene);

  starScene.loadConstellations(constellations);

  starScene.setOnStarSelect((star: StarData | null) => {
    store.getState().setSelectedStar(star);
  });

  starScene.setSeason('spring');
  starScene.start();

  window.addEventListener('beforeunload', () => {
    starScene.dispose();
    uiOverlay.dispose();
  });
}

initApp().catch(console.error);
