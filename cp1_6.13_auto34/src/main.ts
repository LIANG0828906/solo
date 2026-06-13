import { MapRenderer } from './renderer/mapRenderer';
import { ControlPanel } from './ui/controlPanel';
import { ecosystem } from './core/ecosystem';

const canvas = document.getElementById('map-canvas') as HTMLCanvasElement;
const mapContainer = document.getElementById('map-container') as HTMLElement;
const panelContainer = document.getElementById('panel') as HTMLElement;

if (!canvas || !mapContainer || !panelContainer) {
  throw new Error('Required DOM elements not found');
}

const renderer = new MapRenderer(canvas, mapContainer);
const controlPanel = new ControlPanel(panelContainer);

ecosystem.start();
renderer.start();

window.addEventListener('beforeunload', () => {
  ecosystem.stop();
  renderer.stop();
  controlPanel.destroy();
});
