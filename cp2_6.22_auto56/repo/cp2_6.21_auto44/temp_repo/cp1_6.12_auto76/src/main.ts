import './styles.css';
import { SceneManager } from './renderer/SceneManager';
import { UIManager } from './ui/UIManager';

function main(): void {
  const canvas = document.getElementById('sceneCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const sceneManager = new SceneManager(canvas);
  const uiManager = new UIManager(sceneManager);

  function animate(): void {
    requestAnimationFrame(animate);
    sceneManager.render();
  }

  animate();

  console.log('🏙️ 微缩城市沙盘编辑器已启动');
  console.log('使用说明:');
  console.log('  - 左键拖拽: 平移视角');
  console.log('  - 滚轮: 缩放');
  console.log('  - 右键拖拽: 旋转视角');
  console.log('  - Delete键: 删除中心处物体');
  console.log('  - ESC: 取消选择');
}

window.addEventListener('DOMContentLoaded', main);
