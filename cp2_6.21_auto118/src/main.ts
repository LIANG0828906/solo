import { initScene } from './scene';
import { interaction } from './interaction';
import { ui } from './ui';

const app = document.getElementById('app');
if (!app) {
  throw new Error('App container not found');
}

initScene(app);
interaction.init(app);
ui.init(app);
