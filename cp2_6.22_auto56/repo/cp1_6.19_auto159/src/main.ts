import { SceneSetup } from './visual/scene';
import { ParticleRenderer } from './visual/renderer';
import { PhysicsEngine } from './physics/engine';
import { ControlPanel } from './ui/controlPanel';
import { PhysicsStats } from './physics/engine';

class App {
  private sceneSetup: SceneSetup;
  private renderer: ParticleRenderer;
  private engine: PhysicsEngine;
  private controlPanel: ControlPanel;
  private statusEl: HTMLElement;
  private lastTime: number = 0;
  private running: boolean = true;

  constructor() {
    const container = document.getElementById('canvas-wrapper')!;
    this.sceneSetup = new SceneSetup(container);
    this.renderer = new ParticleRenderer(this.sceneSetup);
    this.engine = new PhysicsEngine();
    this.controlPanel = new ControlPanel();
    this.statusEl = document.getElementById('status-info')!;

    this.setupKeyboard();
    this.animate(0);
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      switch (e.key.toLowerCase()) {
        case 'a':
          this.engine.addParticle();
          this.controlPanel.setParticleCount(this.engine.particles.length);
          break;
        case 'd':
          this.engine.removeParticle();
          this.controlPanel.setParticleCount(this.engine.particles.length);
          break;
        case 'r':
          this.sceneSetup.resetView();
          break;
      }
    });
  }

  private animate = (time: number): void => {
    if (!this.running) return;

    const dt = this.lastTime === 0 ? 0.016 : (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.engine.update(dt);
    this.renderer.update(this.engine.particles);
    this.sceneSetup.update();
    this.updateStatus();

    requestAnimationFrame(this.animate);
  };

  private updateStatus(): void {
    const stats = this.engine.getStats();
    const dir = stats.electricDirection;
    this.statusEl.innerHTML = `
      <div><span class="label">粒子总数:</span> <span class="value">${stats.count}</span></div>
      <div><span class="label">平均动能:</span> <span class="value">${stats.avgKineticEnergy.toFixed(2)}</span></div>
      <div><span class="label">电场强度:</span> <span class="value">${stats.electricStrength.toFixed(1)}</span></div>
      <div><span class="label">磁场强度:</span> <span class="value">${stats.magneticStrength.toFixed(1)}</span></div>
      <div><span class="label">电场方向:</span> <span class="value">(${dir.x.toFixed(1)}, ${dir.y.toFixed(1)}, ${dir.z.toFixed(1)})</span></div>
    `;
  }
}

new App();
