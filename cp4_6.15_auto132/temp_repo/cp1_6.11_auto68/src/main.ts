import { AudioEngine } from './audioEngine';
import { Visualizer } from './visualizer';
import { UIController } from './uiController';

function initApp(): void {
  const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('找不到 mainCanvas 元素');
  }

  const audioEngine = new AudioEngine();
  const visualizer = new Visualizer(canvas, audioEngine);
  const uiController = new UIController({ audioEngine, visualizer });

  visualizer.draw();

  window.addEventListener('beforeunload', () => {
    visualizer.stop();
    audioEngine.destroy();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
