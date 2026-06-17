import './styles/main.css';
import { EventBus } from './utils/eventBus';
import { PhysicsEngine } from './core/engine';
import { SceneRenderer } from './core/renderer';
import { ControlPanel } from './ui/panel';
import { InfoCard } from './ui/infoCard';

class StellarSandbox {
  private container: HTMLElement;
  private bus: EventBus;
  private engine: PhysicsEngine;
  private renderer: SceneRenderer;
  private panel: ControlPanel;
  private infoCard: InfoCard;

  constructor() {
    const appEl = document.getElementById('app');
    if (!appEl) {
      throw new Error('App container #app not found');
    }
    this.container = appEl;

    this.bus = new EventBus();

    this.engine = new PhysicsEngine(this.bus);

    this.renderer = new SceneRenderer(this.container, this.bus);
    this.renderer.createBodies(this.engine.getBodies());

    this.panel = new ControlPanel(this.bus, this.engine.getParams());

    this.infoCard = new InfoCard(this.container, this.bus, this.engine);

    this.engine.start();

    window.addEventListener('beforeunload', this.dispose.bind(this));
  }

  private dispose(): void {
    this.engine.stop();
    this.renderer.dispose();
    this.panel.dispose();
    this.infoCard.dispose();
    this.bus.clear();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new StellarSandbox();
});
