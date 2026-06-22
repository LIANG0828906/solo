import { ShoeConfigurator } from './shoeConfigurator';
import { UIController } from './uiController';

const container = document.getElementById('three-container');
if (!container) {
  throw new Error('Three.js container not found');
}

const configurator = new ShoeConfigurator(container);
const uiController = new UIController(configurator);

uiController.init();
configurator.startAnimationLoop();
