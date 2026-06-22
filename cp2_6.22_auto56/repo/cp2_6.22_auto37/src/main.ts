import { CellScene } from './CellScene';

function init(): void {
  const container = document.getElementById('app');
  if (!container) {
    console.error('容器元素 #app 未找到');
    return;
  }

  const scene = new CellScene(container);
  scene.start();

  window.addEventListener('beforeunload', () => {
    scene.dispose();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
