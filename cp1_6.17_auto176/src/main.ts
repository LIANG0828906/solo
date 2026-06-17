import { sceneManager } from './scene/SceneManager';
import { drawEngine } from './draw/DrawEngine';
import { animationController } from './animation/AnimationController';
import { uiManager } from './ui/UIManager';

function init(): void {
  const canvasContainer = document.getElementById('canvas-container');
  const appContainer = document.getElementById('app');
  
  if (!canvasContainer || !appContainer) {
    console.error('Container elements not found');
    return;
  }

  try {
    sceneManager.init(canvasContainer);
    drawEngine.init();
    animationController.init();
    uiManager.init(appContainer);
    
    uiManager.updateTimelineFrames();
    
    console.log('光痕记忆盒 - 初始化完成');
    console.log('操作说明:');
    console.log('- 按住鼠标左键拖动绘制光迹');
    console.log('- 按住鼠标右键拖动旋转视角');
    console.log('- 滚轮缩放视图');
    console.log('- 双击时间轴帧进入编辑模式');
    console.log('- 编辑模式下点击选择光迹，Delete键删除');
  } catch (error) {
    console.error('初始化失败:', error);
    alert('初始化失败，请检查浏览器是否支持WebGL');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
