import { GUI } from 'dat.gui';
import type { CelestialBody, PhysicsParams } from '../utils/types';
import { EventBus } from '../utils/eventBus';

interface PanelParams extends PhysicsParams {
  selectedBody: string;
  selectedName: string;
  selectedMass: number;
  selectedOrbit: number;
}

export class ControlPanel {
  private gui: GUI;
  private bus: EventBus;
  private params: PanelParams;
  private bodies: CelestialBody[];
  private mobileToggle: HTMLButtonElement | null;

  constructor(bus: EventBus, initialParams: PhysicsParams) {
    this.bus = bus;
    this.bodies = [];
    this.mobileToggle = null;
    this.params = {
      gravitationalConstant: initialParams.gravitationalConstant,
      starMass: initialParams.starMass,
      selectedBody: '—',
      selectedName: '—',
      selectedMass: 0,
      selectedOrbit: 0
    };

    this.gui = new GUI({ width: 280 });
    (this.gui as GUI & { title?: string }).title = '参数控制';
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
    (infoFolder.add(this.params, 'selectedMass').name('质量').listen() as unknown as { decimals: (n: number) => void }).decimals(3);
    (infoFolder.add(this.params, 'selectedOrbit').name('轨道半径').listen() as unknown as { decimals: (n: number) => void }).decimals(2);
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
      this.bodies = bodies;
    });

    this.bus.on('body:select', ({ bodyId }) => {
      if (bodyId) {
        const body = this.bodies.find((b) => b.id === bodyId);
        if (body) {
          this.params.selectedName = body.name;
          this.params.selectedMass = body.mass;
          this.params.selectedOrbit = body.orbitRadius;
        }
      } else {
        this.params.selectedName = '—';
        this.params.selectedMass = 0;
        this.params.selectedOrbit = 0;
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
