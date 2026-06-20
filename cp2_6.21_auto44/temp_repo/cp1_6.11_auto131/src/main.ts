import { CityRenderer, CityParams, CANVAS_WIDTH, CANVAS_HEIGHT } from './cityRenderer';
import { UIController } from './uiController';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('cityCanvas') as HTMLCanvasElement;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const initialParams: CityParams = {
    density: 50,
    neonBrightness: 70,
    skyHue: 280,
    heightOffset: 0,
    roadBrightness: 50,
    fogIntensity: 40
  };

  const renderer = new CityRenderer(canvas, initialParams);
  const uiController = new UIController(renderer);

  renderer.generateCity();
  renderer.startAnimation();
});
