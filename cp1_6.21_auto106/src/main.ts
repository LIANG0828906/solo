import { SceneManager } from './sceneManager';
import { UIController } from './uiController';
import type { ColorTheme } from './particleSystem';

const DEFAULT_THEME: ColorTheme = {
  name: '极光青紫',
  colors: ['#00BCD4', '#E91E63', '#9C27B0'],
};
const DEFAULT_COUNT = 5000;

const container = document.getElementById('root');
if (!container) {
  throw new Error('找不到 #root 容器元素');
}

const sceneManager = new SceneManager(container, DEFAULT_THEME, DEFAULT_COUNT);
const uiController = new UIController(container, sceneManager);

uiController.init().catch((err) => {
  console.warn('UI 控制器初始化警告:', err);
});

const clock = {
  startTime: performance.now(),
  lastTime: performance.now(),
};

function animate(): void {
  requestAnimationFrame(animate);

  const now = performance.now();
  const time = (now - clock.startTime) / 1000;
  const delta = Math.min((now - clock.lastTime) / 1000, 0.05);
  clock.lastTime = now;

  sceneManager.update(time, delta);
}

animate();

window.addEventListener('beforeunload', () => {
  sceneManager.dispose();
});
