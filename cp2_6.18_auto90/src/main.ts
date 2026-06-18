import { SceneManager } from './SceneManager';

const app = document.getElementById('app');
if (!app) {
  throw new Error('Could not find app container');
}

const sceneManager = new SceneManager(app);
sceneManager.start();

window.addEventListener('beforeunload', () => {
  sceneManager.dispose();
});
