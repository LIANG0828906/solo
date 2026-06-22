import { UIController } from './uiController';

function initApp(): void {
  const container = document.getElementById('app');
  if (!container) {
    console.error('App container not found');
    return;
  }

  const canvas = container.querySelector('.preview-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Preview canvas not found');
    return;
  }

  const uiController = new UIController(canvas, container);
  
  uiController.renderColorStops();
  uiController.render();

  console.log('%c🎨 Gradient Studio 已初始化', 'color: #e94560; font-size: 16px; font-weight: bold;');
  console.log('%c支持线性、径向、锥形三种渐变类型', 'color: #a0a0c0; font-size: 12px;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
