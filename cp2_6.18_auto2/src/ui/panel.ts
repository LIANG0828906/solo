import { GUI } from 'dat.gui';
import type { CelestialBody, PhysicsParams } from '../utils/types';
import { EventBus } from '../core/bus';

interface PanelParams extends PhysicsParams {
  selectedName: string;
  selectedMass: number;
  selectedOrbit: number;
}

export class ControlPanel {
  private gui: GUI;
  private bus: EventBus;
  private params: PanelParams;
  private cachedBodies: Map<string, CelestialBody>;
  private mobileToggle: HTMLButtonElement | null;

  constructor(bus: EventBus, initialParams: PhysicsParams) {
    this.bus = bus;
    this.cachedBodies = new Map();
    this.mobileToggle = null;
    this.params = {
      gravitationalConstant: initialParams.gravitationalConstant,
      starMass: initialParams.starMass,
      selectedName: '—',
      selectedMass: 0,
      selectedOrbit: 0
    };

    this.gui = new GUI({ width: 280 });
    this.setupGUI();
    this.setupMobileToggle();
    this.subscribeEvents();
  }

  private setupGUI(): void {
    const physicsFolder = this.gui.addFolder('物理参数');
    physicsFolder.open();

    physicsFolder
      .add(this.params, 'gravitationalConstant', 0.1, 2.0, 0.01)
      .name('引力常数 G')
      .onChange(() => {
        this.emitParams();
      });

    physicsFolder
      .add(this.params, 'starMass', 1, 10, 0.1)
      .name('恒星质量')
      .onChange(() => {
        this.emitParams();
      });

    const infoFolder = this.gui.addFolder('选中星体信息');
    infoFolder.open();

    infoFolder.add(this.params, 'selectedName').name('名称').listen();
    (infoFolder
      .add(this.params, 'selectedMass')
      .name('质量')
      .listen() as unknown as { decimals: (n: number) => void }).decimals(3);
    (infoFolder
      .add(this.params, 'selectedOrbit')
      .name('轨道半径')
      .listen() as unknown as { decimals: (n: number) => void }).decimals(2);
  }

  private setupMobileToggle(): void {
    const btn = document.createElement('button');
    btn.className = 'mobile-toggle';
    btn.innerHTML = '☰';
    btn.title = '展开控制面板';
    btn.addEventListener('click', () => {
      const ac = document.querySelector('.dg.ac');
      if (ac) {
        ac.classList.toggle('mobile-open');
      }
    });
    document.body.appendChild(btn);
    this.mobileToggle = btn;
  }

  private subscribeEvents(): void {
    this.bus.on('bodies:update', (bodies) => {
      this.cachedBodies.clear();
      for (const body of bodies) {
        this.cachedBodies.set(body.id, body);
      }
    });

    this.bus.on('body:click', ({ body }) => {
      const fullBody = this.cachedBodies.get(body.id);
      if (fullBody) {
        this.params.selectedName = fullBody.name;
        this.params.selectedMass = fullBody.mass;
        this.params.selectedOrbit = fullBody.orbitRadius;
      }
    });
  }

  private emitParams(): void {
    this.bus.emit('params:update', {
      gravitationalConstant: this.params.gravitationalConstant,
      starMass: this.params.starMass
    });
  }

  public dispose(): void {
    this.gui.destroy();
    if (this.mobileToggle) {
      this.mobileToggle.remove();
    }
  }
}
