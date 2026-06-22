import { AccountingEngine } from './accountingEngine';
import { UIManager } from './uiManager';

function init(): void {
  const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const engine = new AccountingEngine();
  const uiManager = new UIManager(canvas, engine);

  function resize(): void {
    const app = document.getElementById('app');
    if (!app) return;

    const title = document.querySelector('.title') as HTMLElement;
    const titleHeight = title ? title.offsetHeight + 20 : 60;

    const availableHeight = window.innerHeight - titleHeight - 60;
    const availableWidth = window.innerWidth - 40;

    const width = Math.max(800, Math.min(1400, availableWidth));
    const height = Math.max(500, Math.min(900, availableHeight));

    uiManager.resize(width, height);
  }

  resize();
  window.addEventListener('resize', resize);

  addTimeSlider(uiManager, engine);

  uiManager.start();

  console.log('古钱庄账房模拟系统已启动');
  console.log('模块调用关系:');
  console.log('  main.ts → 初始化 AccountingEngine 和 UIManager');
  console.log('  UIManager → 调用 AccountingEngine 处理业务逻辑');
  console.log('  AccountingEngine → 数据变更时通知 UIManager 更新界面');
  console.log('数据流向:');
  console.log('  用户输入 → UIManager → AccountingEngine → 状态更新 → UIManager 重绘');
}

function addTimeSlider(uiManager: UIManager, engine: AccountingEngine): void {
  const controls = document.createElement('div');
  controls.className = 'controls';

  const label = document.createElement('span');
  label.textContent = '时间回溯:';
  label.style.color = '#2C1810';
  label.style.fontFamily = "'Noto Serif SC', serif";
  label.style.fontSize = '14px';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '100';
  slider.value = '100';
  slider.className = 'time-slider';

  let isDraggingSlider = false;

  slider.addEventListener('mousedown', () => {
    isDraggingSlider = true;
  });

  slider.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value) / 100;
    uiManager.setTimeSlider(value);
  });

  slider.addEventListener('mouseup', () => {
    isDraggingSlider = false;
    uiManager.startReplay();
  });

  slider.addEventListener('touchstart', () => {
    isDraggingSlider = true;
  });

  slider.addEventListener('touchend', () => {
    isDraggingSlider = false;
    uiManager.startReplay();
  });

  controls.appendChild(label);
  controls.appendChild(slider);

  const app = document.getElementById('app');
  if (app) {
    app.appendChild(controls);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
