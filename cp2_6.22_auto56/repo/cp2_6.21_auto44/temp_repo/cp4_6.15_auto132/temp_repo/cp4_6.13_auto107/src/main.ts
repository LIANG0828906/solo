import { generatePointCloud } from './DataModule/pointCloudLoader';
import { sceneRenderer } from './RenderModule/sceneRenderer';
import { controlPanel } from './UI/controlPanel';
import { interactionManager } from './UI/interactionManager';

function bootstrap(): void {
  const canvasContainer = document.getElementById('canvas-container');
  const sidebarContainer = document.getElementById('sidebar-container');
  if (!canvasContainer || !sidebarContainer) {
    console.error('[point-cloud] 缺少容器元素');
    return;
  }

  const data = generatePointCloud();

  sceneRenderer.init({ container: canvasContainer, data });
  controlPanel.init({ container: sidebarContainer, data });
  interactionManager.init(sceneRenderer.renderer.domElement);

  sceneRenderer.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
