import { SceneManager } from './scene';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }
  
  const sceneManager = new SceneManager(canvas);
  sceneManager.start();
  
  window.addEventListener('beforeunload', () => {
    sceneManager.dispose();
  });
});