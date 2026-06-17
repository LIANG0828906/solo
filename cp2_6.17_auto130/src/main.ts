import { EventBus } from './types';
import { PhysicsEngine } from './core/engine';
import { SceneRenderer } from './core/renderer';
import { ControlPanel } from './ui/panel';
import { InfoCard } from './ui/infoCard';

class StellarSandboxApp {
  private eventBus: EventBus;
  private engine: PhysicsEngine;
  private renderer: SceneRenderer;
  private panel: ControlPanel;
  private infoCard: InfoCard;
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('canvas-container') as HTMLElement;

    if (!this.container) {
      throw new Error('Canvas container not found');
    }

    this.eventBus = new EventBus();
    this.renderer = new SceneRenderer(this.container, this.eventBus);
    this.panel = new ControlPanel(this.eventBus);
    this.infoCard = new InfoCard(this.eventBus);
    this.engine = new PhysicsEngine(this.eventBus);

    this.start();
  }

  private start(): void {
    this.eventBus.emit('engine:start');
    console.log('🚀 StellarSandbox 已启动');
    console.log('📡 数据总线已建立，各模块通过事件通信');
    console.log('   ┌─────────────┐    配置变更     ┌─────────────┐');
    console.log('   │  UI 面板     │ ─────────────► │  物理引擎    │');
    console.log('   └─────────────┘                 └─────────────┘');
    console.log('         ▲                                │');
    console.log('         │ 选中星体信息              星体状态 │');
    console.log('         │                                ▼');
    console.log('   ┌─────────────┐    点击事件     ┌─────────────┐');
    console.log('   │  信息卡片    │ ◄───────────── │  3D 渲染器   │');
    console.log('   └─────────────┘                 └─────────────┘');
  }

  getEngine(): PhysicsEngine {
    return this.engine;
  }

  destroy(): void {
    this.eventBus.emit('engine:stop');
    this.engine.stop();
    this.renderer.destroy();
    this.panel.destroy();
    this.infoCard.destroy();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new StellarSandboxApp();

  (window as unknown as { app?: StellarSandboxApp }).app = app;
});
