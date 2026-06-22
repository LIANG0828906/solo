import { SceneManager, EARTH_RADIUS } from './moduleA/SceneManager';
import { PlateMotion } from './moduleA/PlateMotion';
import { DataLoader } from './moduleB/DataLoader';
import { QuakeBubbleManager } from './moduleB/QuakeBubbleManager';
import { UIModule } from './moduleB/UIModule';

const container = document.getElementById('canvas-container');
if (!container) throw new Error('Canvas container not found');

const uiLayer = document.getElementById('ui-layer')!;

const sceneManager = new SceneManager(container);
const scene = sceneManager.getScene();
const camera = sceneManager.getCamera();
const earthGroup = sceneManager.getEarthGroup();

const dataLoader = new DataLoader();
const uiModule = new UIModule(uiLayer);

const quakeBubbleManager = new QuakeBubbleManager(
  scene,
  camera,
  earthGroup,
  uiModule
);

const plateMotion = new PlateMotion(scene, camera, earthGroup);

const allRecords = dataLoader.loadAll();
quakeBubbleManager.loadData(allRecords);

sceneManager.addTickCallback((dt: number) => {
  plateMotion.update(dt);
  quakeBubbleManager.update(dt);

  if (plateMotion.isPlaying()) {
    uiModule.updateTimeDisplay(plateMotion.getCurrentTime());
  }

  const visibleCount = quakeBubbleManager.getVisibleCount();
  const latest = quakeBubbleManager.getLatestQuake();
  const stats = quakeBubbleManager.getMagnitudeStats();
  uiModule.updateStats(visibleCount, latest, stats);
});

uiModule.onAnimationToggle((playing: boolean) => {
  if (playing) {
    plateMotion.start();
    uiModule.showTip('板块漂移动画已开启');
  } else {
    plateMotion.stop();
    uiModule.showTip('板块漂移动画已停止');
  }
});

uiModule.onSpeedChange((speed: number) => {
  plateMotion.setSpeed(speed);
});

uiModule.onTimeChange((time: number) => {
  plateMotion.stop();
  plateMotion.setCurrentTime(time);

  const btnAnimation = document.getElementById('btn-animation') as HTMLButtonElement;
  if (btnAnimation) {
    btnAnimation.classList.remove('active');
    btnAnimation.textContent = '开启动画';
  }
});

container.addEventListener('click', (event: MouseEvent) => {
  quakeBubbleManager.handleClick(event);
});

uiLayer.addEventListener('quakeDeselect', () => {
  quakeBubbleManager.deselectBubble();
});

uiModule.showTip('拖拽旋转地球 · 右键平移 · 滚轮缩放 · 点击气泡查看详情');

sceneManager.animate();
