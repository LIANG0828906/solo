import { Tablet } from './tablet';
import { Toolbar } from './toolbar';

function init() {
  const tabletCanvas = document.getElementById('tabletCanvas') as HTMLCanvasElement;
  const annotationCanvas = document.getElementById('annotationCanvas') as HTMLCanvasElement;
  const tabletContainer = document.getElementById('tabletContainer') as HTMLElement;

  if (!tabletCanvas || !annotationCanvas || !tabletContainer) {
    console.error('Required elements not found');
    return;
  }

  const tablet = new Tablet(tabletCanvas, annotationCanvas, tabletContainer, 1);
  new Toolbar(tablet);

  console.log('朝堂牙笏书写应用已启动');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
